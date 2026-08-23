const assert = require('node:assert/strict');
const test = require('node:test');
const { ToolRuntime } = require('./tool-runtime');
const { ApprovalStore } = require('./approval');
const { AuditLog } = require('./audit');
const { createBudget } = require('./budget');
const { createGovernanceContext } = require('./governance');
const { createTraceContext } = require('./tracing');
const { registerAgent, registerSkill, registerTool, clearRegistriesForTests } = require('./registry');

const request = () => ({ runId: 'run-1', toolCallId: 'tool-1', agentId: 'headcoder', skillId: 'repository-analysis', capability: 'github.read', action: 'readRepo', args: { scope: 'agent-core' } });
const allowRule = { agentId: 'headcoder', skillId: 'repository-analysis', capability: 'github.read', action: 'readRepo', decision: 'allow', privileged: true };
const runtimeContext = (overrides = {}) => {
  const runId = overrides.runId || 'run-1';
  const agentId = overrides.agentId || 'headcoder';
  const sessionMode = overrides.sessionMode || 'production';
  return {
    runId,
    agentId,
    budget: createBudget(),
    governanceContext: createGovernanceContext({ identity: { userId: 'user-1', role: 'user' }, sessionMode, scopes: ['github.read'] }),
    contextManifest: { contextVersion: '1.0.0', runId, agentId, sessionMode, architectureVersion: '1.0.0', policyVersion: '1.0.0', flowVersion: '1.0.0', workspaceMapVersion: '1.0.0', skillVersions: ['repository-analysis@1.0.0'], artifactRefs: [], dataClassification: { prompt: 'model_visible', userRecord: 'core_only' } },
    traceContext: createTraceContext({ traceId: `trace-${runId}`, runId, agentId }),
  };
};
function setup() { clearRegistriesForTests(); registerAgent({ id: 'headcoder', active: true }); registerSkill({ id: 'repository-analysis', allowedAgents: ['headcoder'] }); }
function registerCountingTool(counter) { registerTool({ skillId: 'repository-analysis', capability: 'github.read', action: 'readRepo', execute: async (args) => { counter.calls += 1; counter.lastArgs = args; return { ok: true }; } }); }
function approvedRuntime(counter, overrides = {}) { setup(); registerCountingTool(counter); const store = overrides.approvalStore || new ApprovalStore(); const audit = overrides.audit || new AuditLog(); const rules = overrides.policyRules || [{ ...allowRule, decision: 'approval_required' }]; return { runtime: new ToolRuntime({ policyRules: rules, approvalStore: store, audit, runtimeContext: runtimeContext() }), store, audit }; }

for (const [name, mutate] of [
  ['unknown approval id', ({ approval }) => ({ approvalId: 'does-not-exist', approval })],
  ['approval for another toolCallId', ({ approval, req }) => ({ approvalId: approval.approvalId, request: { ...req, toolCallId: 'other-tool' } })],
  ['changed arguments after approval', ({ approval, req }) => ({ approvalId: approval.approvalId, request: { ...req, args: { scope: 'different-scope' } } })],
  ['rejected approval', ({ store }) => { const req = request(); const pending = store.create({ ...req, requestedBy: 'headcoder', expiresAt: new Date(Date.now() + 60_000).toISOString() }); store.reject(pending.approvalId); return { approvalId: pending.approvalId }; }],
]) {
  test(`privileged execution denies ${name}`, async () => {
    const counter = { calls: 0 }; const { runtime, store } = approvedRuntime(counter); const req = request();
    let approval;
    if (name === 'rejected approval') {
      const pending = store.get(mutate({ store }).approvalId); approval = pending;
    } else {
      approval = store.create({ ...req, requestedBy: 'headcoder', expiresAt: new Date(Date.now() + 60_000).toISOString() }); store.approve(approval.approvalId, 'human');
    }
    const input = mutate({ store, approval, req }); const result = await runtime.executeTool(input.request || req, { approvalId: input.approvalId });
    assert.equal(result.status, 'blocked'); assert.equal(counter.calls, 0);
  });
}

test('unregistered agent cannot execute', async () => { setup(); let calls = 0; registerTool({ skillId: 'repository-analysis', capability: 'github.read', action: 'readRepo', execute: async () => { calls += 1; } }); const runtime = new ToolRuntime({ policyRules: [allowRule], audit: new AuditLog(), runtimeContext: runtimeContext() }); const result = await runtime.executeTool({ ...request(), agentId: 'unknown' }); assert.equal(result.status, 'blocked'); assert.equal(calls, 0); });
test('unregistered skill cannot execute', async () => { setup(); let calls = 0; registerTool({ skillId: 'repository-analysis', capability: 'github.read', action: 'readRepo', execute: async () => { calls += 1; } }); const runtime = new ToolRuntime({ policyRules: [allowRule], audit: new AuditLog(), runtimeContext: runtimeContext() }); const result = await runtime.executeTool({ ...request(), skillId: 'unknown-skill' }); assert.equal(result.status, 'blocked'); assert.equal(calls, 0); });
test('unknown capability/action cannot execute', async () => { setup(); let calls = 0; registerTool({ skillId: 'repository-analysis', capability: 'github.read', action: 'readRepo', execute: async () => { calls += 1; } }); const runtime = new ToolRuntime({ policyRules: [allowRule], audit: new AuditLog(), runtimeContext: runtimeContext() }); const result = await runtime.executeTool({ ...request(), action: 'writeRepo' }); assert.equal(result.status, 'blocked'); assert.equal(calls, 0); });
test('no policy entry cannot execute', async () => { const counter = { calls: 0 }; const { runtime } = approvedRuntime(counter, { policyRules: [] }); const result = await runtime.executeTool(request()); assert.equal(result.status, 'blocked'); assert.equal(counter.calls, 0); });
test('explicit deny wins over broad allow', async () => { const counter = { calls: 0 }; const { runtime } = approvedRuntime(counter, { policyRules: [allowRule, { ...allowRule, decision: 'deny', reason: 'explicit deny' }] }); const result = await runtime.executeTool(request()); assert.equal(result.status, 'blocked'); assert.equal(counter.calls, 0); });
test('forged approval and policy fields never authorize execution', async () => { const counter = { calls: 0 }; const { runtime } = approvedRuntime(counter, { policyRules: [] }); const result = await runtime.executeTool({ ...request(), approval: 'approved', approved: true, policy: { allowed: true }, tool: { execute: async () => { counter.calls += 100; } } }); assert.equal(result.status, 'blocked'); assert.equal(counter.calls, 0); });
test('valid authoritative approval executes once and is consumed', async () => { const counter = { calls: 0 }; const { runtime, store } = approvedRuntime(counter); const req = request(); const approval = store.create({ ...req, requestedBy: 'headcoder', expiresAt: new Date(Date.now() + 60_000).toISOString() }); store.approve(approval.approvalId, 'human'); const first = await runtime.executeTool(req, { approvalId: approval.approvalId }); const second = await runtime.executeTool(req, { approvalId: approval.approvalId }); assert.equal(first.status, 'executed'); assert.equal(second.status, 'blocked'); assert.equal(second.decision.category, 'replay_detected'); assert.equal(counter.calls, 1); });
test('approval/exposure replay is detected even with a fresh approval', async () => { const counter = { calls: 0 }; const { runtime, store } = approvedRuntime(counter); const req = request(); const firstApproval = store.create({ ...req, requestedBy: 'headcoder', expiresAt: new Date(Date.now() + 60_000).toISOString() }); store.approve(firstApproval.approvalId, 'human'); const first = await runtime.executeTool(req, { approvalId: firstApproval.approvalId }); assert.equal(first.status, 'executed'); const secondApproval = store.create({ ...req, requestedBy: 'headcoder', expiresAt: new Date(Date.now() + 60_000).toISOString() }); store.approve(secondApproval.approvalId, 'human'); const replay = await runtime.executeTool(req, { approvalId: secondApproval.approvalId }); assert.equal(replay.status, 'blocked'); assert.equal(replay.decision.category, 'replay_detected'); assert.equal(counter.calls, 1); });
test('approval/exposure hash changes are denied before dispatch', async () => { const counter = { calls: 0 }; const { runtime, store } = approvedRuntime(counter); const req = request(); const approval = store.create({ ...req, requestedBy: 'headcoder', expiresAt: new Date(Date.now() + 60_000).toISOString() }); store.approve(approval.approvalId, 'human'); const mutated = await runtime.executeTool({ ...req, args: { scope: 'agent-core', exposure: { amount: 999 } } }, { approvalId: approval.approvalId }); assert.equal(mutated.status, 'blocked'); assert.equal(mutated.decision.category, 'approval_invalid'); assert.equal(counter.calls, 0); });
test('handoff cannot activate privileged capability outside the target policy scope', async () => { setup(); registerAgent({ id: 'handoff-agent', active: true }); registerSkill({ id: 'repository-analysis', allowedAgents: ['handoff-agent'] }); const counter = { calls: 0 }; registerCountingTool(counter); const targetRequest = { ...request(), runId: 'run-2', toolCallId: 'tool-2', agentId: 'handoff-agent' }; const targetRuntime = new ToolRuntime({ policyRules: [allowRule], approvalStore: new ApprovalStore(), audit: new AuditLog(), runtimeContext: runtimeContext({ runId: 'run-2', agentId: 'handoff-agent' }) }); const result = await targetRuntime.executeTool(targetRequest); assert.equal(result.status, 'blocked'); assert.equal(result.decision.category, 'policy_violation'); assert.equal(counter.calls, 0); });
test('audit failure before privileged dispatch fails closed', async () => { const counter = { calls: 0 }; const failingAudit = { append: async () => { throw new Error('audit unavailable'); } }; const { runtime } = approvedRuntime(counter, { audit: failingAudit, policyRules: [allowRule] }); const result = await runtime.executeTool(request()); assert.equal(result.status, 'blocked'); assert.equal(counter.calls, 0); });
