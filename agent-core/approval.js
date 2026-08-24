"use strict";
const { createHash, randomUUID } = require("node:crypto");
const { APPROVAL_STATES } = require("./contracts");
const STATES = Object.freeze({ PENDING: APPROVAL_STATES.PENDING, APPROVED: APPROVAL_STATES.APPROVED, REJECTED: APPROVAL_STATES.REJECTED, EXPIRED: APPROVAL_STATES.EXPIRED, CONSUMED: APPROVAL_STATES.CONSUMED });
const APPROVAL_SOURCES = Object.freeze({ HUMAN: "human", CO_PILOT_OVERRIDE: "co_pilot_override" });

function canonicalize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
}
function hashArgs(args = {}) { return createHash("sha256").update(canonicalize(args)).digest("hex"); }

function createApproval({ runId, agentId, toolCallId, skillId, capability, action, args, requestedBy, expiresAt, source = APPROVAL_SOURCES.HUMAN, reason = null, approvedBy = null }) {
  for (const [field, value] of Object.entries({ runId, agentId, toolCallId, skillId, capability, action, requestedBy })) if (!value) throw new Error(`${field} is required`);
  if (!expiresAt || Number.isNaN(Date.parse(expiresAt))) throw new Error("expiresAt is required");
  if (!Object.values(APPROVAL_SOURCES).includes(source)) throw new Error("source is invalid");
  return Object.freeze({ approvalId: randomUUID(), runId, agentId, toolCallId, skillId, capability, action, argsHash: hashArgs(args), requestedBy, approvedBy, source, reason, state: approvedBy ? STATES.APPROVED : STATES.PENDING, expiresAt, consumedAt: null });
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
  create(input) { const approval = createApproval(input); this.#approvals.set(approval.approvalId, approval); return approval; }
  createCoPilotOverride(input, approvedBy = "co-pilot") { return this.create({ ...input, source: APPROVAL_SOURCES.CO_PILOT_OVERRIDE, approvedBy, requestedBy: approvedBy }); }
  get(approvalId) { return this.#approvals.get(approvalId); }
  approve(approvalId, approvedBy) { const current = this.#approvals.get(approvalId); if (!current) throw new Error("unknown approval"); const next = approveApproval(current, approvedBy); this.#approvals.set(approvalId, next); return next; }
  reject(approvalId) { const current = this.#approvals.get(approvalId); if (!current) throw new Error("unknown approval"); const next = rejectApproval(current); this.#approvals.set(approvalId, next); return next; }
  assertUsable({ approvalId, request }) {
    const approval = this.#approvals.get(approvalId);
    if (!approval) throw new Error("unknown approval");
    if (approval.state !== STATES.APPROVED) throw new Error("approval is not approved");
    if (Date.parse(approval.expiresAt) <= Date.now()) { this.#approvals.set(approvalId, Object.freeze({ ...approval, state: STATES.EXPIRED })); throw new Error("approval is expired"); }
    const exact = ["runId", "agentId", "toolCallId", "skillId", "capability", "action"].every((field) => approval[field] === request[field]);
    if (!exact || approval.argsHash !== hashArgs(request.args)) throw new Error("approval is not bound to this exact request");
    return approval;
  }
  consume(approvalId) { const current = this.#approvals.get(approvalId); if (!current || current.state !== STATES.APPROVED) throw new Error("approval is not consumable"); const next = Object.freeze({ ...current, state: STATES.CONSUMED, consumedAt: new Date().toISOString() }); this.#approvals.set(approvalId, next); return next; }
}

module.exports = { STATES, APPROVAL_SOURCES, hashArgs, createApproval, approveApproval, rejectApproval, ApprovalStore };
