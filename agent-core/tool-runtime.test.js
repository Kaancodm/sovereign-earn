const assert = require('node:assert/strict');
const { executeTool } = require('./tool-runtime');

(async () => {
  const rules = [
    {
      agentId: 'headcoder',
      skillId: 'repository-analysis',
      capability: 'github.read',
      action: 'readRepo',
      decision: 'allow',
    },
    {
      agentId: 'partnership',
      skillId: 'account-outreach',
      capability: 'mail.send',
      action: 'sendMail',
      decision: 'approval_required',
    },
  ];

  const audit = [];
  const handlers = {
    readRepo: async (args) => ({ ok: true, scope: args.scope }),
    sendMail: async () => ({ sent: true }),
  };

  const allowed = await executeTool({
    request: {
      runId: 'run-1',
      agentId: 'headcoder',
      skillId: 'repository-analysis',
      capability: 'github.read',
      action: 'readRepo',
      args: { scope: 'agent-core' },
    },
    rules,
    handlers,
    audit: (event) => audit.push(event),
  });

  assert.equal(allowed.status, 'executed');
  assert.equal(allowed.result.ok, true);

  const denied = await executeTool({
    request: {
      runId: 'run-2',
      agentId: 'research',
      skillId: 'research',
      capability: 'github.write',
      action: 'writeRepo',
    },
    rules,
    handlers,
    audit: (event) => audit.push(event),
  });

  assert.equal(denied.status, 'blocked');

  const pending = await executeTool({
    request: {
      runId: 'run-3',
      agentId: 'partnership',
      skillId: 'account-outreach',
      capability: 'mail.send',
      action: 'sendMail',
    },
    rules,
    handlers,
    audit: (event) => audit.push(event),
  });

  assert.equal(pending.status, 'needs_approval');

  const approved = await executeTool({
    request: {
      runId: 'run-4',
      agentId: 'partnership',
      skillId: 'account-outreach',
      capability: 'mail.send',
      action: 'sendMail',
    },
    rules,
    handlers,
    approval: 'approved',
    audit: (event) => audit.push(event),
  });

  assert.equal(approved.status, 'executed');
  assert.ok(audit.length >= 4);
})();
