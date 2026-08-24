"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { AuditEventSink, createMetrics } = require("./observability");
const { RateLimiter } = require("./rate-limit");
const { evaluateStagingReadiness } = require("./staging-readiness");

test("audit sink records immutable, queryable events", () => {
  const sink = new AuditEventSink({ clock: () => new Date("2026-08-24T14:00:00.000Z") });
  const event = sink.emit({ type: "approval.requested", runId: "run-1", toolId: "file.write", status: "PENDING" });
  assert.equal(event.runId, "run-1");
  assert.equal(sink.forRun("run-1").length, 1);
  assert.equal(Object.isFrozen(event), true);
});

test("metrics increment deterministically", () => {
  const metrics = createMetrics();
  metrics.increment("tool.executed");
  metrics.increment("tool.executed", 2);
  assert.equal(metrics.get("tool.executed"), 3);
});

test("rate limiter fails closed at the configured limit", () => {
  let now = 0;
  const limiter = new RateLimiter({ limit: 2, windowMs: 1000, clock: () => now });
  assert.equal(limiter.check("agent-1").allowed, true);
  assert.equal(limiter.check("agent-1").allowed, true);
  const blocked = limiter.check("agent-1");
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterMs > 0);
  now = 1000;
  assert.equal(limiter.check("agent-1").allowed, true);
});

test("staging gate names every missing blocker", () => {
  const result = evaluateStagingReadiness({
    ciGreen: true,
    securityGreen: true,
    auditVerified: true,
    e2eGreen: true,
    docsComplete: true,
    browserQa: false,
  });
  assert.equal(result.ready, false);
  assert.deepEqual(result.blocking, ["browserQa"]);
});
