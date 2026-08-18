/**
 * Sovereign Earn – Sensei Coaching Flow
 *
 * Vier Callable Functions mit hartem Escrow-Modell:
 *   acceptCoachingRequest   (Sensei)   pending  -> accepted, Coins in Escrow
 *   completeCoachingRequest (Schueler) accepted -> completed, 90 % an Sensei
 *   declineCoachingRequest  (Sensei)   pending  -> declined  (kein Geld bewegt)
 *   cancelCoachingRequest   (beide)    accepted -> cancelled (voller Refund)
 *
 * Sicherheit:
 * - Coins werden ausschliesslich serverseitig via Admin-SDK + Transaktion bewegt.
 * - Jede Function prueft Auth, Rolle und Status atomar in EINER Transaktion.
 */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

const db = () => admin.firestore();

// --- Konfiguration -----------------------------------------------------------
// Falls dein Kontostand-Feld anders heisst, nur hier anpassen:
const COIN_BALANCE_FIELD = "coinBalance";
const PLATFORM_FEE_PERCENT = 10; // 10 % Plattformgebuehr bei Abschluss
// -----------------------------------------------------------------------------

function requireAuth(request) {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Anmeldung erforderlich.");
  }
  return request.auth.uid;
}

function requireRequestId(data) {
  const id = data && data.requestId;
  if (typeof id !== "string" || id.trim().length === 0) {
    throw new HttpsError("invalid-argument", "requestId fehlt oder ist ungueltig.");
  }
  return id.trim();
}

/**
 * Sensei nimmt eine Coaching-Anfrage an.
 * Die Coins des Schuelers werden atomar in Escrow gelegt.
 */
exports.acceptCoachingRequest = onCall(async (request) => {
  const senseiUid = requireAuth(request);
  const requestId = requireRequestId(request.data);
  const ref = db().collection("coachingRequests").doc(requestId);

  await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new HttpsError("not-found", "Coaching-Anfrage nicht gefunden.");
    }
    const req = snap.data();

    if (req.senseiId !== senseiUid) {
      throw new HttpsError("permission-denied", "Nur der angefragte Sensei kann annehmen.");
    }
    if (req.status !== "pending") {
      throw new HttpsError("failed-precondition", `Status ist '${req.status}', erwartet 'pending'.`);
    }
    const price = Number(req.priceCoins);
    if (!Number.isFinite(price) || price <= 0) {
      throw new HttpsError("failed-precondition", "Ungueltiger Preis auf der Anfrage.");
    }

    const studentRef = db().collection("users").doc(req.studentId);
    const studentSnap = await tx.get(studentRef);
    if (!studentSnap.exists) {
      throw new HttpsError("not-found", "Schueler-Profil nicht gefunden.");
    }
    const balance = Number(studentSnap.get(COIN_BALANCE_FIELD) || 0);
    if (balance < price) {
      throw new HttpsError("failed-precondition", "Schueler hat nicht genug Coins.");
    }

    tx.update(studentRef, { [COIN_BALANCE_FIELD]: balance - price });
    tx.update(ref, {
      status: "accepted",
      escrowCoins: price,
      acceptedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { ok: true, status: "accepted" };
});

/**
 * Schueler bestaetigt, dass die Session stattgefunden hat.
 * Escrow wird aufgeloest: 90 % an den Sensei, 10 % Plattformgebuehr.
 */
exports.completeCoachingRequest = onCall(async (request) => {
  const studentUid = requireAuth(request);
  const requestId = requireRequestId(request.data);
  const ref = db().collection("coachingRequests").doc(requestId);

  let payout = 0;

  await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new HttpsError("not-found", "Coaching-Anfrage nicht gefunden.");
    }
    const req = snap.data();

    if (req.studentId !== studentUid) {
      throw new HttpsError("permission-denied", "Nur der Schueler kann abschliessen.");
    }
    if (req.status !== "accepted") {
      throw new HttpsError("failed-precondition", `Status ist '${req.status}', erwartet 'accepted'.`);
    }
    const escrow = Number(req.escrowCoins || 0);
    if (escrow <= 0) {
      throw new HttpsError("failed-precondition", "Kein Escrow-Guthaben vorhanden.");
    }

    const fee = Math.floor((escrow * PLATFORM_FEE_PERCENT) / 100);
    payout = escrow - fee;

    const senseiRef = db().collection("users").doc(req.senseiId);
    const senseiSnap = await tx.get(senseiRef);
    if (!senseiSnap.exists) {
      throw new HttpsError("not-found", "Sensei-Profil nicht gefunden.");
    }
    const senseiBalance = Number(senseiSnap.get(COIN_BALANCE_FIELD) || 0);

    tx.update(senseiRef, { [COIN_BALANCE_FIELD]: senseiBalance + payout });
    tx.update(ref, {
      status: "completed",
      escrowCoins: 0,
      platformFeeCoins: fee,
      senseiPayoutCoins: payout,
      completedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { ok: true, status: "completed", senseiPayoutCoins: payout };
});

/**
 * Sensei lehnt eine noch offene Anfrage ab. Kein Geld wurde bewegt.
 */
exports.declineCoachingRequest = onCall(async (request) => {
  const senseiUid = requireAuth(request);
  const requestId = requireRequestId(request.data);
  const ref = db().collection("coachingRequests").doc(requestId);

  await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new HttpsError("not-found", "Coaching-Anfrage nicht gefunden.");
    }
    const req = snap.data();

    if (req.senseiId !== senseiUid) {
      throw new HttpsError("permission-denied", "Nur der angefragte Sensei kann ablehnen.");
    }
    if (req.status !== "pending") {
      throw new HttpsError("failed-precondition", `Status ist '${req.status}', erwartet 'pending'.`);
    }

    tx.update(ref, {
      status: "declined",
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { ok: true, status: "declined" };
});

/**
 * Schueler ODER Sensei bricht eine angenommene Anfrage ab.
 * Das Escrow wird vollstaendig an den Schueler zurueckgebucht.
 */
exports.cancelCoachingRequest = onCall(async (request) => {
  const callerUid = requireAuth(request);
  const requestId = requireRequestId(request.data);
  const ref = db().collection("coachingRequests").doc(requestId);

  await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new HttpsError("not-found", "Coaching-Anfrage nicht gefunden.");
    }
    const req = snap.data();

    if (req.studentId !== callerUid && req.senseiId !== callerUid) {
      throw new HttpsError("permission-denied", "Nur Schueler oder Sensei koennen stornieren.");
    }
    if (req.status !== "accepted") {
      throw new HttpsError("failed-precondition", `Status ist '${req.status}', erwartet 'accepted'.`);
    }
    const escrow = Number(req.escrowCoins || 0);
    if (escrow <= 0) {
      throw new HttpsError("failed-precondition", "Kein Escrow-Guthaben vorhanden.");
    }

    const studentRef = db().collection("users").doc(req.studentId);
    const studentSnap = await tx.get(studentRef);
    if (!studentSnap.exists) {
      throw new HttpsError("not-found", "Schueler-Profil nicht gefunden.");
    }
    const balance = Number(studentSnap.get(COIN_BALANCE_FIELD) || 0);

    tx.update(studentRef, { [COIN_BALANCE_FIELD]: balance + escrow });
    tx.update(ref, {
      status: "cancelled",
      escrowCoins: 0,
      refundedCoins: escrow,
      cancelledBy: callerUid,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return { ok: true, status: "cancelled" };
});
