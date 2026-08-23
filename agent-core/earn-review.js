"use strict";

const SKILL_ID = "earn.review";
const SKILL_VERSION = "1.0.0";
const CAPABILITY = "earnings.read";
const ACTION = "calculate";
const RISK = "compute";

function assertSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") throw new TypeError("earnings snapshot is required");
  for (const field of ["earningsSnapshotId", "earningsSnapshotVersion", "userId", "period", "calculationVersion"]) {
    if (typeof snapshot[field] !== "string" || snapshot[field].trim() === "") throw new TypeError(`${field} is required`);
  }
  if (!Array.isArray(snapshot.records)) throw new TypeError("records must be an array");
}

function calculateEarnings(snapshot, options = {}) {
  assertSnapshot(snapshot);
  // Pure/read-only reference implementation. No persistence, network, approval, or payment side effects.
  const amount = snapshot.records.reduce((sum, record) => sum + Number(record.amount || 0), 0);
  return Object.freeze({
    calculationId: `${snapshot.earningsSnapshotId}:${snapshot.calculationVersion}`,
    earningsSnapshotId: snapshot.earningsSnapshotId,
    earningsSnapshotVersion: snapshot.earningsSnapshotVersion,
    calculationVersion: snapshot.calculationVersion,
    amount,
    breakdown: Object.freeze(snapshot.records.map((record) => Object.freeze({ id: record.id ?? null, amount: Number(record.amount || 0) }))),
    isVerified: false,
    authorizationState: "none",
    options: Object.freeze({ ...options }),
  });
}

module.exports = { SKILL_ID, SKILL_VERSION, CAPABILITY, ACTION, RISK, calculateEarnings };
