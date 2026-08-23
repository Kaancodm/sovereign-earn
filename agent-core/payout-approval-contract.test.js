"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createPayoutRequest } = require("./earn-payout-contract");
const { createPayoutApproval, assertPayoutApproval } = require("./payout-approval-contract");

test("payout approval is bound to the exact exposure payload", () => {
  const request = createPayoutRequest({ calculationId: "calc-1", amount: 125, currency: "CHF", beneficiaryId: "beneficiary-1" });
  const approval = createPayoutApproval({ approvalId: "approval-1", payoutRequest: request, approvedBy: "human-1", approvedAt: "2026-08-23T08:00:00.000Z" });
  assert.equal(assertPayoutApproval({ payoutRequest: request, approval }), true);
  const changed = createPayoutRequest({ calculationId: "calc-1", amount: 1000, currency: "CHF", beneficiaryId: "beneficiary-1" });
  assert.throws(() => assertPayoutApproval({ payoutRequest: changed, approval }), /binding mismatch|payload mismatch/);
});

test("changing beneficiary or currency invalidates the approval", () => {
  const request = createPayoutRequest({ calculationId: "calc-1", amount: 125, currency: "CHF", beneficiaryId: "beneficiary-1" });
  const approval = createPayoutApproval({ approvalId: "approval-2", payoutRequest: request, approvedBy: "human-1", approvedAt: "2026-08-23T08:00:00.000Z" });
  for (const changed of [
    createPayoutRequest({ calculationId: "calc-1", amount: 125, currency: "EUR", beneficiaryId: "beneficiary-1" }),
    createPayoutRequest({ calculationId: "calc-1", amount: 125, currency: "CHF", beneficiaryId: "beneficiary-2" }),
  ]) assert.throws(() => assertPayoutApproval({ payoutRequest: changed, approval }), /binding mismatch|payload mismatch/);
});
