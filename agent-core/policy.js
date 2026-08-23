"use strict";

const DECISIONS = Object.freeze({
  ALLOW: "allow",
  DENY: "deny",
  APPROVAL_REQUIRED: "approval_required",
});

function evaluateToolAccess(request, rules = []) {
  if (!request || typeof request !== "object") {
    throw new TypeError("request must be an object");
  }

  const match = rules.find((rule) =>
    rule.agentId === request.agentId &&
    rule.skillId === request.skillId &&
    rule.capability === request.capability &&
    rule.action === request.action
  );

  if (!match) {
    return Object.freeze({ decision: DECISIONS.DENY, reason: "no_matching_rule" });
  }

  if (match.decision === DECISIONS.APPROVAL_REQUIRED) {
    return Object.freeze({
      decision: DECISIONS.APPROVAL_REQUIRED,
      reason: match.reason || "explicit_approval_required",
    });
  }

  if (match.decision !== DECISIONS.ALLOW) {
    return Object.freeze({ decision: DECISIONS.DENY, reason: "invalid_or_denied_rule" });
  }

  return Object.freeze({ decision: DECISIONS.ALLOW, reason: match.reason || "explicit_allow_rule" });
}

module.exports = { DECISIONS, evaluateToolAccess };
