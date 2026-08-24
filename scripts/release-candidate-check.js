"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const manifestPath = path.join(root, "config", "release-candidate.json");
const requireBrowserEvidence = process.argv.includes("--require-browser-evidence");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const errors = [];

if (manifest.schemaVersion !== 1) errors.push("unsupported manifest schema");
if (manifest.product !== "sovereign-agent-tool") errors.push("wrong product");
if (manifest.releaseLine !== "staging") errors.push("releaseLine must be staging");
if (manifest.promotionPolicy !== "fail-closed") errors.push("promotionPolicy must be fail-closed");
if (!manifest.executionBoundary) errors.push("executionBoundary is required");
if (!Array.isArray(manifest.requiredEvidence) || manifest.requiredEvidence.length < 5) {
  errors.push("requiredEvidence must contain at least five evidence items");
}
if (!manifest.browserEvidence || !manifest.browserEvidence.status) {
  errors.push("browserEvidence.status is required");
}
if (requireBrowserEvidence && manifest.browserEvidence.status !== "PASS") {
  errors.push("browser evidence is not PASS; promotion is blocked");
}

if (errors.length) {
  console.error("\n✘ Release candidate gate failed:");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log("✔ Release candidate manifest valid");
console.log(`  Candidate: ${manifest.candidate}`);
console.log(`  Browser evidence: ${manifest.browserEvidence.status}`);
if (!requireBrowserEvidence) {
  console.log("  Promotion mode: structural validation only");
}
