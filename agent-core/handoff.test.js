const assert = require('node:assert/strict');
const { createHandoff } = require('./handoff');

const handoff = createHandoff({
  runId: 'run-1',
  fromAgentId: 'headcoder',
  toAgentId: 'security',
  reason: 'security review',
  input: { scope: 'agent-core' },
});

assert.equal(handoff.runId, 'run-1');
assert.equal(handoff.fromAgentId, 'headcoder');
assert.equal(handoff.toAgentId, 'security');
assert.equal(handoff.reason, 'security review');
assert.throws(() => createHandoff({ runId: 'run-1', fromAgentId: 'security', toAgentId: 'security', reason: 'loop' }));
