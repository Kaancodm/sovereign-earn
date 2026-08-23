"use strict";

const { randomUUID } = require("node:crypto");
const { getAgent, getSkill } = require("./registry.js");
const { createAuditEvent, AuditLog } = require("./audit.js");
const { evaluateToolAccess } = require("./policy.js");

class Orchestrator {
  constructor({ auditLog = new AuditLog(), policyRules = [] } = {}) {
    this.auditLog = auditLog;
    this.policyRules = [...policyRules];
  }

  startRun({ agentId, skillId, taskId = randomUUID(), input = {} }) {
    const runId = randomUUID();
    const agent = getAgent(agentId);
    const skill = getSkill(skillId);

    if (!agent || !skill) {
      this.auditLog.append(createAuditEvent({
        runId,
        type: "run.start",
        actor: agentId ?? "unknown",
        outcome: "deny",
        metadata: { reason: "unknown_agent_or_skill", agentId, skillId },
      }));
      throw new Error("unknown agent or skill");
    }

    if (!skill.allowedAgents?.includes(agentId)) {
      this.auditLog.append(createAuditEvent({
        runId,
        type: "run.start",
        actor: agentId,
        target: skillId,
        outcome: "deny",
        metadata: { reason: "agent_not_allowed_for_skill" },
      }));
      throw new Error("agent is not allowed to execute skill");
    }

    this.auditLog.append(createAuditEvent({
      runId,
      type: "run.start",
      actor: agentId,
      target: skillId,
      outcome: "allow",
      metadata: { taskId, inputKeys: Object.keys(input) },
    }));

    return Object.freeze({ runId, taskId, agentId, skillId, input });
  }

  authorizeTool({ runId, agentId, skillId, capability, action, approval = "not_required" }) {
    const result = evaluateToolAccess(
      { agentId, skillId, capability, action },
      this.policyRules
    );

    const decision = result.decision;
    const finalDecision = decision === "approval_required" && approval === "approved"
      ? "allow"
      : decision;

    this.auditLog.append(createAuditEvent({
      runId,
      type: "tool.authorization",
      actor: agentId,
      target: `${capability}:${action}`,
      outcome: finalDecision,
      metadata: { skillId, approval, reason: result.reason },
    }));

    return Object.freeze({ decision: finalDecision, reason: result.reason });
  }
}

module.exports = { Orchestrator };
