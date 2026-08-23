'use strict';

const { APPROVAL_STATES, hashArgs, requireEnum, requireNonEmptyString } = require('./contracts');

function createApprovalStore({ now = () => Date.now() } = {}) {
  const records = new Map();

  function createApproval({ request, requestedBy, approvedBy, expiresAt, approvalId }) {
    requireNonEmptyString(requestedBy, 'requestedBy');
    requireNonEmptyString(approvedBy, 'approvedBy');
    requireNonEmptyString(approvalId, 'approvalId');
    if (records.has(approvalId)) throw new Error('approvalId already exists');
    const expiry = new Date(expiresAt).getTime();
    if (!Number.isFinite(expiry) || expiry <= now()) throw new TypeError('expiresAt must be a future timestamp');

    const artifact = Object.freeze({
      approvalId,
      runId: request.runId,
      agentId: request.agentId,
      toolCallId: request.toolCallId,
      skillId: request.skillId,
      capability: request.capability,
      action: request.action,
      argsHash: hashArgs(request.args),
      requestedBy,
      approvedBy,
      state: APPROVAL_STATES.APPROVED,
      expiresAt: new Date(expiry).toISOString(),
      consumedAt: null,
    });
    records.set(approvalId, artifact);
    return artifact;
  }

  function assertUsable({ approvalId, request, actorId }) {
    requireNonEmptyString(approvalId, 'approvalId');
    requireNonEmptyString(actorId, 'actorId');
    const artifact = records.get(approvalId);
    if (!artifact) throw new Error('Approval denied: unknown approval');
    if (artifact.state !== APPROVAL_STATES.APPROVED) throw new Error('Approval denied: invalid state');
    if (artifact.consumedAt) throw new Error('Approval denied: already consumed');
    if (new Date(artifact.expiresAt).getTime() <= now()) throw new Error('Approval denied: expired');
    if (artifact.approvedBy !== actorId) throw new Error('Approval denied: actor mismatch');

    for (const field of ['runId', 'agentId', 'toolCallId', 'skillId', 'capability', 'action']) {
      if (artifact[field] !== request[field]) throw new Error(`Approval denied: ${field} mismatch`);
    }
    if (artifact.argsHash !== hashArgs(request.args)) throw new Error('Approval denied: args mismatch');
    return artifact;
  }

  function consume(approvalId) {
    const artifact = records.get(approvalId);
    if (!artifact || artifact.state !== APPROVAL_STATES.APPROVED || artifact.consumedAt) {
      throw new Error('Approval denied: already consumed or invalid');
    }
    const consumed = Object.freeze({ ...artifact, state: APPROVAL_STATES.CONSUMED, consumedAt: new Date(now()).toISOString() });
    records.set(approvalId, consumed);
    return consumed;
  }

  function setState(approvalId, state) {
    requireEnum(state, APPROVAL_STATES, 'state');
    const artifact = records.get(approvalId);
    if (!artifact) throw new Error('unknown approval');
    const next = Object.freeze({ ...artifact, state });
    records.set(approvalId, next);
    return next;
  }

  function get(approvalId) { return records.get(approvalId); }

  return Object.freeze({ createApproval, assertUsable, consume, setState, get });
}

module.exports = { createApprovalStore };
