/**
 * Sovereign Earn – Offerwall Postback Endpoints (Pollfish / BitLabs)
 *
 * SICHERHEIT (nicht verhandelbar):
 *  1. Jeder Postback wird serverseitig per HMAC-SHA256 signiert validiert.
 *  2. Idempotenz: rx_id wird atomar in `transactions/{rx_id}` gespeichert –
 *     Replay-Angriffe und Doppel-Auszahlungen sind damit ausgeschlossen.
 *  3. Coins (coinBalance) werden NUR via Admin-SDK + Firestore-Transaktion
 *     bewegt. Der Client hat keinerlei Schreibzugriff (siehe firestore.rules).
 *
 * Secrets (in der Staging-/Produktionsumgebung setzen):
 *   firebase functions:secrets:set POLLFISH_SECRET
 *   firebase functions:secrets:set BITLABS_SECRET
 *   (Fallback: functions.config().pollfish.secret / .bitlabs.secret)
 */

const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const crypto = require("crypto");

const db = admin.firestore();
const COIN_FIELD = "coinBalance"; // muss mit coaching.js / firestore.rules übereinstimmen

// ===================================================================
//  Secrets
// ===================================================================
function functionsConfig() {
  // functions.config() ist in v2 weiterhin verfügbar
  const { config } = require("firebase-functions");
  return config();
}

function pollfishSecret() {
  if (process.env.POLLFISH_SECRET) return process.env.POLLFISH_SECRET;
  try {
    const c = functionsConfig();
    if (c && c.pollfish && c.pollfish.secret) return c.pollfish.secret;
  } catch (e) { /* ignore */ }
  return null;
}

function bitlabsSecret() {
  if (process.env.BITLABS_SECRET) return process.env.BITLABS_SECRET;
  try {
    const c = functionsConfig();
    if (c && c.bitlabs && c.bitlabs.secret) return c.bitlabs.secret;
  } catch (e) { /* ignore */ }
  return null;
}

// ===================================================================
//  Gemeinsame Escrow-/Kontotransaktion (atomar & idempotent)
// ===================================================================
async function creditReward({ rxId, userId, rewardName, rewardValue }) {
  if (!rxId || !userId) {
    return { ok: false, status: 400, body: "Bad Request: Missing Parameters" };
  }

  const coinsToAward = parseInt(rewardValue, 10) || 0;
  if (!Number.isFinite(coinsToAward) || coinsToAward <= 0) {
    return { ok: false, status: 400, body: "Bad Request: Invalid reward_value" };
  }

  const txRef = db.collection("transactions").doc(rxId);
  const userRef = db.collection("users").doc(userId);

  try {
    await db.runTransaction(async (transaction) => {
      // 1) Idempotenz-Prüfung (innerhalb derselben Transaktion)
      const txSnap = await transaction.get(txRef);
      if (txSnap.exists) {
        const skip = {};
        skip.__alreadyProcessed = true;
        throw skip; // Signal: bereits verarbeitet (kein Fehler)
      }

      // 2) Nutzer muss existieren
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists) {
        throw new Error("USER_NOT_FOUND");
      }

      // 3) Atomare Gutschrift
      const current = Number(userSnap.get(COIN_FIELD) || 0);
      transaction.update(userRef, { [COIN_FIELD]: current + coinsToAward });

      // 4) Transaktionsnachweis schreiben (einmalig, idempotent)
      transaction.set(txRef, {
        userId,
        rewardName: rewardName || "",
        coinsAwarded: coinsToAward,
        status: "completed",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return { ok: true, status: 200, body: "OK_CREDITED" };
  } catch (error) {
    if (error && error.__alreadyProcessed) {
      return { ok: true, status: 200, body: "Already Processed" };
    }
    if (error && error.message === "USER_NOT_FOUND") {
      return { ok: false, status: 404, body: "User not found" };
    }
    console.error("[Postback] Transaktionsfehler:", error);
    return { ok: false, status: 500, body: "Internal Server Error" };
  }
}

// ===================================================================
//  Pollfish Postback
//  Signatur-Format (projekteigenes Contract, siehe Handover-Doku):
//    rawString = rx_id:reward_name:reward_value:status:user_id:SECRET
//    signature = HMAC-SHA256(rawString, SECRET)
// ===================================================================
exports.pollfishPostback = onRequest(async (req, res) => {
  try {
    const secret = pollfishSecret();
    if (!secret) {
      console.error("🚨 POLLFISH_SECRET nicht konfiguriert!");
      return res.status(500).send("Server misconfigured");
    }

    const { rx_id, reward_name, reward_value, status, signature, user_id } = req.query;
    if (!user_id || !signature || !rx_id) {
      return res.status(400).send("Bad Request: Missing Parameters");
    }

    // 1) HMAC-SHA256 Verifikation
    const rawString = `${rx_id}:${reward_name}:${reward_value}:${status}:${user_id}:${secret}`;
    const computed = crypto.createHmac("sha256", secret).update(rawString).digest("hex");
    if (signature !== computed) {
      console.error("🚨 SICHERHEITS-ALARM: Ungültige Pollfish-Signatur!", { rx_id, user_id });
      return res.status(401).send("Unauthorized Signature");
    }

    // 2) Atomare + idempotente Gutschrift
    const result = await creditReward({
      rxId: rx_id,
      userId: user_id,
      rewardName: reward_name,
      rewardValue: reward_value,
    });
    return res.status(result.status).send(result.body);
  } catch (error) {
    console.error("[pollfishPostback] Fehler:", error);
    return res.status(500).send("Internal Server Error");
  }
});

// ===================================================================
//  BitLabs Postback
//  Signatur-Format (BitLabs-Doku):
//    signature = HMAC-SHA256(key=SECRET, message=querystring OHNE signature-Param)
//  (Muss exakt der Konfiguration im BitLabs-Dashboard entsprechen –
//   siehe BitLabs Webhook-Dokumentation für das aktuelle Schema.)
// ===================================================================
exports.bitlabsPostback = onRequest(async (req, res) => {
  try {
    const secret = bitlabsSecret();
    if (!secret) {
      console.error("🚨 BITLABS_SECRET nicht konfiguriert!");
      return res.status(500).send("Server misconfigured");
    }

    const query = req.query;
    const signature = query.signature;
    if (!signature) {
      return res.status(400).send("Bad Request: Missing signature");
    }

    // Kanonische Signaturbasis: alle Parameter außer "signature"
    const keys = Object.keys(query)
      .filter((k) => k !== "signature")
      .sort();
    const canonical = keys
      .map((k) => `${k}=${query[k]}`)
      .join("&");

    const computed = crypto.createHmac("sha256", secret).update(canonical).digest("hex");
    if (signature !== computed) {
      console.error("🚨 SICHERHEITS-ALARM: Ungültige BitLabs-Signatur!");
      return res.status(401).send("Unauthorized Signature");
    }

    // BitLabs sendet u.a.: txid / user_id / amount / reward_name
    const rxId = query.txid || query.rx_id || query.transaction_id;
    const userId = query.user_id || query.uid;
    const rewardValue = query.amount || query.reward_value;
    const rewardName = query.reward_name || query.offer_name || "";

    const result = await creditReward({
      rxId,
      userId,
      rewardName,
      rewardValue,
    });
    return res.status(result.status).send(result.body);
  } catch (error) {
    console.error("[bitlabsPostback] Fehler:", error);
    return res.status(500).send("Internal Server Error");
  }
});

// TODO(CPALead): Postback ohne HMAC (reines Click-System) – nur mit
// zusätzlicher IP-Allowlist + User-Token-Validierung implementieren.
