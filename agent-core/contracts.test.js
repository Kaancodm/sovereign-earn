"use strict";
const assert = require("node:assert/strict");
const { APPROVAL_STATES, createRun, createHandoff, createToolRequest } = require("./contracts");
const { DECISIONS, evaluateToolAccess } = require("./policy");

const run = createRun({ runId: "run-1", agentId: "headcoder", taskId: "task-1" });
assert.equal(run.agentId, "headcoder");
assert.throws(() => createRun({ runId: "", agentId: "headcoder", taskId: "task-1" }), /runId/);
assert.throws(() => createRun({ runId: "run-2", agentId: "headcoder", taskId: "task-2", status: "forged" }), /status is invalid/);

const handoff = createHandoff({ handoffId: "handoff-1", runId: "run-1", fromAgent: "headcoder", toAgent: "security", reason: "security review" });
assert.equal(handoff.toAgent, "security");
assert.throws(() => createHandoff({ handoffId: "h-2", runId: "run-1", fromAgent: "headcoder", toAgent: "security", reason: "bad", status: "approved" }), /status is invalid/);

const request = createToolRequest({
  toolCallId: "tool-1", runId: "run-1", agentId: "headcoder", skillId: "repository-analysis",
  capability: "github.read", action: "read_repository", args: { scope: "agent-core" }, approval: "approved",
});
assert.equal(request.approval, undefined);
assert.deepEqual(request.args, { scope: "agent-core" });
assert.equal(request.createdAt.length > 0, true);
assert.equal(evaluateToolAccess(request, []).decision, DECISIONS.DENY);
assert.equal(evaluateToolAccess(request, [{ agentId: "headcoder", skillId: "repository-analysis", capability: "github.read", action: "read_repository", decision: DECISIONS.ALLOW }]).decision, DECISIONS.ALLOW);
assert.equal(evaluateToolAccess(request, [{ agentId: "headcoder", skillId: "repository-analysis", capability: "github.read", action: "read_repository", decision: DECISIONS.APPROVAL_REQUIRED }]).decision, DECISIONS.APPROVAL_REQUIRED);
assert.equal(APPROVAL_STATES.APPROVED, "approved");
