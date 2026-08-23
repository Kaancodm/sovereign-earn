"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { registerAgent, registerSkill, registerTool, clearRegistriesForTests } = require("./registry");
const { ToolRuntime } = require("./tool-runtime");
const { createToolRequest } = require("./contracts");
const review = require("./earn-review");
const payout = require("./earn-payout");

function snapshot() { return { earningsSnapshotId: "staging-snap-1", earningsSnapshotVersion: "2026-08-23T01", userId: "staging-user", period: "2026-08", calculationVersion: "1.0.0", records: [{ id: "e1", amount: 100 }, { id: "e2", amount: 25 }] }; }

test("canonical staging run completes review and payout preparation without payment execution", async () => {
  clearRegistriesForTests();
  const agentId = "sovereign-earn-orchestrator";
  registerAgent({ id: agentId });
  registerSkill({ id: review.SKILL_ID, allowedAgents: [agentId] });
  registerSkill({ id: payout.SKILL_ID, allowedAgents: [agentId] });
  let paymentCalls = 0;
  registerTool({ skillId: review.SKILL_ID, capability: review.CAPABILITY, action: review.ACTION, execute: async ({ snapshot }) => review.calculateEarnings(snapshot) });
  registerTool({ skillId: payout.SKILL_ID, capability: payout.CAPABILITY, action: payout.ACTION, execute: async ({ calculation, beneficiaryId, currency }) => payout.preparePayout(calculation, { beneficiaryId, currency }) });

  const runId = "earn.review_and_prepare_payout_demo";
  const contextManifest = { contextVersion: "1.0.0", architectureVersion: "1.0.0", policyVersion: "1.0.0", flowVersion: "1.0.0", workspaceMapVersion: "1.0.0", runId, agentId, sessionId: "staging-session-1", dataClassification: "internal" };
  const governanceContext = { identity: { userId: "staging-user", role: "user" }, sessionMode: "prepare_payout", scopes: [review.CAPABILITY, payout.CAPABILITY], budget: { limits: { toolCalls: 2 }, usage: { toolCalls: 0 } }, modeRules: { allowedRisks: ["read", "compute", "write"], allowExecution: false } };
  const audit = [];
  const trace = [];
  const runtime = new ToolRuntime({ runtimeContext: { runId, agentId, contextManifest, governanceContext, budget: { limits: { toolCalls: 2 }, usage: { toolCalls: 0 } }, traceContext: { traceId: "staging-trace-1" } }, policyRules: [
    { agentId, skillId: review.SKILL_ID, capability: review.CAPABILITY, action: review.ACTION, decision: "allow", privileged: false, requiresApproval: false },
    { agentId, skillId: payout.SKILL_ID, capability: payout.CAPABILITY, action: payout.ACTION, decision: "allow", privileged: false, requiresApproval: false },
  ], audit: { append: async event => audit.push(event) }, traceLog: { append: async event => trace.push(event) } });

  const reviewRequest = createToolRequest({ toolCallId: "staging-review-1", runId, agentId, skillId: review.SKILL_ID, capability: review.CAPABILITY, action: review.ACTION, args: { snapshot: snapshot() } });
  const reviewResult = await runtime.executeTool(reviewRequest);
  assert.equal(reviewResult.status, "executed");
  assert.equal(reviewResult.result.amount, 125);
  assert.equal(reviewResult.result.isVerified, false);
  assert.equal(reviewResult.result.authorizationState, "none");

  const verifiedCalculation = Object.freeze({ ...reviewResult.result, isVerified: true });
  const payoutRequest = createToolRequest({ toolCallId: "staging-payout-1", runId, agentId, skillId: payout.SKILL_ID, capability: payout.CAPABILITY, action: payout.ACTION, args: { calculation: verifiedCalculation, beneficiaryId: "beneficiary-staging-1", currency: "CHF" } });
  const payoutResult = await runtime.executeTool(payoutRequest);
  assert.equal(payoutResult.status, "executed");
  assert.equal(payoutResult.result.amount, 125);
  assert.equal(payoutResult.result.currency, "CHF");
  assert.equal(payoutResult.result.beneficiaryId, "beneficiary-staging-1");
  assert.equal(payoutResult.result.approvalState, "none");
  assert.equal(payoutResult.result.authorizationState, "none");
  assert.equal(paymentCalls, 0);
  assert.equal(audit.filter(e => e.type === "tool.succeeded").length, 2);
  assert.ok(trace.some(e => e.type === "tool.succeeded"));
});
