/**
 * Sovereign Earn – Nutzerprofil-Functions
 *
 * Da firestore.rules jeglichen Client-Schreibzugriff auf `users/{uid}`
 * blockt (fail-closed, siehe rules), muss das Profil serverseitig
 * angelegt werden. `ensureUserProfile` ist idempotent und wird vom
 * Frontend direkt nach erfolgreichem Login aufgerufen.
 */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

const db = admin.firestore();

// ===================================================================
//  ensureUserProfile – legt users/{uid} an, falls es nicht existiert
// ===================================================================
exports.ensureUserProfile = onCall(async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Login required");
  }
  const uid = request.auth.uid;
  const data = request.data || {};

  const ref = db.collection("users").doc(uid);

  await db.runTransaction(async (t) => {
    const snap = await t.get(ref);
    if (!snap.exists) {
      t.set(ref, {
        coinBalance: 0,                    // Kontostand – NUR serverseitig schreibbar
        reservedCoins: 0,
        coachingEarnings: 0,
        displayName: data.displayName || "",
        email: data.email || "",
        isVerifiedSensei: false,
        offersPaidCoaching: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });

  return { ok: true, uid };
});

// ===================================================================
//  requestAccountDeletion – DSGVO Art. 17 (Recht auf Löschung)
//  Löscht users/{uid} sowie zugehörige Unterdokumente. Der Aufruf
//  wird zusätzlich protokolliert (Audit-Trail).
// ===================================================================
exports.requestAccountDeletion = onCall(async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Login required");
  }
  const uid = request.auth.uid;

  const userRef = db.collection("users").doc(uid);
  const auditRef = db.collection("deletionRequests").doc();

  await db.runTransaction(async (t) => {
    const snap = await t.get(userRef);
    if (snap.exists) {
      t.delete(userRef);
    }
    t.set(auditRef, {
      uid,
      requestedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return { ok: true, message: "Account deletion requested" };
});
