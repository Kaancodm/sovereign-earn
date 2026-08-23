const fs = require('node:fs');
const path = require('node:path');

function loadYaml(file) {
  // Runtime intentionally depends on a YAML parser supplied by the host application.
  // This module accepts already-parsed policy objects through its public API.
  if (!fs.existsSync(file)) throw new Error(`Policy file not found: ${file}`);
  return fs.readFileSync(file, 'utf8');
}

function evaluate({ agent, capability, approval = 'none', policies }) {
  if (!agent || !capability) return { decision: 'deny', reason: 'missing agent or capability' };
  const agentDef = policies.agents?.[agent];
  const capabilityDef = policies.capabilities?.[capability];

  if (!agentDef) return { decision: 'deny', reason: 'unknown agent' };
  if (!capabilityDef) return { decision: 'deny', reason: 'unknown capability' };

  const allowed = (agentDef.capabilities || []).includes(capability);
  if (!allowed) return { decision: 'deny', reason: 'agent lacks capability' };

  const required = capabilityDef.approval || 'none';
  if (required === 'required' && approval !== 'approved') {
    return { decision: 'approval_required', reason: 'capability requires approval' };
  }

  return { decision: 'allow', reason: 'agent and capability authorized' };
}

function assertAllowed(input) {
  const result = evaluate(input);
  if (result.decision !== 'allow') {
    const error = new Error(`${result.decision}: ${result.reason}`);
    error.code = result.decision.toUpperCase();
    throw error;
  }
  return result;
}

module.exports = { evaluate, assertAllowed, loadYaml };
