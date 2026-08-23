"use strict";
const DECISIONS = Object.freeze({ ALLOW: "allow", DENY: "deny", APPROVAL_REQUIRED: "approval_required" });
function evaluateToolAccess(request, rules = []) {
  if (!request || typeof request !== "object") throw new TypeError("request must be an object");
  const matches = rules.filter((rule) => rule.agentId === request.agentId && rule.skillId === request.skillId && rule.capability === request.capability && rule.action === request.action);
  if (matches.some((rule) => rule.decision === DECISIONS.DENY)) return Object.freeze({ decision: DECISIONS.DENY, allowed: false, requiresApproval: false, reason: "explicit_deny" });
  const match = matches.find((rule) => rule.decision === DECISIONS.APPROVAL_REQUIRED) || matches.find((rule) => rule.decision === DECISIONS.ALLOW);
  if (!match) return Object.freeze({ decision: DECISIONS.DENY, allowed: false, requiresApproval: false, reason: "no_matching_rule" });
  if (match.decision === DECISIONS.APPROVAL_REQUIRED) return Object.freeze({ decision: DECISIONS.APPROVAL_REQUIRED, allowed: true, requiresApproval: true, privileged: true, reason: match.reason || "explicit_approval_required" });
  return Object.freeze({ decision: DECISIONS.ALLOW, allowed: true, requiresApproval: false, privileged: Boolean(match.privileged), reason: match.reason || "explicit_allow_rule" });
}
module.exports = { DECISIONS, evaluateToolAccess, evaluate: evaluateToolAccess };
