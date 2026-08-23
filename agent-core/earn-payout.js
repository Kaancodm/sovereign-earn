"use strict";
const { createPayoutRequest } = require("./earn-payout-contract");

const SKILL_ID = "earn.prepare_payout";
const SKILL_VERSION = "1.0.0";
const CAPABILITY = "earnings.payout_prepare";
const ACTION = "prepare";
const RISK = "write";

function preparePayout(verifiedCalculation, { beneficiaryId, currency }) {
  if (!verifiedCalculation || verifiedCalculation.isVerified !== true) throw new Error("verified calculation is required");
  if (verifiedCalculation.authorizationState !== "none") throw new Error("calculation authorization state is invalid");
  const request = createPayoutRequest({ calculationId: verifiedCalculation.calculationId, amount: verifiedCalculation.amount, currency, beneficiaryId });
  return Object.freeze({ ...request, approvalState: "none", authorizationState: "none" });
}

function executePayout() { throw new Error("execute_payout is Core-only; agent-facing Skills cannot execute payment rails"); }

module.exports = { SKILL_ID, SKILL_VERSION, CAPABILITY, ACTION, RISK, preparePayout, executePayout };
