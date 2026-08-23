"use strict";
const { evaluateToolAccess, DECISIONS } = require("./policy");
const { getAgent, getSkill, resolveTool } = require("./registry");
const { ApprovalStore } = require("./approval");
const { AuditLog, createAuditEvent } = require("./audit");

async function recordAudit(audit, event) {
  if (typeof audit === "function") return audit(event);
  return audit.append(event);
}

async function deny(audit, request, reason) {
  try {
    await recordAudit(audit, createAuditEvent({ runId: request?.runId || "unknown", type: "tool.denied", actor: request?.agentId || "unknown", target: request?.action || null, outcome: "deny", metadata: { reason } }));
  } catch (_) {}
  return Object.freeze({ status: "blocked", decision: { decision: DECISIONS.DENY, allowed: false, reason } });
}

async function executeTool({ request, policyRules = [], approvalStore = new ApprovalStore(), approvalId = null, actorId = request?.agentId, audit = new AuditLog() }) {
  if (!request || typeof request !== "object") throw new TypeError("request is required");

  const agent = getAgent(request.agentId);
  if (!agent || agent.active === false) return deny(audit, request, "agent_not_registered_or_inactive");

  const skill = getSkill(request.skillId);
  if (!skill || !skill.allowedAgents?.includes(request.agentId)) return deny(audit, request, "skill_not_registered_for_agent");

  const policyDecision = evaluateToolAccess(request, policyRules);
  if (policyDecision.decision === DECISIONS.DENY || !policyDecision.allowed) return deny(audit, request, policyDecision.reason);

  let approval = null;
  if (policyDecision.requiresApproval) {
    try { approval = approvalStore.assertUsable({ approvalId, request }); }
    catch (error) { return deny(audit, request, `approval_denied:${error.message}`); }
  }

  const tool = resolveTool(request.skillId, request.capability, request.action);
  if (!tool) return deny(audit, request, "unknown_or_unauthorized_tool");

  try {
    await recordAudit(audit, createAuditEvent({ runId: request.runId, type: "tool.executing", actor: actorId, target: `${request.skillId}:${request.capability}:${request.action}`, outcome: "allow" }));
  } catch (error) {
    if (policyDecision.privileged || policyDecision.requiresApproval) return deny(audit, request, "audit_failed_before_execution");
    throw error;
  }

  let result;
  try {
    result = await tool.execute(request.args || {});
  } catch (error) {
    try { await recordAudit(audit, createAuditEvent({ runId: request.runId, type: "tool.failed", actor: actorId, target: request.action, outcome: "error", metadata: { message: error.message } })); } catch (_) {}
    throw error;
  }

  try {
    await recordAudit(audit, createAuditEvent({ runId: request.runId, type: "tool.succeeded", actor: actorId, target: request.action, outcome: "allow" }));
  } catch (error) {
    if (policyDecision.privileged || policyDecision.requiresApproval) throw new Error(`audit failed after privileged execution: ${error.message}`);
    throw error;
  }

  if (approval) approvalStore.consume(approval.approvalId);
  return Object.freeze({ status: "executed", result });
}

module.exports = { executeTool };
