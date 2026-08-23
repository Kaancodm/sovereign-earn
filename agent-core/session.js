"use strict";

const SESSION_STATES = Object.freeze(["orient", "context_load", "baseline_check", "execute", "verify", "audit", "close", "failed"]);
const TRANSITIONS = Object.freeze({
  orient: "context_load", context_load: "baseline_check", baseline_check: "execute", execute: "verify",
  verify: "audit", audit: "close", close: null, failed: "close",
});
function startSession({ runId, agentId, sessionMode, contextVersion }) {
  for (const [key, value] of Object.entries({ runId, agentId, sessionMode, contextVersion })) if (typeof value !== "string" || !value) throw new TypeError(`${key} is required`);
  return Object.freeze({ runId, agentId, sessionMode, contextVersion, state: "orient", startedAt: new Date().toISOString() });
}
function advance(session) {
  const next = TRANSITIONS[session.state];
  if (next === undefined) throw new Error(`invalid session state: ${session.state}`);
  if (next === null) return Object.freeze({ ...session, state: "close", closedAt: new Date().toISOString() });
  return Object.freeze({ ...session, state: next });
}
function fail(session, category) { if (!category) throw new TypeError("failure category is required"); return Object.freeze({ ...session, state: "failed", failureCategory: category }); }
module.exports = { SESSION_STATES, TRANSITIONS, startSession, advance, fail };
