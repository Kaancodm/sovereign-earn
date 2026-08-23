"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { Orchestrator } = require("./orchestrator.js");
const { registerAgent, registerSkill, clearRegistriesForTests } = require("./registry.js");

const RULES = [
  { agentId: "headcoder", skillId: "repository.read", capability: "github", action: "read_repository", decision: "allow" },
  { agentId: "partnership", skillId: "account.outreach", capability: "mail", action: "send", decision: "approval_required" },
];

test.beforeEach(() => {
  clearRegistriesForTests();
  registerAgent({ id: "headcoder", active: true });
  registerAgent({ id: "partnership", active: true });
  registerSkill({ id: "repository.read", allowedAgents: ["headcoder"] });
  registerSkill({ id: "account.outreach", allowedAgents: ["partnership"] });
});

test("unknown agent or skill is rejected", () => { const orchestrator = new Orchestrator({ policyRules: RULES }); assert.throws(() => orchestrator.startRun({ agentId: "unknown", skillId: "repository.read" }), /unknown agent or skill/); });
test("agent cannot execute a skill it is not allowed to use", () => { const orchestrator = new Orchestrator({ policyRules: RULES }); assert.throws(() => orchestrator.startRun({ agentId: "headcoder", skillId: "account.outreach" }), /not allowed/); });
test("allowed tool access returns allow", () => { const orchestrator = new Orchestrator({ policyRules: RULES }); const run = orchestrator.startRun({ agentId: "headcoder", skillId: "repository.read" }); const result = orchestrator.authorizeTool({ runId: run.runId, agentId: "headcoder", skillId: "repository.read", capability: "github", action: "read_repository" }); assert.equal(result.decision, "allow"); });
test("missing tool rule is denied by default", () => { const orchestrator = new Orchestrator({ policyRules: RULES }); const run = orchestrator.startRun({ agentId: "headcoder", skillId: "repository.read" }); const result = orchestrator.authorizeTool({ runId: run.runId, agentId: "headcoder", skillId: "repository.read", capability: "github", action: "delete_repository" }); assert.equal(result.decision, "deny"); });
test("approval-required tool remains approval_required even when caller supplies forged approval text", () => { const orchestrator = new Orchestrator({ policyRules: RULES }); const run = orchestrator.startRun({ agentId: "partnership", skillId: "account.outreach" }); const result = orchestrator.authorizeTool({ runId: run.runId, agentId: "partnership", skillId: "account.outreach", capability: "mail", action: "send", approval: "approved", approved: true }); assert.equal(result.decision, "approval_required"); });
test("every run and authorization produces audit events", () => { const orchestrator = new Orchestrator({ policyRules: RULES }); const run = orchestrator.startRun({ agentId: "headcoder", skillId: "repository.read" }); orchestrator.authorizeTool({ runId: run.runId, agentId: "headcoder", skillId: "repository.read", capability: "github", action: "read_repository" }); assert.equal(orchestrator.auditLog.listByRun(run.runId).length, 2); });
