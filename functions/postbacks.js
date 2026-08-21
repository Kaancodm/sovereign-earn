/**
 * Sovereign Earn – Offerwall Postbacks (Firebase Functions v2)
 * Security: HMAC verification + atomic/idempotent Firestore transactions.
 */

const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const crypto = require("crypto");

const db = admin.firestore();
const COIN_FIELD = "coinBalance";
const POLLFISH_SECRET = defineSecret("POLLFISH_SECRET");
const BITLABS_SECRET = defineSecret("BITLABS_SECRET");

async function creditReward({ rxId, userId, rewardName, rewardValue }) {
  if (!rxId || !userId) {
    return { status: 400, body: "Bad Request: Missing Parameters" };
  }

  const coinsToAward = Number.parseInt(rewardValue, 10);
  if (!Number.isFinite(coinsToAward) || coinsToAward <= 0) {
    return { status: 400, body: "Bad Request: Invalid reward_value" };
  }

  const txRef = db.collection("transactions").doc(String(rxId));
  const userRef = db.collection("users").doc(String(userId));

  try {
    let alreadyProcessed = false;
    await db.runTransaction(async (transaction) => {
      const txSnap = await transaction.get(txRef);
      if (txSnap.exists) {
        alreadyProcessed = true;
        return;
      }

      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists) throw new Error("USER_NOT_FOUND");

      const current = Number(userSnap.get(COIN_FIELD) || 0);
      transaction.update(userRef, { [COIN_FIELD]: current + coinsToAward });
      transaction.set(txRef, {
        userId: String(userId),
        rewardName: rewardName || "",
        coinsAwarded: coinsToAward,
        status: "completed",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    if (alreadyProcessed) return { status: 200, body: "Already Processed" };
    return { status: 200, body: "OK_CREDITED" };
  } catch (error) {
    if (error && error.message === "USER_NOT_FOUND") {
      return { status: 404, body: "User not found" };
    }
    console.error("[Postback] Transaction error:", error);
    return { status: 500, body: "Internal Server Error" };
  }
}

function safeEqualHex(expected, received) {
  if (typeof received !== "string" || !/^[a-f0-9]{64}$/i.test(received)) return false;
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(received, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

exports.pollfishPostbackV2 = onRequest(
  { secrets: [POLLFISH_SECRET] },
  async (req, res) => {
    try {
      const secret = POLLFISH_SECRET.value();
      if (!secret) return res.status(500).send("Server misconfigured");

      const { rx_id, reward_name, reward_value, status, signature, user_id } = req.query;
      if (!user_id || !signature || !rx_id) {
        return res.status(400).send("Bad Request: Missing Parameters");
      }

      const rawString = `${rx_id}:${reward_name}:${reward_value}:${status}:${user_id}:${secret}`;
      const computed = crypto.createHmac("sha256", secret).update(rawString).digest("hex");
      if (!safeEqualHex(computed, signature)) {
        console.error("[Pollfish] Invalid signature", { rx_id, user_id });
        return res.status(401).send("Unauthorized Signature");
      }

      const result = await creditReward({
        rxId: rx_id,
        userId: user_id,
        rewardName: reward_name,
        rewardValue: reward_value,
      });
      return res.status(result.status).send(result.body);
    } catch (error) {
      console.error("[pollfishPostbackV2] Error:", error);
      return res.status(500).send("Internal Server Error");
    }
  },
);

exports.bitlabsPostbackV2 = onRequest(
  { secrets: [BITLABS_SECRET] },
  async (req, res) => {
    try {
      const secret = BITLABS_SECRET.value();
      if (!secret) return res.status(500).send("Server misconfigured");

      const query = req.query;
      const signature = query.signature;
      if (!signature) return res.status(400).send("Bad Request: Missing signature");

      const keys = Object.keys(query).filter((key) => key !== "signature").sort();
      const canonical = keys.map((key) => `${key}=${query[key]}`).join("&");
      const computed = crypto.createHmac("sha256", secret).update(canonical).digest("hex");
      if (!safeEqualHex(computed, signature)) {
        console.error("[BitLabs] Invalid signature");
        return res.status(401).send("Unauthorized Signature");
      }

      const result = await creditReward({
        rxId: query.txid || query.rx_id || query.transaction_id,
        userId: query.user_id || query.uid,
        rewardValue: query.amount || query.reward_value,
        rewardName: query.reward_name || query.offer_name || "",
      });
      return res.status(result.status).send(result.body);
    } catch (error) {
      console.error("[bitlabsPostbackV2] Error:", error);
      return res.status(500).send("Internal Server Error");
    }
  },
);
