"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { SovereignAgentToolMVP } = require("./mvp");
const { ApprovalStore } = require("./approval");
const { Orchestrator } = require("./orchestrator");
const { clearRegistriesForTests, registerAgent, registerSkill, registerTool } = require("./registry");

function setup() {
  clearRegistriesForTests();
  registerAgent({ id: "worker" });
  registerAgent({ id: "co-pilot" });
  registerSkill({ id: "demo", allowedAgents: ["worker"] });
  registerTool({
    skillId: "demo",
    capability: "safe",
    action: "echo",
    description: "Echo test payload",
    risk: "low",
    requiresApproval: false,
    execute: async (args) => args,
  });
}

test("41-45: discovery returns registered tool metadata", () => {
  setup();
  const mvp = new SovereignAgentToolMVP();
  assert.deepEqual(mvp.discover({ skillId: "demo" }), [{
    skillId: "demo",
    capability: "safe",
    action: "echo",
    description: "Echo test payload",
    risk: "low",
    requiresApproval: false,
  }]);
  assert.equal(mvp.describe({ skillId: "demo", capability: "safe", action: "echo" }).risk, "low");
});

test("46-50: operator surface exposes pending approval and permits explicit decision", () => {
  setup();
  const store = new ApprovalStore();
  const orchestrator = new Orchestrator({ approvalStore: store });
  const mvp = new SovereignAgentToolMVP({ orchestrator });
  const approval = store.create({
    runId: "run-1", agentId: "worker", toolCallId: "call-1", skillId: "demo",
    capability: "safe", action: "echo", args: { x: 1 }, requestedBy: "worker",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  });
  assert.equal(mvp.approvalStatus(approval.approvalId).actionable, true);
  assert.equal(mvp.approve(approval.approvalId, "operator").state, "approved");
  assert.equal(mvp.approvalStatus(approval.approvalId).actionable, false);
});

test("51-55: public surface preserves blocked execution", async () => {
  setup();
  const mvp = new SovereignAgentToolMVP();
  const result = await mvp.execute({ runId: "run-1", toolCallId: "call-1", agentId: "worker", skillId: "demo", capability: "unknown", action: "missing", args: {} });
  assert.equal(result.status, "blocked");
});
