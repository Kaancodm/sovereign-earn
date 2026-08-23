const assert = require('node:assert/strict');
const { evaluate } = require('./policy-engine');

const policies = {
  agents: {
    headcoder: { capabilities: ['github.read', 'github.write_branch', 'github.merge_production'] },
    research-agent: { capabilities: ['research.search'] },
    partnership-agent: { capabilities: ['mail.draft', 'mail.send'] },
    tech-agent: { capabilities: ['deployment.production', 'secrets.write'] },
  },
  capabilities: {
    'github.read': {},
    'github.write_branch': {},
    'github.merge_production': { approval: 'required' },
    'research.search': {},
    'mail.draft': {},
    'mail.send': { approval: 'required' },
    'deployment.production': { approval: 'required' },
    'secrets.write': { approval: 'required' },
  },
};

const cases = [
  ['read github', { agent: 'headcoder', capability: 'github.read' }, 'allow'],
  ['research cannot write github', { agent: 'research-agent', capability: 'github.write_branch' }, 'deny'],
  ['mail draft', { agent: 'partnership-agent', capability: 'mail.draft' }, 'allow'],
  ['mail send needs approval', { agent: 'partnership-agent', capability: 'mail.send' }, 'approval_required'],
  ['mail send approved', { agent: 'partnership-agent', capability: 'mail.send', approval: 'approved' }, 'allow'],
  ['production deploy needs approval', { agent: 'tech-agent', capability: 'deployment.production' }, 'approval_required'],
  ['unknown capability denied', { agent: 'headcoder', capability: 'unknown.capability' }, 'deny'],
];

for (const [name, input, expected] of cases) {
  const actual = evaluate({ ...input, policies });
  assert.equal(actual.decision, expected, name);
}

console.log(`Sovereign policy tests passed: ${cases.length}`);
