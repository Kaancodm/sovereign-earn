/**
 * Sovereign Earn v2 – Concrete Code Block
 * 
 * 1. askBuildAdvisor (finalized callable)
 * 2. Sensei Profile Extensions + Coaching Request basics
 * 
 * Place into functions/index.js or modularize.
 * Requires: firebase-functions, firebase-admin, and WORKAI_API_KEY + WORKAI_A2A_ENDPOINT as secrets/env.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// === Config ===
const WORKAI_A2A_ENDPOINT = process.env.WORKAI_A2A_ENDPOINT || 'https://workai.example-oracle-vps.com/a2a/v1';
const WORKAI_API_KEY = process.env.WORKAI_API_KEY;

/**
 * Internal A2A helper (JSON-RPC 2.0)
 */
async function callWorkAI({ skillId, message, contextId = null }) {
  if (!WORKAI_API_KEY) {
    throw new functions.https.HttpsError('failed-precondition', 'WorkAI API Key not configured');
  }

  const payload = {
    jsonrpc: '2.0',
    id: `sovereign-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    method: 'message/send',
    params: {
      message: {
        role: 'user',
        parts: [
          {
            type: 'text',
            text: typeof message === 'string' ? message : JSON.stringify(message)
          }
        ],
        metadata: {
          preferredSkill: skillId,
          source: 'sovereign-earn',
          contextId: contextId,
          language: message.language || 'de'
        }
      },
      configuration: {
        acceptedOutputModes: ['text/plain', 'application/json'],
        returnImmediately: true
      }
    }
  };

  const response = await fetch(WORKAI_A2A_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Sovereign-API-Key': WORKAI_API_KEY,
      'A2A-Version': '1.0'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[WorkAI A2A Error]', response.status, errorText);
    throw new functions.https.HttpsError('internal', `WorkAI call failed (${response.status})`);
  }

  const data = await response.json();
  if (data.error) {
    console.error('[WorkAI JSON-RPC Error]', data.error);
    throw new functions.https.HttpsError('internal', data.error.message || 'WorkAI error');
  }

  return data.result;
}

/**
 * ============================================
 * 1. askBuildAdvisor – finalized callable
 * ============================================
 * Frontend sends: { className, level, stats, goal, language, extraContext }
 */
exports.askBuildAdvisor = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }

  const {
    className,
    level,
    stats,
    goal = 'balanced',
    language = 'de',
    extraContext = null
  } = data || {};

  if (!className || !level || !stats) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'className, level and stats are required'
    );
  }

  const prompt = {
    skill: 'mu-build-advisor',
    language,
    player: {
      uid: context.auth.uid,
      class: className,
      level: Number(level),
      stats,
      goal
    },
    extra: extraContext
  };

  try {
    const result = await callWorkAI({
      skillId: 'mu-build-advisor',
      message: prompt
    });

    // Optional: store advice history
    await db.collection('ai_advice').add({
      uid: context.auth.uid,
      skill: 'mu-build-advisor',
      request: prompt,
      result: result,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      advice: result,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[askBuildAdvisor]', error);
    return {
      success: false,
      error: language === 'ru'
        ? 'ИИ временно недоступен. Попробуйте позже.'
        : 'AI vorübergehend nicht verfügbar. Bitte später erneut versuchen.',
      fallback: true
    };
  }
});

/**
 * ============================================
 * 2. Sensei Profile Extensions
 * ============================================
 * Call this when a verified Sensei updates their profile
 * or during verification approval.
 *
 * Expected data shape (partial update):
 * {
 *   languages: ['de', 'ru'],
 *   specializations: ['Royal Knight', 'Arena', 'Gear Building'],
 *   offersPaidCoaching: true,
 *   coachingOffers: [
 *     { id: 'build-review', title: 'Build-Review', priceCoins: 800, description: '...' }
 *   ],
 *   bio: '...',
 *   maxStudents: 5
 * }
 */
exports.updateSenseiProfile = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }

  const uid = context.auth.uid;
  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'User not found');
  }

  const userData = userSnap.data();
  // Only verified Senseis may set coaching flags
  if (!userData.isVerifiedSensei) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only verified Senseis can update coaching profile'
    );
  }

  const allowed = {
    languages: data.languages || userData.languages || ['de'],
    specializations: data.specializations || userData.specializations || [],
    offersPaidCoaching: Boolean(data.offersPaidCoaching),
    coachingOffers: Array.isArray(data.coachingOffers) ? data.coachingOffers : (userData.coachingOffers || []),
    bio: data.bio || userData.bio || '',
    maxStudents: data.maxStudents || userData.maxStudents || 3
  };

  await userRef.set(
    {
      ...allowed,
      senseiProfileUpdatedAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  return { success: true, profile: allowed };
});

/**
 * ============================================
 * 3. Create Coaching Request (minimal viable)
 * ============================================
 * Player requests paid coaching from a Sensei.
 * Coins are reserved (not yet deducted).
 */
exports.createCoachingRequest = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required');
  }

  const { senseiId, offerId, message, priceCoins } = data || {};

  if (!senseiId || !offerId || !priceCoins || priceCoins <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  const playerId = context.auth.uid;
  const playerRef = db.collection('users').doc(playerId);
  const senseiRef = db.collection('users').doc(senseiId);

  return db.runTransaction(async (t) => {
    const playerDoc = await t.get(playerRef);
    const senseiDoc = await t.get(senseiRef);

    if (!playerDoc.exists || !senseiDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Player or Sensei not found');
    }

    const player = playerDoc.data();
    const sensei = senseiDoc.data();

    if (!sensei.isVerifiedSensei || !sensei.offersPaidCoaching) {
      throw new functions.https.HttpsError('failed-precondition', 'Sensei does not offer paid coaching');
    }

    const currentCoins = player.coins || 0;
    if (currentCoins < priceCoins) {
      throw new functions.https.HttpsError('failed-precondition', 'Not enough coins');
    }

    // Reserve coins (do not deduct yet – wait for Sensei acceptance + completion)
    const requestRef = db.collection('coachingRequests').doc();
    t.set(requestRef, {
      id: requestRef.id,
      playerId,
      senseiId,
      offerId,
      message: message || '',
      priceCoins,
      status: 'pending', // pending → accepted → completed / rejected / cancelled
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Optional: mark reserved amount on player (simple approach)
    t.update(playerRef, {
      reservedCoins: (player.reservedCoins || 0) + priceCoins
    });

    return { success: true, requestId: requestRef.id };
  });
});

/**
 * Note: Acceptance, completion and actual coin transfer
 * should be separate callables (acceptCoachingRequest, completeCoachingRequest)
 * with proper status checks and idempotency. Implement next.
 */

module.exports.callWorkAI = callWorkAI;
