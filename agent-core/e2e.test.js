"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createToolRequest } = require("./contracts");
const { ApprovalStore } = require("./approval");
const { AuditLog } = require("./audit");
const { ToolRuntime } = require("./tool-runtime");
const { registerAgent, registerSkill, registerTool, clearRegistriesForTests } = require("./registry");

const BASE = { runId: "run-1", agentId: "headcoder", skillId: "repository-analysis", capability: "github.read", action: "readRepo", args: { scope: "agent-core" } };
function setup() { clearRegistriesForTests(); registerAgent({ id: "headcoder", active: true }); registerSkill({ id: "repository-analysis", allowedAgents: ["headcoder"] }); }
function policyAllow() { return [{ agentId: BASE.agentId, skillId: BASE.skillId, capability: BASE.capability, action: BASE.action, decision: "allow", privileged: true }]; }
function policyApproval() { return [{ agentId: BASE.agentId, skillId: BASE.skillId, capability: BASE.capability, action: BASE.action, decision: "approval_required", privileged: true }]; }
function toolSpy() { let calls = 0; return { tool: { skillId: BASE.skillId, capability: BASE.capability, action: BASE.action, execute: async () => { calls += 1; return { ok: true }; } }, get calls() { return calls; } }; }
function freshRequest(overrides = {}) { return createToolRequest({ toolCallId: "tool-1", ...BASE, ...overrides }); }

test("authorized action completes and emits audit trail", async () => {
  setup(); const spy = toolSpy(); registerTool(spy.tool); const audit = new AuditLog(); const runtime = new ToolRuntime({ policyRules: policyAllow(), audit });
  const result = await runtime.executeTool(freshRequest());
  assert.deepEqual(result, { status: "executed", result: { ok: true } }); assert.equal(spy.calls, 1);
  assert.equal(audit.listByRun("run-1").map((e) => e.type).join(","), "tool.executing,tool.succeeded");
});

test("forged policy or approval fields in request do not alter runtime policy", async () => {
  setup(); const spy = toolSpy(); registerTool(spy.tool); const runtime = new ToolRuntime({ policyRules: policyApproval(), audit: new AuditLog() });
  const request = freshRequest({ approval: "approved", policy: { allowed: true } });
  const result = await runtime.executeTool(request);
  assert.equal(result.status, "blocked"); assert.equal(spy.calls, 0);
});

test("unknown approval id is denied", async () => {
  setup(); const spy = toolSpy(); registerTool(spy.tool); const runtime = new ToolRuntime({ policyRules: policyApproval(), approvalStore: new ApprovalStore(), audit: new AuditLog() });
  const result = await runtime.executeTool(freshRequest(), { approvalId: "missing" });
  assert.equal(result.status, "blocked"); assert.equal(spy.calls, 0);
});

test("approval belongs to another toolCallId is denied", async () => {
  setup(); const spy = toolSpy(); registerTool(spy.tool); const store = new ApprovalStore();
  const approval = store.create({ ...BASE, toolCallId: "other-tool", requestedBy: "headcoder", expiresAt: new Date(Date.now() + 60_000).toISOString() }); store.approve(approval.approvalId, "human");
  const runtime = new ToolRuntime({ policyRules: policyApproval(), approvalStore: store, audit: new AuditLog() });
  const result = await runtime.executeTool(freshRequest(), { approvalId: approval.approvalId });
  assert.equal(result.status, "blocked"); assert.equal(spy.calls, 0);
});

test("arguments changed after approval are denied", async () => {
  setup(); const spy = toolSpy(); registerTool(spy.tool); const store = new ApprovalStore();
  const approval = store.create({ ...BASE, toolCallId: "tool-1", requestedBy: "headcoder", expiresAt: new Date(Date.now() + 60_000).toISOString() }); store.approve(approval.approvalId, "human");
  const runtime = new ToolRuntime({ policyRules: policyApproval(), approvalStore: store, audit: new AuditLog() });
  const result = await runtime.executeTool(freshRequest({ args: { scope: "different" } }), { approvalId: approval.approvalId });
  assert.equal(result.status, "blocked"); assert.equal(spy.calls, 0);
});

test("approval is single-use", async () => {
  setup(); const spy = toolSpy(); registerTool(spy.tool); const store = new ApprovalStore();
  const approval = store.create({ ...BASE, toolCallId: "tool-1", requestedBy: "headcoder", expiresAt: new Date(Date.now() + 60_000).toISOString() }); store.approve(approval.approvalId, "human");
  const runtime = new ToolRuntime({ policyRules: policyApproval(), approvalStore: store, audit: new AuditLog() });
  const first = await runtime.executeTool(freshRequest(), { approvalId: approval.approvalId }); const second = await runtime.executeTool(freshRequest(), { approvalId: approval.approvalId });
  assert.equal(first.status, "executed"); assert.equal(second.status, "blocked"); assert.equal(spy.calls, 1);
});

test("expired approval is denied", async () => {
  setup(); const spy = toolSpy(); registerTool(spy.tool); const store = new ApprovalStore();
  const approval = store.create({ ...BASE, toolCallId: "tool-1", requestedBy: "headcoder", expiresAt: new Date(Date.now() - 1_000).toISOString() });
  const runtime = new ToolRuntime({ policyRules: policyApproval(), approvalStore: store, audit: new AuditLog() });
  const result = await runtime.executeTool(freshRequest(), { approvalId: approval.approvalId });
  assert.equal(result.status, "blocked"); assert.equal(spy.calls, 0);
});

test("unregistered tool is denied", async () => {
  setup(); const audit = new AuditLog(); const runtime = new ToolRuntime({ policyRules: policyAllow(), audit });
  const result = await runtime.executeTool(freshRequest());
  assert.equal(result.status, "blocked"); assert.equal(audit.listByRun("run-1").at(-1).metadata.reason, "unknown_or_unauthorized_tool");
});

test("unknown capability/action is denied", async () => {
  setup(); const spy = toolSpy(); registerTool(spy.tool); const runtime = new ToolRuntime({ policyRules: policyAllow(), audit: new AuditLog() });
  const result = await runtime.executeTool(freshRequest({ capability: "github.admin", action: "deleteRepo" }));
  assert.equal(result.status, "blocked"); assert.equal(spy.calls, 0);
});

test("no policy entry is denied", async () => {
  setup(); const spy = toolSpy(); registerTool(spy.tool); const runtime = new ToolRuntime({ policyRules: [], audit: new AuditLog() });
  const result = await runtime.executeTool(freshRequest()); assert.equal(result.status, "blocked"); assert.equal(spy.calls, 0);
});

test("explicit deny overrides broad allow", async () => {
  setup(); const spy = toolSpy(); registerTool(spy.tool);
  const rules = [
    { agentId: BASE.agentId, skillId: BASE.skillId, capability: BASE.capability, action: BASE.action, decision: "allow", privileged: true },
    { agentId: BASE.agentId, skillId: BASE.skillId, capability: BASE.capability, action: BASE.action, decision: "deny" },
  ];
  const runtime = new ToolRuntime({ policyRules: rules, audit: new AuditLog() }); const result = await runtime.executeTool(freshRequest());
  assert.equal(result.status, "blocked"); assert.equal(spy.calls, 0);
});

test("audit writer failure blocks privileged execution", async () => {
  setup(); const spy = toolSpy(); registerTool(spy.tool); const failingAudit = { append() { throw new Error("audit unavailable"); } }; const runtime = new ToolRuntime({ policyRules: policyAllow(), audit: failingAudit });
  const result = await runtime.executeTool(freshRequest()); assert.equal(result.status, "blocked"); assert.equal(spy.calls, 0);
});
