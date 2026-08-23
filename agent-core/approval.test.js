const assert = require('node:assert/strict');
const { STATES, ApprovalStore } = require('./approval');

const base = {
  runId: 'run-1', agentId: 'partnership', toolCallId: 'tool-1',
  skillId: 'account-outreach', capability: 'mail.send', action: 'send',
  args: { message: 'hello' }, requestedBy: 'partnership',
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
};

const store = new ApprovalStore();
const approval = store.create(base);
assert.equal(approval.state, STATES.PENDING);
assert.equal(approval.approvedBy, null);
assert.equal(store.assertUsable({ approvalId: approval.approvalId, request: { ...base, approval: 'forged' } }).approvalId, approval.approvalId);
assert.throws(() => store.assertUsable({ approvalId: approval.approvalId, request: { ...base, toolCallId: 'tool-2' } }), /not bound/);
assert.throws(() => store.assertUsable({ approvalId: approval.approvalId, request: { ...base, args: { message: 'changed' } } }), /not bound/);
const consumed = store.consume(approval.approvalId, base);
assert.equal(consumed.state, STATES.CONSUMED);
assert.throws(() => store.assertUsable({ approvalId: approval.approvalId, request: base }), error => error?.category === 'replay_detected');
assert.throws(() => store.consume(approval.approvalId, base), error => error?.category === 'replay_detected');
