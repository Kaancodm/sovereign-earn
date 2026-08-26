"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { ApprovalStore } = require("./approval");

function request() {
  return {
    runId: "run-concurrency",
    agentId: "agent-a",
    toolCallId: "tool-call-1",
    skillId: "skill-a",
    capability: "capability-a",
    action: "execute",
    args: { amount: 1, target: "sandbox" }
  };
}

function createApprovedStore() {
  const store = new ApprovalStore();
  const req = request();
  const approval = store.create({
    ...req,
    requestedBy: "agent-a",
    expiresAt: new Date(Date.now() + 60_000).toISOString()
  });
  store.approve(approval.approvalId, "operator-1");
  return { store, approval, req };
}

test("concurrent consume attempts allow exactly one successful consumption", async () => {
  const { store, approval } = createApprovedStore();
  const attempts = await Promise.allSettled([
    Promise.resolve().then(() => store.consume(approval.approvalId)),
    Promise.resolve().then(() => store.consume(approval.approvalId))
  ]);

  const successes = attempts.filter((result) => result.status === "fulfilled");
  const failures = attempts.filter((result) => result.status === "rejected");

  assert.equal(successes.length, 1);
  assert.equal(failures.length, 1);
  assert.equal(store.get(approval.approvalId).state, "consumed");
});

test("concurrent exact-request checks do not permit a consumed approval", async () => {
  const { store, approval, req } = createApprovedStore();
  store.consume(approval.approvalId);

  const attempts = await Promise.allSettled([
    Promise.resolve().then(() => store.assertUsable({ approvalId: approval.approvalId, request: req })),
    Promise.resolve().then(() => store.assertUsable({ approvalId: approval.approvalId, request: req }))
  ]);

  assert.equal(attempts.filter((result) => result.status === "fulfilled").length, 0);
  assert.equal(attempts.filter((result) => result.status === "rejected").length, 2);
});
