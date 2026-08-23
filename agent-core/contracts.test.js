"use strict";

const assert = require("node:assert/strict");
const {
  APPROVAL_STATES,
  createRun,
  createHandoff,
  createToolRequest,
} = require("./contracts");
const { DECISIONS, evaluateToolAccess } = require("./policy");

const run = createRun({ runId: "run-1", agentId: "headcoder", taskId: "task-1" });
assert.equal(run.agentId, "headcoder");
assert.throws(() => createRun({ runId: "", agentId: "headcoder", taskId: "task-1" }), /runId/);

const handoff = createHandoff({
  handoffId: "handoff-1",
  runId: "run-1",
  fromAgent: "headcoder",
  toAgent: "security",
  reason: "security review",
});
assert.equal(handoff.toAgent, "security");

const request = createToolRequest({
  toolCallId: "tool-1",
  runId: "run-1",
  agentId: "headcoder",
  skillId: "repository-analysis",
  capability: "github.read",
  action: "read_repository",
});
assert.equal(request.approval, APPROVAL_STATES.NOT_REQUIRED);

assert.equal(evaluateToolAccess(request, []).decision, DECISIONS.DENY);
assert.equal(
  evaluateToolAccess(request, [{
    agentId: "headcoder",
    skillId: "repository-analysis",
    capability: "github.read",
    action: "read_repository",
    decision: DECISIONS.ALLOW,
  }]).decision,
  DECISIONS.ALLOW
);
assert.equal(
  evaluateToolAccess(request, [{
    agentId: "headcoder",
    skillId: "repository-analysis",
    capability: "github.read",
    action: "read_repository",
    decision: DECISIONS.APPROVAL_REQUIRED,
  }]).decision,
  DECISIONS.APPROVAL_REQUIRED
);

console.log("Agent Core v1 contract/policy tests: OK");
