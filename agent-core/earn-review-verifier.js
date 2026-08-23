"use strict";

const { createHash } = require("node:crypto");

function canonicalize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(",")}}`;
}

function snapshotHash(snapshot) {
  return createHash("sha256").update(canonicalize(snapshot)).digest("hex");
}

function verifyCalculation(calculation, snapshot) {
  if (!calculation || !snapshot) throw new TypeError("calculation and snapshot are required");
  const amount = snapshot.records.reduce((sum, record) => sum + Number(record.amount || 0), 0);
  const expectedSnapshotHash = snapshotHash(snapshot);
  const expectedCalculationId = createHash("sha256")
    .update(canonicalize({ earningsSnapshotId: snapshot.earningsSnapshotId, earningsSnapshotVersion: snapshot.earningsSnapshotVersion, calculationVersion: snapshot.calculationVersion }))
    .digest("hex");
  const matches = calculation.calculationId === expectedCalculationId
    && calculation.earningsSnapshotId === snapshot.earningsSnapshotId
    && calculation.earningsSnapshotVersion === snapshot.earningsSnapshotVersion
    && calculation.calculationVersion === snapshot.calculationVersion
    && calculation.amount === amount;
  return Object.freeze({
    calculationId: calculation.calculationId,
    earningsSnapshotId: snapshot.earningsSnapshotId,
    earningsSnapshotVersion: snapshot.earningsSnapshotVersion,
    calculationVersion: snapshot.calculationVersion,
    snapshotHash: expectedSnapshotHash,
    verified: matches,
    verificationVersion: "1.0.0",
  });
}

function requireVerifiedCalculation(calculation, verification) {
  if (!verification?.verified || verification.calculationId !== calculation?.calculationId || verification.earningsSnapshotId !== calculation?.earningsSnapshotId) {
    const error = new Error("calculation verification failed");
    error.category = "verification_failed";
    throw error;
  }
  return Object.freeze({ ...calculation, isVerified: true, authorizationState: "none", verificationRef: verification.snapshotHash });
}

module.exports = { snapshotHash, verifyCalculation, requireVerifiedCalculation };
