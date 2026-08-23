const { randomUUID } = require('node:crypto');

function createHandoff({ runId, fromAgentId, toAgentId, reason, input = {} }) {
  if (!runId) throw new Error('runId is required');
  if (!fromAgentId) throw new Error('fromAgentId is required');
  if (!toAgentId) throw new Error('toAgentId is required');
  if (!reason) throw new Error('reason is required');
  if (fromAgentId === toAgentId) throw new Error('self-handoff is not allowed');

  return Object.freeze({
    id: randomUUID(),
    runId,
    fromAgentId,
    toAgentId,
    reason,
    input: Object.freeze({ ...input }),
    createdAt: new Date().toISOString(),
  });
}

module.exports = { createHandoff };
