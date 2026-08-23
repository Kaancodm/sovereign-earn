"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createContextManifest } = require("./context");
const { SESSION_MODES, createGovernanceContext, evaluateGovernance } = require("./governance");
const { createBudget, consume } = require("./budget");
const { ERROR_CATEGORIES, recoveryFor, assertPrivilegedAudit } = require("./failure-recovery");
const { createTraceContext, createTraceEvent } = require("./tracing");
const { startSession, advance, fail } = require("./session");

const base = { contextVersion: "1", runId: "run-1", agentId: "agent-1", sessionMode: "review_only", architectureVersion: "1", policyVersion: "1", flowVersion: "1", workspaceMapVersion: "1" };

test("context manifest requires server-owned versions and validates classification", () => {
  const ctx = createContextManifest({ ...base, dataClassification: { user: "model_restricted", payments: "core_only" } });
  assert.equal(ctx.dataClassification.payments, "core_only");
  assert.throws(() => createContextManifest({ ...base, policyVersion: "" }));
  assert.throws(() => createContextManifest({ ...base, dataClassification: { payments: "secret" } }));
});

test("governance mode blocks privileged capability outside production", () => {
  const ctx = createGovernanceContext({ identity: { userId: "u1" }, sessionMode: SESSION_MODES.REVIEW_ONLY, scopes: ["earn:read", "earn:payout"] });
  assert.equal(evaluateGovernance(ctx, { scope: "earn:read", risk: "compute" }).allowed, true);
  assert.equal(evaluateGovernance(ctx, { scope: "earn:payout", risk: "privileged" }).allowed, false);
});

test("agent cannot create a governance context without identity", () => assert.throws(() => createGovernanceContext({ sessionMode: "review_only" })));

test("budget fails closed when any limit is exceeded", () => {
  const budget = createBudget({ maxToolCalls: 1 });
  const used = consume(budget, { toolCalls: 1 });
  assert.equal(used.usage.toolCalls, 1);
  assert.throws(() => consume(used, { toolCalls: 1 }), /budget_exceeded/);
});

test("monetary exposure defaults to zero", () => assert.throws(() => consume(createBudget(), { monetaryExposure: 0.01 }), /budget_exceeded/));

test("failure policy distinguishes retryable infrastructure failures from security failures", () => {
  assert.equal(recoveryFor("tool_unavailable").retry, true);
  assert.equal(recoveryFor("policy_violation").retry, false);
  assert.equal(recoveryFor("approval_invalid").action, "manual_review");
  assert.equal(ERROR_CATEGORIES.includes("audit_failed"), true);
});

test("privileged execution fails closed when audit fails", () => assert.throws(() => assertPrivilegedAudit(false), /audit_failed/));

test("trace contract rejects unknown event types", () => {
  const trace = createTraceContext({ traceId: "trace-1", runId: "run-1", agentId: "agent-1" });
  assert.equal(createTraceEvent(trace, "run.started").runId, "run-1");
  assert.throws(() => createTraceEvent(trace, "unknown.event"));
});

test("session follows deterministic lifecycle", () => {
  let session = startSession({ runId: "run-1", agentId: "agent-1", sessionMode: "review_only", contextVersion: "1" });
  for (const state of ["context_load", "baseline_check", "execute", "verify", "audit", "close"]) { session = advance(session); assert.equal(session.state, state); }
});

test("failed session records category before close", () => {
  let session = startSession({ runId: "run-2", agentId: "agent-1", sessionMode: "review_only", contextVersion: "1" });
  session = fail(session, "policy_violation");
  assert.equal(session.failureCategory, "policy_violation");
  session = advance(session);
  assert.equal(session.state, "close");
});
