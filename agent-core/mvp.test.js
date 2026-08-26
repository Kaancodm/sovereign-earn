"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { SovereignAgentToolMVP } = require("./mvp");
const { clearRegistriesForTests, registerAgent, registerSkill, registerTool } = require("./registry");

function setup() {
  clearRegistriesForTests();
  registerAgent({ id: "worker" });
  registerAgent({ id: "co-pilot" });
  registerSkill({ id: "demo", allowedAgents: ["worker"] });
  registerTool({ skillId: "demo", capability: "safe", action: "echo", execute: async (args) => args });
}

const ALLOW_ECHO = [{
  agentId: "worker",
  skillId: "demo",
  capability: "safe",
  action: "echo",
  decision: "allow",
}];

test("MVP facade starts a run and executes a registered tool", async () => {
  setup();
  const mvp = new SovereignAgentToolMVP({
    orchestrator: undefined,
    runtime: undefined,
  });
  mvp.orchestrator.policyRules = [...ALLOW_ECHO];
  mvp.runtime.policyRules = Object.freeze([...ALLOW_ECHO]);
  const run = mvp.start({ agentId: "worker", skillId: "demo", input: { prompt: "hello" } });
  assert.equal(run.agentId, "worker");

  const result = await mvp.execute({
    runId: run.runId,
    toolCallId: "call-1",
    agentId: "worker",
    skillId: "demo",
    capability: "safe",
    action: "echo",
    args: { value: 42 },
  });

  assert.equal(result.status, "executed");
  assert.deepEqual(result.result, { value: 42 });
});

test("MVP facade exposes co-pilot override without bypassing registry checks", () => {
  setup();
  const mvp = new SovereignAgentToolMVP();
  const run = mvp.start({ agentId: "worker", skillId: "demo" });
  const approval = mvp.override({
    actorId: "co-pilot",
    toolRequest: {
      runId: run.runId,
      toolCallId: "call-2",
      agentId: "worker",
      skillId: "demo",
      capability: "safe",
      action: "echo",
      args: { value: "override" },
    },
    reason: "explicit operator approval",
  });
  assert.ok(approval.approvalId);
});
