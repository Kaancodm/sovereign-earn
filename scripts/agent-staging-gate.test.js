"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

test("staging release gate is structurally fail-closed", () => {
  const result = spawnSync(process.execPath, [path.join(__dirname, "agent-staging-gate.js")], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /STRUCTURE OK/);
  assert.match(result.stdout, /QA-BLOCKED/);
});
