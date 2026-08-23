"use strict";

const SESSION_MODES = Object.freeze({
  REVIEW_ONLY: "review_only",
  SANDBOX: "sandbox",
  PREPARE_PAYOUT: "prepare_payout",
  APPROVAL_REVIEW: "approval_review",
  PRODUCTION: "production",
});

const MODE_RULES = Object.freeze({
  review_only: Object.freeze({ allowedRisks: ["read", "compute"], allowExecution: false }),
  sandbox: Object.freeze({ allowedRisks: ["read", "compute", "write"], allowExecution: false }),
  prepare_payout: Object.freeze({ allowedRisks: ["read", "compute", "write"], allowExecution: false }),
  approval_review: Object.freeze({ allowedRisks: ["read", "compute", "write"], allowExecution: false }),
  production: Object.freeze({ allowedRisks: ["read", "compute", "write", "privileged"], allowExecution: true }),
});

function createGovernanceContext({ identity, sessionMode, scopes = [], budget }) {
  if (!identity || typeof identity.userId !== "string") throw new TypeError("identity.userId is required");
  if (!Object.hasOwn(MODE_RULES, sessionMode)) throw new TypeError("sessionMode is invalid");
  return Object.freeze({
    identity: Object.freeze({ userId: identity.userId, role: identity.role || "user" }),
    sessionMode,
    scopes: Object.freeze([...new Set(scopes)]),
    budget: Object.freeze({ ...(budget || {}) }),
    modeRules: MODE_RULES[sessionMode],
  });
}

function evaluateGovernance(ctx, capability) {
  if (!ctx || !capability) return Object.freeze({ allowed: false, reason: "missing_governance_context" });
  if (!ctx.scopes.includes(capability.scope)) return Object.freeze({ allowed: false, reason: "scope_mismatch" });
  if (!ctx.modeRules.allowedRisks.includes(capability.risk)) return Object.freeze({ allowed: false, reason: "risk_not_allowed_in_mode" });
  if (capability.risk === "privileged" && !ctx.modeRules.allowExecution) return Object.freeze({ allowed: false, reason: "privileged_execution_not_allowed_in_mode" });
  return Object.freeze({ allowed: true, reason: "governance_allow" });
}

module.exports = { SESSION_MODES, MODE_RULES, createGovernanceContext, evaluateGovernance };
