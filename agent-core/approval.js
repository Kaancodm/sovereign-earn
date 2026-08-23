const STATES = Object.freeze({
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
});

const TRANSITIONS = Object.freeze({
  PENDING: new Set(['APPROVED', 'REJECTED']),
  APPROVED: new Set(),
  REJECTED: new Set(),
});

function createApproval({ runId, agentId, capability, action }) {
  if (!runId) throw new Error('runId is required');
  if (!agentId) throw new Error('agentId is required');
  if (!capability) throw new Error('capability is required');
  if (!action) throw new Error('action is required');

  return { id: crypto.randomUUID(), runId, agentId, capability, action, state: STATES.PENDING };
}

function transitionApproval(approval, nextState) {
  if (!TRANSITIONS[approval?.state]?.has(nextState)) {
    throw new Error(`invalid approval transition: ${approval?.state} -> ${nextState}`);
  }
  return Object.freeze({ ...approval, state: nextState });
}

module.exports = { STATES, createApproval, transitionApproval };
