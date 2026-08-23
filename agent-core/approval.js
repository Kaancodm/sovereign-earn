"use strict";
const { createHash, randomUUID } = require("node:crypto");
const { APPROVAL_STATES } = require("./contracts");
const STATES = Object.freeze({ PENDING: APPROVAL_STATES.PENDING, APPROVED: APPROVAL_STATES.APPROVED, REJECTED: APPROVAL_STATES.REJECTED, EXPIRED: APPROVAL_STATES.EXPIRED, CONSUMED: APPROVAL_STATES.CONSUMED });

function canonicalize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
}
function hashArgs(args = {}) { return createHash("sha256").update(canonicalize(args)).digest("hex"); }
function replayKey(request, argsHash = hashArgs(request?.args)) {
  return `${request?.runId}:${request?.toolCallId}:${argsHash}`;
}
function approvalError(message, category = "approval_invalid") {
  return Object.assign(new Error(message), { category });
}

function createApproval({ runId, agentId, toolCallId, skillId, capability, action, args, requestedBy, expiresAt }) {
  for (const [field, value] of Object.entries({ runId, agentId, toolCallId, skillId, capability, action, requestedBy })) if (!value) throw new Error(`${field} is required`);
  if (!expiresAt || Number.isNaN(Date.parse(expiresAt))) throw new Error("expiresAt is required");
  return Object.freeze({ approvalId: randomUUID(), runId, agentId, toolCallId, skillId, capability, action, argsHash: hashArgs(args), requestedBy, approvedBy: null, state: STATES.PENDING, expiresAt, consumedAt: null });
}
function approveApproval(approval, approvedBy) {
  if (!approvedBy) throw new Error("approvedBy is required");
  if (approval?.state !== STATES.PENDING) throw new Error(`invalid approval transition: ${approval?.state} -> ${STATES.APPROVED}`);
  if (Date.parse(approval.expiresAt) <= Date.now()) return Object.freeze({ ...approval, state: STATES.EXPIRED });
  return Object.freeze({ ...approval, approvedBy, state: STATES.APPROVED });
}
function rejectApproval(approval) {
  if (approval?.state !== STATES.PENDING) throw new Error(`invalid approval transition: ${approval?.state} -> ${STATES.REJECTED}`);
  return Object.freeze({ ...approval, state: STATES.REJECTED });
}

class ApprovalStore {
  #approvals = new Map();
  #spent = new Set();
  create(input) { const approval = createApproval(input); this.#approvals.set(approval.approvalId, approval); return approval; }
  get(approvalId) { return this.#approvals.get(approvalId); }
  approve(approvalId, approvedBy) { const current = this.#approvals.get(approvalId); if (!current) throw new Error("unknown approval"); const next = approveApproval(current, approvedBy); this.#approvals.set(approvalId, next); return next; }
  reject(approvalId) { const current = this.#approvals.get(approvalId); if (!current) throw new Error("unknown approval"); const next = rejectApproval(current); this.#approvals.set(approvalId, next); return next; }
  assertUsable({ approvalId, request }) {
    const approval = this.#approvals.get(approvalId);
    if (!approval) throw approvalError("unknown approval");
    const argsHash = hashArgs(request?.args);
    const key = replayKey(request, argsHash);
    if (this.#spent.has(key) || approval.state === STATES.CONSUMED) throw approvalError("replay detected", "replay_detected");
    if (approval.state !== STATES.APPROVED) throw approvalError("approval is not approved");
    if (Date.parse(approval.expiresAt) <= Date.now()) { this.#approvals.set(approvalId, Object.freeze({ ...approval, state: STATES.EXPIRED })); throw approvalError("approval is expired", "approval_expired"); }
    const exact = ["runId", "agentId", "toolCallId", "skillId", "capability", "action"].every((field) => approval[field] === request[field]);
    if (!exact || approval.argsHash !== argsHash) throw approvalError("approval is not bound to this exact request");
    return approval;
  }
  consume(approvalId, request) {
    const current = this.#approvals.get(approvalId);
    if (!current || current.state !== STATES.APPROVED) throw approvalError("approval is not consumable", current?.state === STATES.CONSUMED ? "replay_detected" : "approval_invalid");
    const argsHash = hashArgs(request?.args);
    const key = replayKey(request, argsHash);
    if (this.#spent.has(key)) throw approvalError("replay detected", "replay_detected");
    if (current.argsHash !== argsHash || current.runId !== request.runId || current.agentId !== request.agentId || current.toolCallId !== request.toolCallId || current.skillId !== request.skillId || current.capability !== request.capability || current.action !== request.action) {
      throw approvalError("approval is not bound to this exact request");
    }
    this.#spent.add(key);
    const next = Object.freeze({ ...current, state: STATES.CONSUMED, consumedAt: new Date().toISOString() });
    this.#approvals.set(approvalId, next);
    return next;
  }
}

module.exports = { STATES, canonicalize, hashArgs, replayKey, createApproval, approveApproval, rejectApproval, ApprovalStore };
