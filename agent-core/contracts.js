"use strict";

const APPROVAL_STATES = Object.freeze({
  NOT_REQUIRED: "not_required",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
});

function requireNonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function createRun(input = {}) {
  return Object.freeze({
    runId: requireNonEmptyString(input.runId, "runId"),
    agentId: requireNonEmptyString(input.agentId, "agentId"),
    taskId: requireNonEmptyString(input.taskId, "taskId"),
    status: input.status || "created",
    createdAt: input.createdAt || new Date().toISOString(),
  });
}

function createHandoff(input = {}) {
  return Object.freeze({
    handoffId: requireNonEmptyString(input.handoffId, "handoffId"),
    runId: requireNonEmptyString(input.runId, "runId"),
    fromAgent: requireNonEmptyString(input.fromAgent, "fromAgent"),
    toAgent: requireNonEmptyString(input.toAgent, "toAgent"),
    reason: requireNonEmptyString(input.reason, "reason"),
    status: input.status || "requested",
    createdAt: input.createdAt || new Date().toISOString(),
  });
}

function createToolRequest(input = {}) {
  return Object.freeze({
    toolCallId: requireNonEmptyString(input.toolCallId, "toolCallId"),
    runId: requireNonEmptyString(input.runId, "runId"),
    agentId: requireNonEmptyString(input.agentId, "agentId"),
    skillId: requireNonEmptyString(input.skillId, "skillId"),
    capability: requireNonEmptyString(input.capability, "capability"),
    action: requireNonEmptyString(input.action, "action"),
    approval: input.approval || APPROVAL_STATES.NOT_REQUIRED,
    createdAt: input.createdAt || new Date().toISOString(),
  });
}

module.exports = {
  APPROVAL_STATES,
  createRun,
  createHandoff,
  createToolRequest,
};
