const assert = require('node:assert/strict');
const { createHandoff } = require('./handoff');

const handoff = createHandoff({
  runId: 'run-1', fromAgentId: 'headcoder', toAgentId: 'security',
  reason: 'security review', input: { scope: 'agent-core' },
  sourceCapabilities: ['github.read'], requestedCapabilities: ['github.read'],
});
assert.equal(handoff.toAgentId, 'security');
assert.deepEqual(handoff.requestedCapabilities, ['github.read']);
assert.throws(() => createHandoff({
  runId: 'run-1', fromAgentId: 'headcoder', toAgentId: 'security', reason: 'escalation',
  sourceCapabilities: ['github.read'], requestedCapabilities: ['github.write'],
}), /outside source scope/);
assert.throws(() => createHandoff({
  runId: 'run-1', fromAgentId: 'security', toAgentId: 'security', reason: 'loop',
}), /self-handoff/);
