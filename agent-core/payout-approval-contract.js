"use strict";
const { createHash } = require("node:crypto");
const { hashPayload } = require("./earn-payout-contract");

function createPayoutApproval({ approvalId, payoutRequest, approvedBy, approvedAt, approvalScope = "payout" }) {
  if (!approvalId || !approvedBy || !approvedAt || !payoutRequest?.payoutRequestId) throw new TypeError("complete payout approval fields are required");
  const requestHash = hashPayload(payoutRequest);
  return Object.freeze({ approvalId, payoutRequestId: payoutRequest.payoutRequestId, approvedBy, approvedAt, approvalScope, requestHash });
}

function assertPayoutApproval({ payoutRequest, approval }) {
  if (!approval || approval.payoutRequestId !== payoutRequest?.payoutRequestId) throw new Error("payout approval binding mismatch");
  if (approval.requestHash !== hashPayload(payoutRequest)) throw new Error("payout approval payload mismatch");
  return true;
}

module.exports = { createPayoutApproval, assertPayoutApproval };
