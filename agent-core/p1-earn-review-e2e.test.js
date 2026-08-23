"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { registerAgent, registerSkill, registerTool, clearRegistriesForTests } = require("./registry");
const { ToolRuntime } = require("./tool-runtime");
const { calculateEarnings, SKILL_ID, CAPABILITY, ACTION } = require("./earn-review");
const { createToolRequest } = require("./contracts");

function runtime() {
  clearRegistriesForTests();
  registerAgent({ id: "sovereign-earn-orchestrator" });
  registerSkill({ id: SKILL_ID, allowedAgents: ["sovereign-earn-orchestrator"] });
  let calls = 0;
  registerTool({ skillId: SKILL_ID, capability: CAPABILITY, action: ACTION, execute: async (args) => { calls += 1; return calculateEarnings(args.snapshot, args.options); } });
  const runId = "p1-earn-review-run";
  const agentId = "sovereign-earn-orchestrator";
  const contextManifest = { contextVersion: "1.0.0", architectureVersion: "1.0.0", policyVersion: "1.0.0", flowVersion: "1.0.0", workspaceMapVersion: "1.0.0", runId, agentId, sessionId: "session-1", sessionMode: "review_only", dataClassification: { snapshot: "model_restricted" } };
  const runtimeContext = { runId, agentId, contextManifest, governanceContext: { identity: { userId: "user-1", role: "user" }, sessionMode: "review_only", scopes: [CAPABILITY], budget: { limits: { toolCalls: 1 }, usage: { toolCalls: 0 } }, modeRules: { allowedRisks: ["read", "compute"], allowExecution: false } }, budget: { limits: { toolCalls: 1 }, usage: { toolCalls: 0 } }, traceContext: { traceId: "trace-p1" } };
  const audit = [];
  const trace = [];
  const rt = new ToolRuntime({ runtimeContext, policyRules: [{ agentId, skillId: SKILL_ID, capability: CAPABILITY, action: ACTION, decision: "allow", privileged: false, requiresApproval: false }], audit: { append: async e => audit.push(e) }, traceLog: { append: async e => trace.push(e) } });
  return { rt, runId, agentId, audit, trace, get calls() { return calls; } };
}

function snapshot() { return { earningsSnapshotId: "snap-p1", earningsSnapshotVersion: "2026-08-23T01", userId: "user-1", period: "2026-08", calculationVersion: "1.0.0", records: [{ id: "e1", amount: 100 }, { id: "e2", amount: 25 }] }; }

test("P1 earn.review canonical flow executes once and remains unauthorized", async () => {
  const h = runtime();
  const request = createToolRequest({ toolCallId: "tc-p1", runId: h.runId, agentId: h.agentId, skillId: SKILL_ID, capability: CAPABILITY, action: ACTION, args: { snapshot: snapshot() } });
  const result = await h.rt.executeTool(request);
  assert.equal(result.status, "executed");
  assert.equal(result.result.amount, 125);
  assert.equal(result.result.isVerified, false);
  assert.equal(result.result.authorizationState, "none");
  assert.equal(h.calls, 1);
  assert.ok(h.audit.some(e => e.type === "tool.executing"));
  assert.ok(h.audit.some(e => e.type === "tool.succeeded"));
  assert.ok(h.trace.some(e => e.type === "tool.succeeded"));
});
