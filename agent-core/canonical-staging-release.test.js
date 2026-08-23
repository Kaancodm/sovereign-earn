"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateEarnings } = require("./earn-review");
const { verifyCalculation, requireVerifiedCalculation } = require("./earn-review-verifier");
const { preparePayout } = require("./earn-payout");
const { createPayoutApproval, assertPayoutApproval } = require("./payout-approval-contract");

test("canonical staging run is SUCCESS_PREPARED_NO_PAYMENT", () => {
  const snapshot = { earningsSnapshotId: "canonical-staging-2026-08-23", earningsSnapshotVersion: "v1", userId: "staging-user", period: "2026-08", calculationVersion: "1.0.0", records: [{ id: "earn-1", amount: 125 }] };
  const calculation = calculateEarnings(snapshot);
  const verification = verifyCalculation(calculation, snapshot);
  const verified = requireVerifiedCalculation(calculation, verification);
  const payout = preparePayout(verified, { beneficiaryId: "staging-beneficiary", currency: "CHF" });
  const approval = createPayoutApproval({ approvalId: "staging-approval", payoutRequest: payout, approvedBy: "staging-human", approvedAt: "2026-08-23T08:00:00.000Z" });
  assert.equal(assertPayoutApproval({ payoutRequest: payout, approval }), true);
  assert.equal(payout.approvalState, "none");
  assert.equal(payout.authorizationState, "none");
  assert.equal(verified.isVerified, true);
  assert.throws(() => require("./earn-payout").executePayout(payout), /Core-only/);
});
