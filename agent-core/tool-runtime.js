"use strict";
const { evaluateToolAccess, DECISIONS } = require("./policy");
const { getAgent, getSkill, resolveTool } = require("./registry");
const { ApprovalStore } = require("./approval");
const { AuditLog, createAuditEvent } = require("./audit");
const { createContextManifest } = require("./context");
const { evaluateGovernance } = require("./governance");
const { consume } = require("./budget");
const { createTraceEvent } = require("./tracing");
const { classifyError } = require("./failure-recovery");

function requireRuntimeContext(runtimeContext) {
  if (!runtimeContext || typeof runtimeContext !== "object") throw new TypeError("runtimeContext is required");
  const contextManifest = createContextManifest(runtimeContext.contextManifest);
  if (contextManifest.runId !== runtimeContext.runId || contextManifest.agentId !== runtimeContext.agentId) {
    throw new Error("runtime_context_identity_mismatch");
  }
  if (!runtimeContext.governanceContext || !runtimeContext.budget || !runtimeContext.traceContext) {
    throw new Error("runtime_context_incomplete");
  }
  return Object.freeze({ ...runtimeContext, contextManifest });
}

class ToolRuntime {
  constructor({ policyRules = [], approvalStore = new ApprovalStore(), audit = new AuditLog(), runtimeContext } = {}) {
    this.policyRules = Object.freeze([...policyRules]);
    this.approvalStore = approvalStore;
    this.audit = audit;
    this.runtimeContext = requireRuntimeContext(runtimeContext);
    this.budget = this.runtimeContext.budget;
  }

  async record(event) {
    if (typeof this.audit === "function") return this.audit(event);
    return this.audit.append(event);
  }

  async trace(type, fields = {}) {
    return this.record(createTraceEvent(this.runtimeContext.traceContext, type, fields));
  }

  async deny(request, reason) {
    try {
      await this.record(createAuditEvent({ runId: request?.runId || "unknown", type: "tool.denied", actor: this.runtimeContext.agentId, target: request?.action || null, outcome: "deny", metadata: { reason } }));
      await this.trace("tool.denied", { reason });
    } catch (_) {}
    return Object.freeze({ status: "blocked", decision: { decision: DECISIONS.DENY, allowed: false, reason } });
  }

  async executeTool(request, { approvalId = null } = {}) {
    if (!request || typeof request !== "object") throw new TypeError("request is required");
    const ctx = this.runtimeContext;
    if (request.runId !== ctx.runId || request.agentId !== ctx.agentId) return this.deny(request, "runtime_context_identity_mismatch");

    const agent = getAgent(request.agentId);
    if (!agent || agent.active === false) return this.deny(request, "agent_not_registered_or_inactive");

    const skill = getSkill(request.skillId);
    if (!skill || !skill.allowedAgents?.includes(request.agentId)) return this.deny(request, "skill_not_registered_for_agent");

    let policyDecision;
    try {
      policyDecision = evaluateToolAccess(request, this.policyRules);
      await this.trace("governance.decided", { decision: policyDecision.decision, allowed: policyDecision.allowed, reason: policyDecision.reason });
    } catch (error) {
      return this.deny(request, `policy_evaluation_failed:${error.message}`);
    }
    if (policyDecision.decision === DECISIONS.DENY || !policyDecision.allowed) return this.deny(request, policyDecision.reason);

    const governanceDecision = evaluateGovernance(ctx.governanceContext, {
      scope: request.capability,
      risk: policyDecision.privileged ? "privileged" : "read",
    });
    if (!governanceDecision.allowed) return this.deny(request, governanceDecision.reason);

    try {
      this.budget = consume(this.budget, { toolCalls: 1 });
      await this.trace("budget.updated", { usage: this.budget.usage });
    } catch (error) {
      return this.deny(request, classifyError(error) === "execution_failed" ? "budget_exceeded" : error.message);
    }

    let approval = null;
    if (policyDecision.requiresApproval) {
      try {
        approval = this.approvalStore.assertUsable({ approvalId, request });
        await this.trace("approval.validated", { approvalId });
      } catch (error) {
        return this.deny(request, `approval_denied:${error.message}`);
      }
    }

    const tool = resolveTool(request.skillId, request.capability, request.action);
    if (!tool) return this.deny(request, "unknown_or_unauthorized_tool");

    try {
      await this.trace("tool.requested", { skillId: request.skillId, capability: request.capability, action: request.action });
      await this.record(createAuditEvent({ runId: request.runId, type: "tool.executing", actor: ctx.agentId, target: `${request.skillId}:${request.capability}:${request.action}`, outcome: "allow" }));
    } catch (error) {
      if (policyDecision.privileged || policyDecision.requiresApproval) return this.deny(request, "audit_failed_before_execution");
      throw error;
    }

    if (approval) this.approvalStore.consume(approval.approvalId);

    let result;
    try {
      result = await tool.execute(request.args || {});
    } catch (error) {
      try {
        await this.record(createAuditEvent({ runId: request.runId, type: "tool.failed", actor: ctx.agentId, target: request.action, outcome: "error", metadata: { category: classifyError(error), message: error.message } }));
        await this.trace("tool.failed", { category: classifyError(error) });
      } catch (_) {}
      throw error;
    }

    try {
      await this.record(createAuditEvent({ runId: request.runId, type: "tool.succeeded", actor: ctx.agentId, target: request.action, outcome: "allow" }));
      await this.trace("tool.succeeded");
    } catch (error) {
      if (policyDecision.privileged || policyDecision.requiresApproval) throw new Error(`audit failed after privileged execution: ${error.message}`);
      throw error;
    }

    return Object.freeze({ status: "executed", result });
  }
}

module.exports = { ToolRuntime, requireRuntimeContext };
