"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createGovernanceContext, evaluateGovernance } = require("./governance");
const { createContextManifest } = require("./context");
const { createBudget, consume } = require("./budget");
const { classifyError, recoveryFor } = require("./failure-recovery");
const { createTraceContext, createTraceEvent } = require("./tracing");
const { startSession, advance } = require("./session");

test("context is rejected when policy/version authority is absent", () => {
  assert.throws(() => createContextManifest({ runId: "r", agentId: "a", sessionMode: "review_only", architectureVersion: "1", flowVersion: "1", workspaceMapVersion: "1" }));
});

test("agent cannot select an invalid mode", () => {
  assert.throws(() => createGovernanceContext({ identity: { userId: "u" }, sessionMode: "execute_anything" }));
});

test("mode cannot be bypassed by a privileged capability request", () => {
  const ctx = createGovernanceContext({ identity: { userId: "u" }, sessionMode: "prepare_payout", scopes: ["payout:execute"] });
  assert.equal(evaluateGovernance(ctx, { scope: "payout:execute", risk: "privileged" }).allowed, false);
});

test("budget cannot be increased through usage input", () => {
  const budget = createBudget({ maxToolCalls: 1 });
  assert.throws(() => consume(budget, { toolCalls: -1 }));
  assert.throws(() => consume(budget, { madeUpMetric: 1 }));
});

test("unknown failures fail closed rather than becoming retryable", () => {
  assert.equal(classifyError(new Error("unknown")), "execution_failed");
  assert.equal(recoveryFor("execution_failed").retry, false);
});

test("trace cannot be forged with an unknown event", () => {
  const trace = createTraceContext({ traceId: "t", runId: "r", agentId: "a" });
  assert.throws(() => createTraceEvent(trace, "policy.allow"));
});

test("session cannot skip lifecycle states", () => {
  let session = startSession({ runId: "r", agentId: "a", sessionMode: "review_only", contextVersion: "1" });
  assert.equal(session.state, "orient");
  session = advance(session);
  assert.equal(session.state, "context_load");
  assert.notEqual(session.state, "execute");
});
