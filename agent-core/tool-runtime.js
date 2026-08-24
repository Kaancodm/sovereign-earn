"use strict";
const { evaluateToolAccess, DECISIONS } = require("./policy");
const { getAgent, getSkill, resolveTool } = require("./registry");
const { ApprovalStore, APPROVAL_SOURCES } = require("./approval");
const { AuditLog, createAuditEvent } = require("./audit");

class ToolRuntime {
  constructor({ policyRules = [], approvalStore = new ApprovalStore(), audit = new AuditLog() } = {}) {
    this.policyRules = Object.freeze([...policyRules]);
    this.approvalStore = approvalStore;
    this.audit = audit;
  }

  async record(event) {
    if (typeof this.audit === "function") return this.audit(event);
    return this.audit.append(event);
  }

  async deny(request, reason) {
    try {
      await this.record(createAuditEvent({ runId: request?.runId || "unknown", type: "tool.denied", actor: request?.agentId || "unknown", target: request?.action || null, outcome: "deny", metadata: { reason } }));
    } catch (_) {}
    return Object.freeze({ status: "blocked", decision: { decision: DECISIONS.DENY, allowed: false, reason } });
  }

  async executeTool(request, { approvalId = null, actorId = request?.agentId } = {}) {
    if (!request || typeof request !== "object") throw new TypeError("request is required");

    const agent = getAgent(request.agentId);
    if (!agent || agent.active === false) return this.deny(request, "agent_not_registered_or_inactive");

    const skill = getSkill(request.skillId);
    if (!skill || !skill.allowedAgents?.includes(request.agentId)) return this.deny(request, "skill_not_registered_for_agent");

    let authoritativeApproval = null;
    if (approvalId) {
      const candidate = this.approvalStore.get(approvalId);
      if (candidate?.source === APPROVAL_SOURCES.CO_PILOT_OVERRIDE) {
        try {
          authoritativeApproval = this.approvalStore.assertUsable({ approvalId, request });
        } catch (error) {
          return this.deny(request, `approval_denied:${error.message}`);
        }
      }
    }

    const evaluatedPolicy = evaluateToolAccess(request, this.policyRules);
    const policyDecision = authoritativeApproval
      ? Object.freeze({ decision: DECISIONS.ALLOW, allowed: true, requiresApproval: false, privileged: true, reason: `co_pilot_override:${authoritativeApproval.reason || "authorized"}`, overriddenDecision: evaluatedPolicy.decision })
      : evaluatedPolicy;

    if (policyDecision.decision === DECISIONS.DENY || !policyDecision.allowed) return this.deny(request, policyDecision.reason);

    let approval = authoritativeApproval;
    if (policyDecision.requiresApproval) {
      try { approval = this.approvalStore.assertUsable({ approvalId, request }); }
      catch (error) { return this.deny(request, `approval_denied:${error.message}`); }
    }

    const tool = resolveTool(request.skillId, request.capability, request.action);
    if (!tool) return this.deny(request, "unknown_or_unauthorized_tool");

    try {
      await this.record(createAuditEvent({
        runId: request.runId,
        type: "tool.executing",
        actor: actorId,
        target: `${request.skillId}:${request.capability}:${request.action}`,
        outcome: "allow",
        metadata: authoritativeApproval ? { approvalId: authoritativeApproval.approvalId, approvalSource: authoritativeApproval.source, overriddenDecision: evaluatedPolicy.decision } : {},
      }));
    } catch (error) {
      if (policyDecision.privileged || policyDecision.requiresApproval) return this.deny(request, "audit_failed_before_execution");
      throw error;
    }

    // Consume before dispatch. This makes privileged approval one-shot even across crashes/retries.
    if (approval) this.approvalStore.consume(approval.approvalId);

    let result;
    try {
      result = await tool.execute(request.args || {});
    } catch (error) {
      try { await this.record(createAuditEvent({ runId: request.runId, type: "tool.failed", actor: actorId, target: request.action, outcome: "error", metadata: { message: error.message } })); } catch (_) {}
      throw error;
    }

    try {
      await this.record(createAuditEvent({ runId: request.runId, type: "tool.succeeded", actor: actorId, target: request.action, outcome: "allow", metadata: authoritativeApproval ? { approvalId: authoritativeApproval.approvalId, approvalSource: authoritativeApproval.source } : {} }));
    } catch (error) {
      if (policyDecision.privileged || policyDecision.requiresApproval) throw new Error(`audit failed after privileged execution: ${error.message}`);
      throw error;
    }

    return Object.freeze({ status: "executed", result });
  }
}

module.exports = { ToolRuntime };
