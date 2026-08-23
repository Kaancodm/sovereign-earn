import { randomUUID } from 'node:crypto';
import { getAgent, getSkill } from './registry.js';
import { createAuditEvent, AuditLog } from './audit.js';
import { evaluatePolicy } from './policy.js';

export class Orchestrator {
  constructor({ auditLog = new AuditLog() } = {}) {
    this.auditLog = auditLog;
  }

  startRun({ agentId, skillId, input = {} }) {
    const runId = randomUUID();
    const agent = getAgent(agentId);
    const skill = getSkill(skillId);

    if (!agent || !skill) {
      this.auditLog.append(createAuditEvent({
        runId,
        type: 'run.start',
        actor: agentId ?? 'unknown',
        outcome: 'DENY',
        metadata: { reason: 'unknown_agent_or_skill', agentId, skillId },
      }));
      throw new Error('unknown agent or skill');
    }

    if (!skill.allowedAgents?.includes(agentId)) {
      this.auditLog.append(createAuditEvent({
        runId,
        type: 'run.start',
        actor: agentId,
        target: skillId,
        outcome: 'DENY',
        metadata: { reason: 'agent_not_allowed_for_skill' },
      }));
      throw new Error('agent is not allowed to execute skill');
    }

    this.auditLog.append(createAuditEvent({
      runId,
      type: 'run.start',
      actor: agentId,
      target: skillId,
      outcome: 'ALLOW',
      metadata: { inputKeys: Object.keys(input) },
    }));

    return Object.freeze({ runId, agentId, skillId, input });
  }

  authorizeTool({ runId, agentId, skillId, capability, action, approval = null }) {
    const decision = evaluatePolicy({ agentId, skillId, capability, action, approval });
    this.auditLog.append(createAuditEvent({
      runId,
      type: 'tool.authorization',
      actor: agentId,
      target: `${capability}:${action}`,
      outcome: decision,
      metadata: { skillId, approval },
    }));
    return decision;
  }
}
