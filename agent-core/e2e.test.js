"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createToolRequest } = require("./contracts");
const { ApprovalStore } = require("./approval");
const { AuditLog } = require("./audit");
const { executeTool } = require("./tool-runtime");
const { registerAgent, registerSkill, registerTool, clearRegistriesForTests } = require("./registry");

const BASE = { runId: "run-1", agentId: "headcoder", skillId: "repository-analysis", capability: "github.read", action: "readRepo", args: { scope: "agent-core" } };

function setup() {
  clearRegistriesForTests();
  registerAgent({ id: "headcoder", active: true });
  registerSkill({ id: "repository-analysis", allowedAgents: ["headcoder"] });
}

function policyAllow() { return [{ agentId: BASE.agentId, skillId: BASE.skillId, capability: BASE.capability, action: BASE.action, decision: "allow", privileged: true }]; }
function policyApproval() { return [{ agentId: BASE.agentId, skillId: BASE.skillId, capability: BASE.capability, action: BASE.action, decision: "approval_required", privileged: true }]; }
function toolSpy() { let calls = 0; const tool = { skillId: BASE.skillId, capability: BASE.capability, action: BASE.action, execute: async () => { calls += 1; return { ok: true }; } }; return { tool, get calls() { return calls; } }; }
function freshRequest(overrides = {}) { return createToolRequest({ toolCallId: "tool-1", ...BASE, ...overrides }); }

test("authorized action completes and emits audit trail", async () => {
  setup(); const spy = toolSpy(); registerTool(spy.tool); const audit = new AuditLog();
  const result = await executeTool({ request: freshRequest(), policyRules: policyAllow(), audit });
  assert.deepEqual(result, { status: "executed", result: { ok: true } });
  assert.equal(spy.calls, 1);
  assert.equal(audit.listByRun("run-1").map((e) => e.type).join(","), "tool.executing,tool.succeeded");
});

test("forged approval field in request does not authorize privileged execution", async () => {
  setup(); const spy = toolSpy(); registerTool(spy.tool); const audit = new AuditLog();
  const request = freshRequest({ approval: "approved" });
  const result = await executeTool({ request, policyRules: policyApproval(), audit });
  assert.equal(result.status, "blocked"); assert.equal(spy.calls, 0);
});

test("unknown approval id is denied", async () => {
  setup(); const spy = toolSpy(); registerTool(spy.tool);
  const result = await executeTool({ request: freshRequest(), policyRules: policyApproval(), approvalId: "missing", approvalStore: new ApprovalStore(), audit: new AuditLog() });
  assert.equal(result.status, "blocked"); assert.equal(spy.calls, 0);
});

test("approval bound to another toolCallId is denied", async () => {
  setup(); const spy = toolSpy(); registerTool(spy.tool); const store = new ApprovalStore();
  const approval = store.create({ ...BASE, toolCallId: "other-tool", requestedBy: "headcoder", expiresAt: new Date(Date.now() + 60_000).toISOString() });
  store.approve(approval.approvalId, "human");
  const result = await executeTool({ request: freshRequest(), policyRules: policyApproval(), approvalId: approval.approvalId, approvalStore: store, audit: new AuditLog() });
  assert.equal(result.status, "blocked"); assert.equal(spy.calls, 0);
});

test("changed arguments after approval are denied", async () => {
  setup(); const spy = toolSpy(); registerTool(spy.tool); const store = new ApprovalStore();
  const approval = store.create({ ...BASE, requestedBy: "headcoder", expiresAt: new Date(Date.now() + 60_000).toISOString() });
  store.approve(approval.approvalId, "human");
  const result = await executeTool({ request: freshRequest({ args: { scope: "different" } }), policyRules: policyApproval(), approvalId: approval.approvalId, approvalStore: store, audit: new AuditLog() });
  assert.equal(result.status, "blocked"); assert.equal(spy.calls, 0);
});

test("approval is single-use", async () => {
  setup(); const spy = toolSpy(); registerTool(spy.tool); const store = new ApprovalStore();
  const approval = store.create({ ...BASE, requestedBy: "headcoder", expiresAt: new Date(Date.now() + 60_000).toISOString() });
  store.approve(approval.approvalId, "human");
  const first = await executeTool({ request: freshRequest(), policyRules: policyApproval(), approvalId: approval.approvalId, approvalStore: store, audit: new AuditLog() });
  const second = await executeTool({ request: freshRequest(), policyRules: policyApproval(), approvalId: approval.approvalId, approvalStore: store, audit: new AuditLog() });
  assert.equal(first.status, "executed"); assert.equal(second.status, "blocked"); assert.equal(spy.calls, 1);
});

test("expired approval is denied", async () => {
  setup(); const spy = toolSpy(); registerTool(spy.tool); const store = new ApprovalStore();
  const approval = store.create({ ...BASE, requestedBy: "headcoder", expiresAt: new Date(Date.now() - 1_000).toISOString() });
  store.approve(approval.approvalId, "human");
  const result = await executeTool({ request: freshRequest(), policyRules: policyApproval(), approvalId: approval.approvalId, approvalStore: store, audit: new AuditLog() });
  assert.equal(result.status, "blocked"); assert.equal(spy.calls, 0);
});

test("unregistered tool is denied", async () => {
  setup(); const audit = new AuditLog(); const result = await executeTool({ request: freshRequest(), policyRules: policyAllow(), audit });
  assert.equal(result.status, "blocked"); assert.equal(audit.listByRun("run-1").at(-1).metadata.reason, "unknown_or_unauthorized_tool");
});

test("unknown capability/action is denied even with unrelated tool", async () => {
  setup(); const spy = toolSpy(); registerTool(spy.tool);
  const result = await executeTool({ request: freshRequest({ capability: "github.admin", action: "deleteRepo" }), policyRules: policyAllow(), audit: new AuditLog() });
  assert.equal(result.status, "blocked"); assert.equal(spy.calls, 0);
});

test("no policy entry is denied", async () => {
  setup(); const spy = toolSpy(); registerTool(spy.tool);
  const result = await executeTool({ request: freshRequest(), policyRules: [], audit: new AuditLog() });
  assert.equal(result.status, "blocked"); assert.equal(spy.calls, 0);
});

test("explicit deny overrides broad allow", async () => {
  setup(); const spy = toolSpy(); registerTool(spy.tool);
  const rules = [
    { agentId: BASE.agentId, skillId: BASE.skillId, capability: BASE.capability, action: BASE.action, decision: "allow", privileged: true },
    { agentId: BASE.agentId, skillId: BASE.skillId, capability: BASE.capability, action: BASE.action, decision: "deny" },
  ];
  const result = await executeTool({ request: freshRequest(), policyRules: rules, audit: new AuditLog() });
  assert.equal(result.status, "blocked"); assert.equal(spy.calls, 0);
});

test("audit writer failure blocks privileged execution", async () => {
  setup(); const spy = toolSpy(); registerTool(spy.tool);
  const failingAudit = { append() { throw new Error("audit unavailable"); } };
  const result = await executeTool({ request: freshRequest(), policyRules: policyAllow(), audit: failingAudit });
  assert.equal(result.status, "blocked"); assert.equal(spy.calls, 0);
});
