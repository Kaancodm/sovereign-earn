"use strict";

const RUN_STATUSES = Object.freeze({ CREATED: "created" });
const HANDOFF_STATUSES = Object.freeze({ REQUESTED: "requested" });
const APPROVAL_STATES = Object.freeze({ NOT_REQUIRED: "not_required", PENDING: "pending", APPROVED: "approved", REJECTED: "rejected", EXPIRED: "expired", CONSUMED: "consumed" });

function requireNonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${field} must be a non-empty string`);
  return value.trim();
}
function requireEnum(value, allowed, field) {
  if (!Object.values(allowed).includes(value)) throw new TypeError(`${field} is invalid`);
  return value;
}
function createRun(input = {}) {
  return Object.freeze({ runId: requireNonEmptyString(input.runId, "runId"), agentId: requireNonEmptyString(input.agentId, "agentId"), taskId: requireNonEmptyString(input.taskId, "taskId"), status: requireEnum(input.status ?? RUN_STATUSES.CREATED, RUN_STATUSES, "status"), createdAt: input.createdAt || new Date().toISOString() });
}
function createHandoff(input = {}) {
  return Object.freeze({ handoffId: requireNonEmptyString(input.handoffId, "handoffId"), runId: requireNonEmptyString(input.runId, "runId"), fromAgent: requireNonEmptyString(input.fromAgent, "fromAgent"), toAgent: requireNonEmptyString(input.toAgent, "toAgent"), reason: requireNonEmptyString(input.reason, "reason"), status: requireEnum(input.status ?? HANDOFF_STATUSES.REQUESTED, HANDOFF_STATUSES, "status"), createdAt: input.createdAt || new Date().toISOString() });
}
function createToolRequest(input = {}) {
  return Object.freeze({ toolCallId: requireNonEmptyString(input.toolCallId, "toolCallId"), runId: requireNonEmptyString(input.runId, "runId"), agentId: requireNonEmptyString(input.agentId, "agentId"), skillId: requireNonEmptyString(input.skillId, "skillId"), capability: requireNonEmptyString(input.capability, "capability"), action: requireNonEmptyString(input.action, "action"), args: Object.freeze({ ...(input.args || {}) }), createdAt: new Date().toISOString() });
}
module.exports = { APPROVAL_STATES, RUN_STATUSES, HANDOFF_STATUSES, requireEnum, createRun, createHandoff, createToolRequest };
