/**
 * Sovereign Earn – WorkAI Integration & Sensei-Flow (v2)
 *
 * Konsolidiert aus den früheren "Concrete Code Blocks" (functions/Index.js
 * und functions/functions/index.js) – bereinigt auf Firebase Functions v2
 * und abgestimmt auf den Escrow-Flow in coaching.js:
 *
 *   createCoachingRequest  → status "pending", reserviert Coins
 *   acceptCoachingRequest  → (coaching.js) status "accepted", Escrow
 *   completeCoachingRequest→ (coaching.js) 90% an Sensei, 10% Plattform
 *
 * Secrets: WORKAI_API_KEY, WORKAI_A2A_ENDPOINT (functions:secrets:set)
 */

const { onCall, HttpsError, onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

const db = admin.firestore();
const COIN_FIELD = "coinBalance";

// === WorkAI A2A Konfiguration ===
const WORKAI_A2A_ENDPOINT =
  process.env.WORKAI_A2A_ENDPOINT || "https://workai.example-oracle-vps.com/a2a/v1";
const WORKAI_API_KEY = process.env.WORKAI_API_KEY;

/**
 * Interner A2A-Helper (JSON-RPC 2.0) zu unserem WorkAI-Agenten auf dem VPS.
 */
async function callWorkAI({ skillId, message, contextId = null }) {
  if (!WORKAI_API_KEY) {
    throw new HttpsError("failed-precondition", "WorkAI API Key not configured");
  }

  const payload = {
    jsonrpc: "2.0",
    id: `sovereign-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    method: "message/send",
    params: {
      message: {
        role: "user",
        parts: [{ type: "text", text: typeof message === "string" ? message : JSON.stringify(message) }],
        metadata: {
          preferredSkill: skillId,
          source: "sovereign-earn",
          contextId,
          language: message.language || "de",
        },
      },
      configuration: { acceptedOutputModes: ["text/plain", "application/json"], returnImmediately: true },
    },
  };

  const response = await fetch(WORKAI_A2A_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Sovereign-API-Key": WORKAI_API_KEY,
      "A2A-Version": "1.0",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    console.error("[WorkAI A2A Error]", response.status, await response.text());
    throw new HttpsError("internal", `WorkAI call failed (${response.status})`);
  }

  const data = await response.json();
  if (data.error) {
    console.error("[WorkAI JSON-RPC Error]", data.error);
    throw new HttpsError("internal", data.error.message || "WorkAI error");
  }

  return data.result;
}

function requireAuth(request) {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Login required");
  }
  return request.auth.uid;
}

// ===================================================================
//  askBuildAdvisor – KI-Build-Beratung über WorkAI A2A
//  Frontend sendet: { className, level, stats, goal, language }
// ===================================================================
exports.askBuildAdvisor = onCall(async (request) => {
  const uid = requireAuth(request);
  const data = request.data || {};

  const { className, level, stats, goal = "balanced", language = "de" } = data;
  if (!className || !level || !stats) {
    throw new HttpsError("invalid-argument", "className, level and stats are required");
  }

  const prompt = {
    skill: "mu-build-advisor",
    language,
    player: { uid, class: className, level: Number(level), stats, goal },
  };

  try {
    const result = await callWorkAI({ skillId: "mu-build-advisor", message: prompt });

    await db.collection("ai_advice").add({
      uid,
      skill: "mu-build-advisor",
      request: prompt,
      result,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, advice: result, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error("[askBuildAdvisor]", error);
    return {
      success: false,
      error: language === "ru" ? "ИИ временно недоступен." : "AI vorübergehend nicht verfügbar.",
      fallback: true,
    };
  }
});

// ===================================================================
//  updateSenseiProfile – nur verifizierte Senseis dürfen Coaching-Flags setzen
// ===================================================================
exports.updateSenseiProfile = onCall(async (request) => {
  const uid = requireAuth(request);
  const data = request.data || {};

  const userSnap = await db.collection("users").doc(uid).get();
  if (!userSnap.exists) {
    throw new HttpsError("not-found", "User not found");
  }
  if (!userSnap.data().isVerifiedSensei) {
    throw new HttpsError("permission-denied", "Only verified Senseis can update coaching profile");
  }

  const current = userSnap.data();
  const allowed = {
    languages: data.languages || current.languages || ["de"],
    specializations: data.specializations || current.specializations || [],
    offersPaidCoaching: Boolean(data.offersPaidCoaching),
    coachingOffers: Array.isArray(data.coachingOffers) ? data.coachingOffers : current.coachingOffers || [],
    bio: data.bio || current.bio || "",
    maxStudents: data.maxStudents || current.maxStudents || 3,
  };

  await db
    .collection("users")
    .doc(uid)
    .set({ ...allowed, senseiProfileUpdatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });

  return { success: true, profile: allowed };
});

// ===================================================================
//  createCoachingRequest – Schüler bucht Coaching beim Sensei
//  Coins werden nur reserviert (reservedCoins), NICHT abgebucht.
//  Die Abbuchung ins Escrow passiert in acceptCoachingRequest (coaching.js).
// ===================================================================
exports.createCoachingRequest = onCall(async (request) => {
  const studentUid = requireAuth(request);
  const { senseiId, offerId, message, priceCoins } = request.data || {};

  if (!senseiId || !offerId || !priceCoins || priceCoins <= 0) {
    throw new HttpsError("invalid-argument", "Missing required fields");
  }

  const studentRef = db.collection("users").doc(studentUid);
  const senseiRef = db.collection("users").doc(senseiId);

  return db.runTransaction(async (t) => {
    const studentDoc = await t.get(studentRef);
    const senseiDoc = await t.get(senseiRef);

    if (!studentDoc.exists || !senseiDoc.exists) {
      throw new HttpsError("not-found", "Student or Sensei not found");
    }

    const sensei = senseiDoc.data();
    if (!sensei.isVerifiedSensei || !sensei.offersPaidCoaching) {
      throw new HttpsError("failed-precondition", "Sensei does not offer paid coaching");
    }

    const student = studentDoc.data();
    if (Number(student[COIN_FIELD] || 0) < priceCoins) {
      throw new HttpsError("failed-precondition", "Not enough coins");
    }

    const requestRef = db.collection("coachingRequests").doc();
    t.set(requestRef, {
      id: requestRef.id,
      studentId: studentUid, // konsistent mit coaching.js
      senseiId,
      offerId,
      message: message || "",
      priceCoins,
      status: "pending", // pending → accepted → completed / declined / cancelled
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Reservierung merken (Abbuchung erfolgt erst beim Accept ins Escrow)
    t.update(studentRef, { reservedCoins: (student.reservedCoins || 0) + priceCoins });

    return { success: true, requestId: requestRef.id };
  });
});

// ===================================================================
//  healthCheck – trivialer Liveness-Endpoint
// ===================================================================
exports.healthCheck = onRequest((req, res) => {
  res.json({ ok: true, service: "sovereign-earn-functions", time: new Date().toISOString() });
});

module.exports.callWorkAI = callWorkAI;
