"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateEarnings } = require("./earn-review");
const { verifyCalculation, requireVerifiedCalculation } = require("./earn-review-verifier");
const { preparePayout } = require("./earn-payout");

test("canonical release candidate reaches payout preparation but never payment execution", () => {
  const snapshot = { earningsSnapshotId: "staging-snapshot-1", earningsSnapshotVersion: "2026-08-23T01", userId: "user-1", period: "2026-08", calculationVersion: "1.0.0", records: [{ id: "earn-1", amount: 125 }] };
  const calculation = calculateEarnings(snapshot);
  assert.equal(calculation.isVerified, false);
  const verification = verifyCalculation(calculation, snapshot);
  const verified = requireVerifiedCalculation(calculation, verification);
  const payout = preparePayout(verified, { beneficiaryId: "beneficiary-test", currency: "CHF" });
  assert.equal(payout.amount, 125);
  assert.equal(payout.approvalState, "none");
  assert.equal(payout.authorizationState, "none");
  assert.equal(typeof payout.approvalHash, "string");
  assert.throws(() => require("./earn-payout").executePayout(payout), /Core-only/);
});
