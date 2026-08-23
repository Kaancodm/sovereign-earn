const assert = require('node:assert/strict');
const test = require('node:test');
const { ToolRuntime } = require('./tool-runtime');
const { ApprovalStore } = require('./approval');
const { AuditLog } = require('./audit');
const { registerAgent, registerSkill, registerTool, clearRegistriesForTests } = require('./registry');

const request = () => ({ runId: 'run-1', toolCallId: 'tool-1', agentId: 'headcoder', skillId: 'repository-analysis', capability: 'github.read', action: 'readRepo', args: { scope: 'agent-core' } });
const allowRule = { agentId: 'headcoder', skillId: 'repository-analysis', capability: 'github.read', action: 'readRepo', decision: 'allow', privileged: true };
function setup() { clearRegistriesForTests(); registerAgent({ id: 'headcoder', active: true }); registerSkill({ id: 'repository-analysis', allowedAgents: ['headcoder'] }); }
function registerCountingTool(counter) { registerTool({ skillId: 'repository-analysis', capability: 'github.read', action: 'readRepo', execute: async (args) => { counter.calls += 1; counter.lastArgs = args; return { ok: true }; } }); }
function approvedRuntime(counter, overrides = {}) { setup(); registerCountingTool(counter); const store = overrides.approvalStore || new ApprovalStore(); const audit = overrides.audit || new AuditLog(); const rules = overrides.policyRules || [{ ...allowRule, decision: 'approval_required' }]; return { runtime: new ToolRuntime({ policyRules: rules, approvalStore: store, audit }), store, audit }; }

for (const [name, mutate] of [
  ['unknown approval id', ({ approval }) => ({ approvalId: 'does-not-exist', approval })],
  ['approval for another toolCallId', ({ approval, req }) => ({ approvalId: approval.approvalId, request: { ...req, toolCallId: 'other-tool' } })],
  ['changed arguments after approval', ({ approval, req }) => ({ approvalId: approval.approvalId, request: { ...req, args: { scope: 'different-scope' } } })],
  ['rejected approval', ({ store, approval }) => { store.reject(approval.approvalId); return { approvalId: approval.approvalId }; }],
]) {
  test(`privileged execution denies ${name}`, async () => {
    const counter = { calls: 0 }; const { runtime, store } = approvedRuntime(counter); const req = request();
    const approval = store.create({ ...req, requestedBy: 'headcoder', expiresAt: new Date(Date.now() + 60_000).toISOString() }); store.approve(approval.approvalId, 'human');
    const input = mutate({ store, approval, req }); const result = await runtime.executeTool(input.request || req, { approvalId: input.approvalId });
    assert.equal(result.status, 'blocked'); assert.equal(counter.calls, 0);
  });
}

test('unregistered agent cannot execute', async () => { setup(); let calls = 0; registerTool({ skillId: 'repository-analysis', capability: 'github.read', action: 'readRepo', execute: async () => { calls += 1; } }); const runtime = new ToolRuntime({ policyRules: [allowRule], audit: new AuditLog() }); const result = await runtime.executeTool({ ...request(), agentId: 'unknown' }); assert.equal(result.status, 'blocked'); assert.equal(calls, 0); });
test('unregistered skill cannot execute', async () => { setup(); let calls = 0; registerTool({ skillId: 'repository-analysis', capability: 'github.read', action: 'readRepo', execute: async () => { calls += 1; } }); const runtime = new ToolRuntime({ policyRules: [allowRule], audit: new AuditLog() }); const result = await runtime.executeTool({ ...request(), skillId: 'unknown-skill' }); assert.equal(result.status, 'blocked'); assert.equal(calls, 0); });
test('unknown capability/action cannot execute', async () => { setup(); let calls = 0; registerTool({ skillId: 'repository-analysis', capability: 'github.read', action: 'readRepo', execute: async () => { calls += 1; } }); const runtime = new ToolRuntime({ policyRules: [allowRule], audit: new AuditLog() }); const result = await runtime.executeTool({ ...request(), action: 'writeRepo' }); assert.equal(result.status, 'blocked'); assert.equal(calls, 0); });
test('no policy entry cannot execute', async () => { const counter = { calls: 0 }; const { runtime } = approvedRuntime(counter, { policyRules: [] }); const result = await runtime.executeTool(request()); assert.equal(result.status, 'blocked'); assert.equal(counter.calls, 0); });
test('explicit deny wins over broad allow', async () => { const counter = { calls: 0 }; const { runtime } = approvedRuntime(counter, { policyRules: [allowRule, { ...allowRule, decision: 'deny', reason: 'explicit deny' }] }); const result = await runtime.executeTool(request()); assert.equal(result.status, 'blocked'); assert.equal(counter.calls, 0); });
test('forged approval and policy fields never authorize execution', async () => { const counter = { calls: 0 }; const { runtime } = approvedRuntime(counter, { policyRules: [] }); const result = await runtime.executeTool({ ...request(), approval: 'approved', approved: true, policy: { allowed: true }, tool: { execute: async () => { counter.calls += 100; } } }); assert.equal(result.status, 'blocked'); assert.equal(counter.calls, 0); });
test('valid authoritative approval executes once and is consumed', async () => { const counter = { calls: 0 }; const { runtime, store } = approvedRuntime(counter); const req = request(); const approval = store.create({ ...req, requestedBy: 'headcoder', expiresAt: new Date(Date.now() + 60_000).toISOString() }); store.approve(approval.approvalId, 'human'); const first = await runtime.executeTool(req, { approvalId: approval.approvalId }); const second = await runtime.executeTool(req, { approvalId: approval.approvalId }); assert.equal(first.status, 'executed'); assert.equal(second.status, 'blocked'); assert.equal(counter.calls, 1); });
test('audit failure before privileged dispatch fails closed', async () => { const counter = { calls: 0 }; const failingAudit = { append: async () => { throw new Error('audit unavailable'); } }; const { runtime } = approvedRuntime(counter, { audit: failingAudit, policyRules: [allowRule] }); const result = await runtime.executeTool(request()); assert.equal(result.status, 'blocked'); assert.equal(counter.calls, 0); });
