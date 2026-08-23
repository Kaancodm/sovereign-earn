const { evaluateToolAccess, DECISIONS } = require('./policy');

async function executeTool({ request, rules = [], handlers = {}, approval = 'not_required', audit = () => {} }) {
  const decision = evaluateToolAccess(request, rules);
  audit({
    type: 'tool.authorization',
    runId: request?.runId,
    actor: request?.agentId,
    target: `${request?.capability || 'unknown'}:${request?.action || 'unknown'}`,
    outcome: decision.decision,
  });

  if (decision.decision === DECISIONS.DENY) {
    return Object.freeze({ status: 'blocked', decision });
  }

  if (decision.decision === DECISIONS.APPROVAL_REQUIRED && approval !== 'approved') {
    return Object.freeze({ status: 'needs_approval', decision });
  }

  const handler = handlers[request.action];
  if (typeof handler !== 'function') {
    audit({
      type: 'tool.execution',
      runId: request.runId,
      actor: request.agentId,
      target: request.action,
      outcome: 'DENY',
    });
    return Object.freeze({
      status: 'blocked',
      decision: { decision: DECISIONS.DENY, reason: 'no_handler_registered' },
    });
  }

  const result = await handler(request.args || {});
  audit({
    type: 'tool.execution',
    runId: request.runId,
    actor: request.agentId,
    target: request.action,
    outcome: 'ALLOW',
  });
  return Object.freeze({ status: 'executed', result });
}

module.exports = { executeTool };
