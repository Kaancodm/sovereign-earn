"use strict";
const { createHash } = require("node:crypto");
function hashPayload(payload) { return createHash("sha256").update(JSON.stringify(payload, Object.keys(payload).sort())).digest("hex"); }
function createPayoutRequest({ calculationId, amount, currency, beneficiaryId, policyChecks = [], riskFlags = [] }) {
  if (!calculationId || !currency || !beneficiaryId) throw new TypeError("calculationId, currency, and beneficiaryId are required");
  if (!Number.isFinite(amount) || amount <= 0) throw new TypeError("amount must be positive");
  const request = Object.freeze({ payoutRequestId: `${calculationId}:${hashPayload({ amount, currency, beneficiaryId })}`, calculationId, amount, currency, beneficiaryId, policyChecks: Object.freeze([...policyChecks]), riskFlags: Object.freeze([...riskFlags]) });
  return Object.freeze({ ...request, approvalHash: hashPayload(request) });
}
function assertCoreOnlyExecution() { throw new Error("execute_payout is Core-only; agent-facing Skills cannot execute payment rails"); }
module.exports = { createPayoutRequest, assertCoreOnlyExecution, hashPayload };
