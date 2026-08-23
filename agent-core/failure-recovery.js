"use strict";

const ERROR_CATEGORIES = Object.freeze([
  "policy_violation", "identity_mismatch", "scope_denied", "approval_invalid", "approval_expired",
  "limit_exceeded", "budget_exceeded", "tool_unavailable", "execution_failed", "audit_failed",
  "timeout", "circuit_open", "replay_detected",
]);

const RECOVERY = Object.freeze({
  policy_violation: Object.freeze({ retry: false, action: "stop" }),
  identity_mismatch: Object.freeze({ retry: false, action: "stop" }),
  scope_denied: Object.freeze({ retry: false, action: "stop" }),
  approval_invalid: Object.freeze({ retry: false, action: "manual_review" }),
  approval_expired: Object.freeze({ retry: false, action: "new_approval" }),
  limit_exceeded: Object.freeze({ retry: false, action: "manual_review" }),
  budget_exceeded: Object.freeze({ retry: false, action: "stop" }),
  tool_unavailable: Object.freeze({ retry: true, maxRetries: 2, backoffMs: 250, action: "backoff" }),
  execution_failed: Object.freeze({ retry: false, action: "stop" }),
  audit_failed: Object.freeze({ retry: false, action: "fail_closed" }),
  timeout: Object.freeze({ retry: true, maxRetries: 1, backoffMs: 500, action: "backoff" }),
  circuit_open: Object.freeze({ retry: false, action: "stop" }),
  replay_detected: Object.freeze({ retry: false, action: "stop" }),
});

function classifyError(error) {
  const category = error?.category || error?.code;
  return ERROR_CATEGORIES.includes(category) ? category : "execution_failed";
}
function recoveryFor(category) { return RECOVERY[category] || RECOVERY.execution_failed; }
function assertPrivilegedAudit(auditSucceeded) { if (!auditSucceeded) throw Object.assign(new Error("audit_failed: privileged action blocked"), { category: "audit_failed" }); }

module.exports = { ERROR_CATEGORIES, RECOVERY, classifyError, recoveryFor, assertPrivilegedAudit };
