"use strict";

const { randomUUID } = require("node:crypto");
const { getAgent, getSkill, resolveTool } = require("./registry.js");
const { createAuditEvent, AuditLog } = require("./audit.js");
const { evaluateToolAccess } = require("./policy.js");
const { ApprovalStore } = require("./approval.js");

class Orchestrator {
  constructor({ auditLog = new AuditLog(), policyRules = [], approvalStore = new ApprovalStore(), coPilotAgentId = "co-pilot" } = {}) {
    this.auditLog = auditLog;
    this.policyRules = [...policyRules];
    this.approvalStore = approvalStore;
    this.coPilotAgentId = coPilotAgentId;
  }

  startRun({ agentId, skillId, taskId = randomUUID(), input = {} }) {
    const runId = randomUUID();
    const agent = getAgent(agentId);
    const skill = getSkill(skillId);

    if (!agent || agent.active === false || !skill) {
      this.auditLog.append(createAuditEvent({ runId, type: "run.start", actor: agentId ?? "unknown", outcome: "deny", metadata: { reason: "unknown_agent_or_skill", agentId, skillId } }));
      throw new Error("unknown agent or skill");
    }
    if (!skill.allowedAgents?.includes(agentId)) {
      this.auditLog.append(createAuditEvent({ runId, type: "run.start", actor: agentId, target: skillId, outcome: "deny", metadata: { reason: "agent_not_allowed_for_skill" } }));
      throw new Error("agent is not allowed to execute skill");
    }
    this.auditLog.append(createAuditEvent({ runId, type: "run.start", actor: agentId, target: skillId, outcome: "allow", metadata: { taskId, inputKeys: Object.keys(input) } }));
    return Object.freeze({ runId, taskId, agentId, skillId, input });
  }

  authorizeTool({ runId, agentId, skillId, capability, action }) {
    const result = evaluateToolAccess({ agentId, skillId, capability, action }, this.policyRules);
    this.auditLog.append(createAuditEvent({ runId, type: "tool.authorization", actor: agentId, target: `${capability}:${action}`, outcome: result.decision, metadata: { skillId, reason: result.reason } }));
    return Object.freeze({ decision: result.decision, reason: result.reason });
  }

  coPilotOverride({ actorId, toolRequest, reason, expiresInMs = 5 * 60 * 1000 }) {
    if (actorId !== this.coPilotAgentId) throw new Error("co-pilot authorization required");
    if (!reason || typeof reason !== "string" || reason.trim() === "") throw new Error("override reason is required");
    const request = toolRequest;
    if (!request || typeof request !== "object") throw new TypeError("toolRequest is required");
    const agent = getAgent(request.agentId);
    const skill = getSkill(request.skillId);
    const tool = resolveTool(request.skillId, request.capability, request.action);
    if (!agent || agent.active === false) throw new Error("unknown agent or inactive agent");
    if (!skill || !skill.allowedAgents?.includes(request.agentId)) throw new Error("agent is not allowed for skill");
    if (!tool) throw new Error("unknown or unauthorized tool");
    if (!request.runId || !request.toolCallId) throw new Error("runId and toolCallId are required");
    if (!Number.isFinite(expiresInMs) || expiresInMs <= 0) throw new Error("expiresInMs must be positive");

    const approval = this.approvalStore.createCoPilotOverride({
      runId: request.runId,
      agentId: request.agentId,
      toolCallId: request.toolCallId,
      skillId: request.skillId,
      capability: request.capability,
      action: request.action,
      args: request.args,
      expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
      reason: reason.trim(),
    }, this.coPilotAgentId);

    this.auditLog.append(createAuditEvent({
      runId: request.runId,
      type: "co_pilot.override",
      actor: this.coPilotAgentId,
      target: `${request.skillId}:${request.capability}:${request.action}`,
      outcome: "allow",
      metadata: { approvalId: approval.approvalId, toolCallId: request.toolCallId, argsHash: approval.argsHash, reason: approval.reason },
    }));

    return Object.freeze({ approvalId: approval.approvalId, approval });
  }
}

module.exports = { Orchestrator };
