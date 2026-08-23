"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createToolRequest } = require("./contracts");
const { registerSkill, resolveCapability, clearSkillsForTests } = require("./skill-registry");

test.beforeEach(() => { clearSkillsForTests(); registerSkill({ skillId: "earn.review", version: "1.0.0", purpose: "Review earnings", allowedAgents: ["earn-agent"], capabilities: [{ capability: "earnings.read", action: "calculate", risk: "compute" }], policyProfile: "earn.review.v1", approvalProfile: "none", budgetProfile: "bounded", handoffPolicy: { allow: false }, guardrails: ["read_only"], auditProfile: ["skill.started", "skill.completed"] }); });

test("agent cannot promote its request into approval", () => {
  const request = createToolRequest({ toolCallId: "tc-1", runId: "run-1", agentId: "earn-agent", skillId: "earn.review", capability: "earnings.read", action: "calculate", args: {}, approval: "approved", approved: true });
  assert.equal("approval" in request, false);
  assert.equal("approved" in request, false);
});

test("agent cannot resolve payout capability through earn.review", () => assert.equal(resolveCapability("earn.review", "payout.execute", "execute"), null));

test("agent cannot downgrade compute risk through request fields", () => {
  const capability = resolveCapability("earn.review", "earnings.read", "calculate");
  assert.equal(capability.risk, "compute");
  const request = createToolRequest({ toolCallId: "tc-2", runId: "run-2", agentId: "earn-agent", skillId: "earn.review", capability: "earnings.read", action: "calculate", args: { risk: "read" } });
  assert.equal(request.args.risk, "read");
  assert.equal(capability.risk, "compute");
});

test("no arbitrary executable function can become a skill capability", () => {
  assert.equal(resolveCapability("earn.review", "execute", "function"), null);
});
