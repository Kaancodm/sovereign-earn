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

    return const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.healthCheck = functions.https.onRequest((req, res) => {
  res.status(200).json({
    ok: true,
    service: "sovereign-earn-functions"
  });
});
