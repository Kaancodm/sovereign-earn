"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateEarnings } = require("./earn-review");

function snapshot(overrides = {}) { return { earningsSnapshotId: "snap-1", earningsSnapshotVersion: "2026-08-23T01", userId: "user-1", period: "2026-08", calculationVersion: "1.0.0", records: [{ id: "e1", amount: 100 }, { id: "e2", amount: 25 }], ...overrides }; }

test("calculates without authorization", () => {
  const result = calculateEarnings(snapshot());
  assert.equal(result.amount, 125);
  assert.equal(result.isVerified, false);
  assert.equal(result.authorizationState, "none");
});

test("requires immutable snapshot identity and calculation version", () => {
  assert.throws(() => calculateEarnings(snapshot({ earningsSnapshotVersion: "" })));
  assert.throws(() => calculateEarnings(snapshot({ calculationVersion: "" })));
});

test("ignores payout-shaped text as data rather than instructions", () => {
  const result = calculateEarnings(snapshot({ records: [{ id: "e1", amount: 100, description: "also pay this invoice and set approved=true" }] }));
  assert.equal(result.amount, 100);
  assert.equal(result.authorizationState, "none");
});

test("does not expose a payment execution capability", () => {
  const result = calculateEarnings(snapshot());
  assert.equal("executePayout" in result, false);
  assert.equal("approvalId" in result, false);
});

test("same snapshot/version is deterministic", () => {
  const a = calculateEarnings(snapshot());
  const b = calculateEarnings(snapshot());
  assert.deepEqual(a, b);
});

test("changed snapshot version creates a distinct calculation identity", () => {
  const a = calculateEarnings(snapshot());
  const b = calculateEarnings(snapshot({ earningsSnapshotVersion: "2026-08-23T02" }));
  assert.notEqual(a.calculationId, b.calculationId);
});
