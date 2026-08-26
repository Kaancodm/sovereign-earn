"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { Orchestrator } = require("./orchestrator.js");
const { registerAgent, registerSkill, registerTool, clearRegistriesForTests } = require("./registry.js");

const RULES = [
  { agentId: "headcoder", skillId: "repository.read", capability: "github", action: "read_repository", decision: "allow" },
  { agentId: "partnership", skillId: "account.outreach", capability: "mail", action: "send", decision: "approval_required" },
];

test.beforeEach(() => {
  clearRegistriesForTests();
  registerAgent({ id: "headcoder" });
  registerAgent({ id: "partnership" });
  registerSkill({ id: "repository.read", allowedAgents: ["headcoder"] });
  registerSkill({ id: "account.outreach", allowedAgents: ["partnership"] });
});

test("unknown agent or skill is rejected", () => {
  const orchestrator = new Orchestrator({ policyRules: RULES });
  assert.throws(() => orchestrator.startRun({ agentId: "unknown", skillId: "repository.read" }), /unknown agent or skill/);
});

test("agent cannot execute a skill it is not allowed to use", () => {
  const orchestrator = new Orchestrator({ policyRules: RULES });
  assert.throws(() => orchestrator.startRun({ agentId: "headcoder", skillId: "account.outreach" }), /not allowed/);
});

test("allowed tool access returns allow", () => {
  const orchestrator = new Orchestrator({ policyRules: RULES });
  const run = orchestrator.startRun({ agentId: "headcoder", skillId: "repository.read" });
  const result = orchestrator.authorizeTool({ runId: run.runId, agentId: "headcoder", skillId: "repository.read", capability: "github", action: "read_repository" });
  assert.equal(result.decision, "allow");
});

test("missing tool rule is denied by default", () => {
  const orchestrator = new Orchestrator({ policyRules: RULES });
  const run = orchestrator.startRun({ agentId: "headcoder", skillId: "repository.read" });
  const result = orchestrator.authorizeTool({ runId: run.runId, agentId: "headcoder", skillId: "repository.read", capability: "github", action: "delete_repository" });
  assert.equal(result.decision, "deny");
});

test("approval-required authorization does not self-approve", () => {
  const orchestrator = new Orchestrator({ policyRules: RULES });
  const run = orchestrator.startRun({ agentId: "partnership", skillId: "account.outreach" });
  const pending = orchestrator.authorizeTool({ runId: run.runId, agentId: "partnership", skillId: "account.outreach", capability: "mail", action: "send" });
  assert.equal(pending.decision, "approval_required");
});

test("co-pilot override creates an exact, expiring approval", () => {
  registerAgent({ id: "video-agent" });
  registerSkill({ id: "video.publish", allowedAgents: ["video-agent"] });
  registerTool({ skillId: "video.publish", capability: "tiktok", action: "upload", execute: async () => ({ ok: true }) });
  const orchestrator = new Orchestrator({ policyRules: [{ agentId: "video-agent", skillId: "video.publish", capability: "tiktok", action: "upload", decision: "deny" }] });
  const request = { runId: "run-video", toolCallId: "call-video", agentId: "video-agent", skillId: "video.publish", capability: "tiktok", action: "upload", args: { videoUrl: "https://example.invalid/video.mp4" } };
  const result = orchestrator.coPilotOverride({ actorId: "co-pilot", toolRequest: request, reason: "Urgent launch" });
  assert.equal(result.approval.state, "approved");
  assert.equal(result.approval.source, "co_pilot_override");
  assert.equal(result.approval.runId, request.runId);
  assert.equal(result.approval.toolCallId, request.toolCallId);
  assert.equal(result.approval.reason, "Urgent launch");
  assert.throws(() => orchestrator.coPilotOverride({ actorId: "user", toolRequest: request, reason: "forged" }), /co-pilot authorization required/);
});

test("every run and authorization produces audit events", () => {
  const orchestrator = new Orchestrator({ policyRules: RULES });
  const run = orchestrator.startRun({ agentId: "headcoder", skillId: "repository.read" });
  orchestrator.authorizeTool({ runId: run.runId, agentId: "headcoder", skillId: "repository.read", capability: "github", action: "read_repository" });
  assert.equal(orchestrator.auditLog.listByRun(run.runId).length, 2);
});
