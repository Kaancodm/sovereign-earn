"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const manifestPath = path.join(__dirname, "..", "config", "release-candidate.json");

test("release candidate manifest is fail-closed for browser promotion", () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert.equal(manifest.promotionPolicy, "fail-closed");
  assert.equal(manifest.browserEvidence.requiredForPromotion, true);
  assert.notEqual(manifest.browserEvidence.status, "PASS");
});

test("release candidate declares the complete operator evidence contract", () => {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert.ok(manifest.requiredEvidence.includes("operator-dashboard-visible"));
  assert.ok(manifest.requiredEvidence.includes("approval-action-visible"));
  assert.ok(manifest.requiredEvidence.includes("execution-result-visible"));
  assert.ok(manifest.requiredEvidence.includes("audit-id-visible"));
  assert.ok(manifest.requiredEvidence.includes("blocked-policy-state-visible"));
  assert.ok(manifest.requiredEvidence.includes("mobile-layout-checked"));
});
