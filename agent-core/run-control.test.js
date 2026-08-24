"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { RunControl } = require("./run-control");

test("run control records a monotonic approval-to-completion lifecycle", () => {
  const control = new RunControl();
  const created = control.create({ runId: "run-1", agentId: "worker", skillId: "demo" });
  assert.equal(created.state, "PENDING_APPROVAL");
  assert.match(created.auditId, /^audit_/);

  control.transition("run-1", "APPROVED", { actorId: "co-pilot" });
  control.transition("run-1", "EXECUTING");
  const completed = control.transition("run-1", "COMPLETED", { result: "ok" });

  assert.equal(completed.state, "COMPLETED");
  assert.equal(completed.terminal, true);
  assert.deepEqual(completed.history.map((x) => x.state), [
    "PENDING_APPROVAL",
    "APPROVED",
    "EXECUTING",
    "COMPLETED",
  ]);
});

test("terminal runs cannot be reopened", () => {
  const control = new RunControl();
  control.create({ runId: "run-2" });
  control.transition("run-2", "BLOCKED");
  assert.throws(() => control.transition("run-2", "EXECUTING"), /invalid run transition/);
});
