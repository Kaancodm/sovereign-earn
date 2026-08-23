"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { registerSkill, getSkill, resolveCapability, clearSkillsForTests } = require("./skill-registry");

test.beforeEach(() => clearSkillsForTests());
function valid(overrides = {}) { return { skillId: "earn.review", version: "1.0.0", purpose: "Review earnings", allowedAgents: ["earn-agent"], capabilities: [{ capability: "earnings.read", action: "calculate", risk: "compute" }], policyProfile: "earn.review.v1", approvalProfile: "none", budgetProfile: "earn.review.v1", handoffPolicy: { allow: false }, guardrails: ["read_only"], auditProfile: ["skill.started", "skill.completed"], ...overrides }; }

test("registers and resolves an explicit capability", () => {
  registerSkill(valid());
  assert.equal(getSkill("earn.review").version, "1.0.0");
  assert.equal(resolveCapability("earn.review", "earnings.read", "calculate").risk, "compute");
});

test("rejects unknown risk classes", () => assert.throws(() => registerSkill(valid({ capabilities: [{ capability: "earnings.read", action: "calculate", risk: "privilegedish" }] }))));

test("rejects duplicate skill IDs", () => { registerSkill(valid()); assert.throws(() => registerSkill(valid())); });

test("unknown capability and action never resolve", () => { registerSkill(valid()); assert.equal(resolveCapability("earn.review", "payout.execute", "execute"), null); });

test("skill definition does not accept an executable function as authority", () => {
  const skill = registerSkill(valid({ execute: () => "pwned" }));
  assert.equal("execute" in skill, false);
});

test("risk class is server-owned by registry definition", () => {
  const skill = registerSkill(valid());
  assert.equal(skill.capabilities[0].risk, "compute");
  assert.throws(() => skill.capabilities[0].risk = "privileged");
});
