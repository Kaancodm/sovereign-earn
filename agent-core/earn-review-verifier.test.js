"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateEarnings } = require("./earn-review");
const { verifyCalculation, requireVerifiedCalculation } = require("./earn-review-verifier");

function snapshot() { return { earningsSnapshotId: "snap-1", earningsSnapshotVersion: "v1", userId: "user-1", period: "2026-08", calculationVersion: "1.0.0", records: [{ id: "e1", amount: 100 }, { id: "e2", amount: 25 }] }; }

test("server verifier accepts only the exact calculation and snapshot", () => {
  const snap = snapshot();
  const calculation = calculateEarnings(snap);
  const verification = verifyCalculation(calculation, snap);
  assert.equal(verification.verified, true);
  const verified = requireVerifiedCalculation(calculation, verification);
  assert.equal(verified.isVerified, true);
  assert.equal(verified.authorizationState, "none");
});

test("server verifier rejects changed snapshot data", () => {
  const snap = snapshot();
  const calculation = calculateEarnings(snap);
  const changed = { ...snap, records: [{ id: "e1", amount: 999 }] };
  const verification = verifyCalculation(calculation, changed);
  assert.equal(verification.verified, false);
  assert.throws(() => requireVerifiedCalculation(calculation, verification), error => error?.category === "verification_failed");
});

test("server verifier rejects changed calculation amount", () => {
  const snap = snapshot();
  const calculation = calculateEarnings(snap);
  const forged = { ...calculation, amount: 999 };
  const verification = verifyCalculation(forged, snap);
  assert.equal(verification.verified, false);
});
