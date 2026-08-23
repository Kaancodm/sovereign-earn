const assert = require('node:assert/strict');
const test = require('node:test');
const { executeTool } = require('./tool-runtime');
const { ApprovalStore } = require('./approval');
const { AuditLog } = require('./audit');
const { registerAgent, registerSkill, registerTool, clearRegistriesForTests } = require('./registry');

const request = () => ({ runId: 'run-1', toolCallId: 'tool-1', agentId: 'headcoder', skillId: 'repository-analysis', capability: 'github.read', action: 'readRepo', args: { scope: 'agent-core' } });
const allowRule = { agentId: 'headcoder', skillId: 'repository-analysis', capability: 'github.read', action: 'readRepo', decision: 'allow', privileged: true };

function setup() {
  clearRegistriesForTests();
  registerAgent({ id: 'headcoder', active: true });
  registerSkill({ id: 'repository-analysis', allowedAgents: ['headcoder'] });
}

test('unregistered agent cannot execute', async () => {
  setup();
  const result = await executeTool({ request: request(), policyRules: [allowRule], audit: new AuditLog() });
  assert.equal(result.status, 'blocked');
});

test('unregistered tool cannot execute', async () => {
  setup();
  const result = await executeTool({ request: request(), policyRules: [allowRule], audit: new AuditLog() });
  assert.equal(result.status, 'blocked');
});

test('registered tool executes only after runtime checks', async () => {
  setup(); let calls = 0;
  registerTool({ skillId: 'repository-analysis', capability: 'github.read', action: 'readRepo', execute: async (args) => { calls += 1; return args; } });
  const result = await executeTool({ request: request(), policyRules: [allowRule], audit: new AuditLog() });
  assert.equal(result.status, 'executed'); assert.equal(calls, 1);
});

test('approval-required path rejects forged request approval', async () => {
  setup(); let calls = 0;
  registerTool({ skillId: 'repository-analysis', capability: 'github.read', action: 'readRepo', execute: async () => { calls += 1; return true; } });
  const forged = { ...request(), approval: 'approved' };
  const result = await executeTool({ request: forged, policyRules: [{ ...allowRule, decision: 'approval_required' }], audit: new AuditLog() });
  assert.equal(result.status, 'blocked'); assert.equal(calls, 0);
});

test('valid authoritative approval executes once and is consumed', async () => {
  setup(); let calls = 0;
  registerTool({ skillId: 'repository-analysis', capability: 'github.read', action: 'readRepo', execute: async () => { calls += 1; return true; } });
  const store = new ApprovalStore();
  const req = request();
  const approval = store.create({ ...req, requestedBy: 'headcoder', expiresAt: new Date(Date.now() + 60_000).toISOString() });
  store.approve(approval.approvalId, 'human');
  const first = await executeTool({ request: req, policyRules: [{ ...allowRule, decision: 'approval_required' }], approvalId: approval.approvalId, approvalStore: store, audit: new AuditLog() });
  const second = await executeTool({ request: req, policyRules: [{ ...allowRule, decision: 'approval_required' }], approvalId: approval.approvalId, approvalStore: store, audit: new AuditLog() });
  assert.equal(first.status, 'executed'); assert.equal(second.status, 'blocked'); assert.equal(calls, 1);
});
