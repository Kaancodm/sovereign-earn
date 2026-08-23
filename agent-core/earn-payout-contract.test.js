"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createPayoutRequest, assertCoreOnlyExecution, hashPayload } = require("./earn-payout-contract");

test("prepare payout creates a request and never payment execution", () => {
  const request = createPayoutRequest({ calculationId: "calc-1", amount: 100, currency: "EUR", beneficiaryId: "beneficiary-1" });
  assert.equal(request.calculationId, "calc-1");
  assert.ok(request.payoutRequestId);
  assert.ok(request.approvalHash);
  assert.throws(() => assertCoreOnlyExecution(), /Core-only/);
});

test("request identity changes when financial payload changes", () => {
  const a = createPayoutRequest({ calculationId: "calc-1", amount: 100, currency: "EUR", beneficiaryId: "beneficiary-1" });
  const b = createPayoutRequest({ calculationId: "calc-1", amount: 101, currency: "EUR", beneficiaryId: "beneficiary-1" });
  assert.notEqual(a.payoutRequestId, b.payoutRequestId);
  assert.notEqual(a.approvalHash, b.approvalHash);
});

test("invalid payout amounts are rejected", () => {
  assert.throws(() => createPayoutRequest({ calculationId: "calc-1", amount: 0, currency: "EUR", beneficiaryId: "b" }));
  assert.throws(() => createPayoutRequest({ calculationId: "calc-1", amount: -1, currency: "EUR", beneficiaryId: "b" }));
});

test("hashing is deterministic for equivalent objects", () => assert.equal(hashPayload({ a: 1, b: 2 }), hashPayload({ b: 2, a: 1 })));
