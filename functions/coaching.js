/**
 * Sovereign Earn v2 – Coaching Cloud Functions (Production)
 * 
 * Features:
 * - acceptCoachingRequest: Sensei akzeptiert Request, prüft maxStudents, setzt Status auf accepted
 * - completeCoachingRequest: Sensei schliesst ab, transferiert Coins (10% Plattform-Fee), setzt Status auf completed
 * - rejectCoachingRequest: Sensei lehnt ab, gibt reservierte Coins frei
 * - cancelCoachingRequest: Player bricht ab, gibt reservierte Coins frei
 * - timeoutCoachingRequests: 7 Tage nach Accept wird Request automatisch cancelled
 * 
 * Anforderungen:
 * - firebase-functions, firebase-admin
 * - WORKAI_API_KEY und WORKAI_A2A_ENDPOINT als Firebase Secrets
 * - Coins nur serverseitig ändern, idempotent, fail-closed
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// === Konstanten ===
const PLATFORM_FEE_PERCENT = 0.10; // 10% Plattform-Fee
const COACHING_TIMEOUT_DAYS = 7;

/**
 * acceptCoachingRequest
 * 
 * Nur der Sensei darf seinen eigenen Request akzeptieren.
 * Prüft:
 * - Request existiert und ist pending
 * - Sensei ist verifiziert und bietet Coaching an
 * - maxStudents wird nicht überschritten (zahlt aktive accepted/coaching Requests)
 * 
 * Status: pending → accepted
 */
exports.acceptCoachingRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }

  const { requestId } = data || {};
  if (!requestId) {
    throw new functions.https.HttpsError('invalid-argument', 'requestId is required');
  }

  const senseiId = context.auth.uid;
  const requestRef = db.collection('coachingRequests').doc(requestId);

  return db.runTransaction(async (t) => {
    const requestDoc = await t.get(requestRef);
    if (!requestDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Coaching request not found');
    }

    const request = requestDoc.data();

    if (request.status !== 'pending') {
      throw new functions.https.HttpsError('failed-precondition', 'Request is not pending');
    }

    if (request.senseiId !== senseiId) {
      throw new functions.https.HttpsError('permission-denied', 'Only the assigned Sensei can accept this request');
    }

    const senseiRef = db.collection('users').doc(senseiId);
    const senseiDoc = await t.get(senseiRef);
    if (!senseiDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Sensei not found');
    }

    const sensei = senseiDoc.data();
    if (!sensei.isVerifiedSensei || !sensei.offersPaidCoaching) {
      throw new functions.https.HttpsError('failed-precondition', 'Sensei is not verified or does not offer coaching');
    }

    // maxStudents prüfen: zaele aktive accepted/coaching Requests
    const activeRequestsSnap = await db.collection('coachingRequests')
      .where('senseiId', '==', senseiId)
      .where('status', 'in', ['accepted', 'coaching'])
      .get();

    const maxStudents = sensei.maxStudents || 3;
    if (activeRequestsSnap.size >= maxStudents) {
      throw new functions.https.HttpsError('failed-precondition', 'Maximum number of students reached');
    }

    // Akzeptieren
    t.update(requestRef, {
      status: 'accepted',
      acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      timeoutAt: new Date(Date.now() + COACHING_TIMEOUT_DAYS * 24 * 60 * 60 * 1000)
    });

    return { success: true, requestId };
  });
});

/**
 * completeCoachingRequest
 * 
 * Nur der Sensei darf abschliessen.
 * Transferiert Coins:
 * - player.coins -= priceCoins
 * - platform.coins += priceCoins * PLATFORM_FEE_PERCENT (optional, hier nur als Log)
 * - sensei.coins += priceCoins * (1 - PLATFORM_FEE_PERCENT)
 * - player.reservedCoins -= priceCoins
 * 
 * Status: accepted → completed
 * Idempotenz: completedAt wird gesetzt, mehrfaches Aufrufen ist safe
 */
exports.completeCoachingRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }

  const { requestId } = data || {};
  if (!requestId) {
    throw new functions.https.HttpsError('invalid-argument', 'requestId is required');
  }

  const senseiId = context.auth.uid;
  const requestRef = db.collection('coachingRequests').doc(requestId);

  return db.runTransaction(async (t) => {
    const requestDoc = await t.get(requestRef);
    if (!requestDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Coaching request not found');
    }

    const request = requestDoc.data();

    if (request.status !== 'accepted') {
      throw new functions.https.HttpsError('failed-precondition', 'Request is not in accepted status');
    }

    if (request.senseiId !== senseiId) {
      throw new functions.https.HttpsError('permission-denied', 'Only the assigned Sensei can complete this request');
    }

    const playerRef = db.collection('users').doc(request.playerId);
    const senseiRef = db.collection('users').doc(senseiId);

    const playerDoc = await t.get(playerRef);
    const senseiDoc = await t.get(senseiRef);

    if (!playerDoc.exists || !senseiDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Player or Sensei not found');
    }

    const player = playerDoc.data();
    const sensei = senseiDoc.data();

    const priceCoins = request.priceCoins || 0;
    if (priceCoins <= 0) {
      throw new functions.https.HttpsError('failed-precondition', 'Invalid priceCoins');
    }

    // Idempotenz-Check
    if (request.completedAt) {
      return { success: true, requestId, alreadyCompleted: true };
    }

    // Coins transferieren
    const platformFee = Math.floor(priceCoins * PLATFORM_FEE_PERCENT);
    const senseiEarnings = priceCoins - platformFee;

    const newPlayerCoins = (player.coins || 0) - priceCoins;
    const newPlayerReservedCoins = (player.reservedCoins || 0) - priceCoins;

    if (newPlayerCoins < 0) {
      throw new functions.https.HttpsError('failed-precondition', 'Player has insufficient coins');
    }

    const newSenseiCoins = (sensei.coins || 0) + senseiEarnings;

    t.update(playerRef, {
      coins: newPlayerCoins,
      reservedCoins: newPlayerReservedCoins
    });

    t.update(senseiRef, {
      coins: newSenseiCoins,
      coachingEarnings: (sensei.coachingEarnings || 0) + senseiEarnings,
      coachingCount: (sensei.coachingCount || 0) + 1
    });

    t.update(requestRef, {
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      platformFee,
      senseiEarnings,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      requestId,
      platformFee,
      senseiEarnings
    };
  });
});

/**
 * rejectCoachingRequest
 * 
 * Nur der Sensei darf ablehnen.
 * Gibt reservierte Coins frei.
 * Status: pending → rejected
 */
exports.rejectCoachingRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }

  const { requestId } = data || {};
  if (!requestId) {
    throw new functions.https.HttpsError('invalid-argument', 'requestId is required');
  }

  const senseiId = context.auth.uid;
  const requestRef = db.collection('coachingRequests').doc(requestId);

  return db.runTransaction(async (t) => {
    const requestDoc = await t.get(requestRef);
    if (!requestDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Coaching request not found');
    }

    const request = requestDoc.data();

    if (request.status !== 'pending') {
      throw new functions.https.HttpsError('failed-precondition', 'Request is not pending');
    }

    if (request.senseiId !== senseiId) {
      throw new functions.https.HttpsError('permission-denied', 'Only the assigned Sensei can reject this request');
    }

    const playerRef = db.collection('users').doc(request.playerId);
    const playerDoc = await t.get(playerRef);

    if (!playerDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Player not found');
    }

    const player = playerDoc.data();

    const newPlayerReservedCoins = (player.reservedCoins || 0) - (request.priceCoins || 0);

    t.update(playerRef, {
      reservedCoins: Math.max(0, newPlayerReservedCoins)
    });

    t.update(requestRef, {
      status: 'rejected',
      rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, requestId };
  });
});

/**
 * cancelCoachingRequest
 * 
 * Nur der Player kann seinen eigenen Request abbrechen.
 * Gibt reservierte Coins frei.
 * Status: pending oder accepted → cancelled
 */
exports.cancelCoachingRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }

  const { requestId } = data || {};
  if (!requestId) {
    throw new functions.https.HttpsError('invalid-argument', 'requestId is required');
  }

  const playerId = context.auth.uid;
  const requestRef = db.collection('coachingRequests').doc(requestId);

  return db.runTransaction(async (t) => {
    const requestDoc = await t.get(requestRef);
    if (!requestDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Coaching request not found');
    }

    const request = requestDoc.data();

    if (request.playerId !== playerId) {
      throw new functions.https.HttpsError('permission-denied', 'Only the player can cancel this request');
    }

    if (!['pending', 'accepted'].includes(request.status)) {
      throw new functions.https.HttpsError('failed-precondition', 'Request cannot be cancelled in current status');
    }

    const playerRef = db.collection('users').doc(playerId);
    const playerDoc = await t.get(playerRef);

    if (!playerDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Player not found');
    }

    const player = playerDoc.data();

    const newPlayerReservedCoins = (player.reservedCoins || 0) - (request.priceCoins || 0);

    t.update(playerRef, {
      reservedCoins: Math.max(0, newPlayerReservedCoins)
    });

    t.update(requestRef, {
      status: 'cancelled',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, requestId };
  });
});

/**
 * timeoutCoachingRequests (kann per Cloud Scheduler aufgerufen werden)
 * 
 * Sucht alle accepted Requests, deren timeoutAt < now ist, und cancelt sie.
 * Gibt reservierte Coins frei.
 */
exports.timeoutCoachingRequests = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }

  const now = new Date();

  const expiredSnap = await db.collection('coachingRequests')
    .where('status', '==', 'accepted')
    .where('timeoutAt', '<', now)
    .limit(100)
    .get();

  const batch = db.batch();
  let count = 0;

  for (const doc of expiredSnap.docs) {
    const request = doc.data();
    const playerRef = db.collection('users').doc(request.playerId);
    const playerDoc = await playerRef.get();
    const player = playerDoc.data();

    const newPlayerReservedCoins = (player.reservedCoins || 0) - (request.priceCoins || 0);

    batch.update(playerRef, {
      reservedCoins: Math.max(0, newPlayerReservedCoins)
    });

    batch.update(doc.ref, {
      status: 'cancelled',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      cancelReason: 'timeout',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    count++;
  }

  if (count > 0) {
    await batch.commit();
  }

  return { success: true, timedOutCount: count };
});
