const assert = require('node:assert/strict');
const { registerAgent, registerSkill, clearRegistriesForTests } = require('./registry');
const { Orchestrator } = require('./orchestrator');
const { executeTool } = require('./tool-runtime');

clearRegistriesForTests();

registerAgent({ id: 'headcoder' });
registerAgent({ id: 'partnership' });
registerSkill({ id: 'repository-analysis', allowedAgents: ['headcoder'] });
registerSkill({ id: 'account-outreach', allowedAgents: ['partnership'] });

const orchestrator = new Orchestrator();
const run = orchestrator.startRun({
  agentId: 'headcoder',
  skillId: 'repository-analysis',
  input: { scope: 'agent-core' },
});

assert.ok(run.runId);

const rules = [
  {
    agentId: 'headcoder',
    skillId: 'repository-analysis',
    capability: 'github.read',
    action: 'readRepo',
    decision: 'allow',
  },
];

(async () => {
  const authorization = orchestrator.authorizeTool({
    runId: run.runId,
    agentId: 'headcoder',
    skillId: 'repository-analysis',
    capability: 'github.read',
    action: 'readRepo',
  });
  assert.equal(authorization, 'allow');

  const result = await executeTool({
    request: {
      runId: run.runId,
      agentId: 'headcoder',
      skillId: 'repository-analysis',
      capability: 'github.read',
      action: 'readRepo',
      args: { scope: 'agent-core' },
    },
    rules,
    handlers: { readRepo: async (args) => ({ verifiedScope: args.scope }) },
  });

  assert.equal(result.status, 'executed');
  assert.equal(result.result.verifiedScope, 'agent-core');
  assert.ok(orchestrator.auditLog.all().length >= 2);
})();
