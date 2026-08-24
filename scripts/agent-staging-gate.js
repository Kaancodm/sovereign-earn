#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const required = [
  "docs/SOVEREIGN_AGENT_TOOL_STAGING_RELEASE.md",
  "docs/SOVEREIGN_AGENT_TOOL_BROWSER_QA.md",
  "docs/SOVEREIGN_AGENT_TOOL_ROLLBACK.md",
  "docs/release-evidence.schema.json",
  "agent-core/run-control.js",
  "agent-core/run-control.test.js",
];

const errors = [];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`missing: ${file}`);
}

const qa = fs.readFileSync(path.join(root, "docs/SOVEREIGN_AGENT_TOOL_BROWSER_QA.md"), "utf8");
if (!/BLOCKED UNTIL REAL-BROWSER EVIDENCE/i.test(qa)) {
  errors.push("browser QA must remain fail-closed until real-browser evidence exists");
}

const manifest = fs.readFileSync(path.join(root, "docs/SOVEREIGN_AGENT_TOOL_STAGING_RELEASE.md"), "utf8");
if (!/release gate/i.test(manifest) || !/rollback/i.test(manifest)) {
  errors.push("staging release manifest must define release gate and rollback");
}

if (errors.length) {
  console.error("STAGING RELEASE GATE: BLOCKED");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("STAGING RELEASE GATE: STRUCTURE OK");
console.log("Browser/Product QA: BLOCKED UNTIL REAL-BROWSER EVIDENCE");
