const assert = require('node:assert/strict');
const { STATES, createApproval, transitionApproval } = require('./approval');

const approval = createApproval({
  runId: 'run-1',
  agentId: 'partnership',
  capability: 'mail.send',
  action: 'send',
});

assert.equal(approval.state, STATES.PENDING);
const approved = transitionApproval(approval, STATES.APPROVED);
assert.equal(approved.state, STATES.APPROVED);
assert.throws(() => transitionApproval(approved, STATES.REJECTED));
