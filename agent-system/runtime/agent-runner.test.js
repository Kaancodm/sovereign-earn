const assert = require('node:assert/strict');
const { AgentRunner } = require('./agent-runner');

const runner = new AgentRunner({
  agents: {
    sovereign-core: { capabilities: ['research.search'] },
    headcoder: { capabilities: ['github.read', 'github.write_branch'] },
    partnership-agent: { capabilities: ['mail.draft', 'mail.send'] },
  },
  capabilities: {
    'research.search': {},
    'github.read': {},
    'github.write_branch': {},
    'mail.draft': {},
    'mail.send': { approval: 'required' },
  },
  router: {
    routes: [
      { domain: 'business', keywords: ['partner'], agent: 'partnership-agent', default_skill: 'partner-research' },
      { domain: 'engineering', keywords: ['code'], agent: 'headcoder', default_skill: 'repository-analysis' },
    ],
    default: { agent: 'sovereign-core', skill: 'project-intake' },
  },
  skillRegistry: {
    'partner-research': {},
    'repository-analysis': {},
    'project-intake': {},
  },
  execute: async ({ capability }) => ({ executed: capability }),
});

(async () => {
  const engineering = await runner.run(
    { task_id: 't-1', objective: 'implement code change', scope: 'repo', domain: 'engineering', risk: 2 },
    { capability: 'github.write_branch' },
  );
  assert.equal(engineering.status, 'complete');
  assert.equal(engineering.agent, 'headcoder');

  const mail = await runner.run(
    { task_id: 't-2', objective: 'contact partner', scope: 'outreach', domain: 'business', risk: 4 },
    { capability: 'mail.send' },
  );
  assert.equal(mail.status, 'needs_approval');

  const approvedMail = await runner.run(
    { task_id: 't-3', objective: 'contact partner', scope: 'outreach', domain: 'business', risk: 4 },
    { capability: 'mail.send', approval: 'approved' },
  );
  assert.equal(approvedMail.status, 'complete');

  console.log('Sovereign agent runner tests passed: 3');
})();
