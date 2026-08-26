const { randomUUID } = require('node:crypto');

function createHandoff({ runId, fromAgentId, toAgentId, reason, input = {}, sourceCapabilities = [], requestedCapabilities = [] }) {
  if (!runId) throw new Error('runId is required');
  if (!fromAgentId) throw new Error('fromAgentId is required');
  if (!toAgentId) throw new Error('toAgentId is required');
  if (!reason) throw new Error('reason is required');
  if (fromAgentId === toAgentId) throw new Error('self-handoff is not allowed');
  const source = new Set(sourceCapabilities);
  if (requestedCapabilities.some((capability) => !source.has(capability))) throw new Error('handoff requests capability outside source scope');

  return Object.freeze({
    id: randomUUID(), runId, fromAgentId, toAgentId, reason,
    input: Object.freeze({ ...input }),
    sourceCapabilities: Object.freeze([...sourceCapabilities]),
    requestedCapabilities: Object.freeze([...requestedCapabilities]),
    createdAt: new Date().toISOString(),
  });
}

module.exports = { createHandoff };
