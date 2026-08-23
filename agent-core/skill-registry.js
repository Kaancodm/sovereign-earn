"use strict";

const VALID_RISK_CLASSES = Object.freeze(["read", "compute", "write", "privileged"]);
const skills = new Map();

function nonEmpty(value, field) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${field} must be a non-empty string`);
  return value.trim();
}
function registerSkill(definition) {
  const skillId = nonEmpty(definition?.skillId, "skillId");
  const version = nonEmpty(definition?.version, "version");
  const allowedAgents = [...new Set(definition.allowedAgents || [])].map((v) => nonEmpty(v, "allowedAgents[]"));
  const capabilities = (definition.capabilities || []).map((c) => Object.freeze({
    capability: nonEmpty(c.capability, "capability"),
    action: nonEmpty(c.action, "action"),
    risk: VALID_RISK_CLASSES.includes(c.risk) ? c.risk : (() => { throw new TypeError("risk is invalid"); })(),
  }));
  if (skills.has(skillId)) throw new Error(`skill already registered: ${skillId}`);
  const skill = Object.freeze({
    skillId, version, purpose: nonEmpty(definition.purpose, "purpose"),
    allowedAgents: Object.freeze(allowedAgents), capabilities: Object.freeze(capabilities),
    inputSchema: Object.freeze({ ...(definition.inputSchema || {}) }),
    outputSchema: Object.freeze({ ...(definition.outputSchema || {}) }),
    policyProfile: nonEmpty(definition.policyProfile, "policyProfile"),
    approvalProfile: nonEmpty(definition.approvalProfile, "approvalProfile"),
    budgetProfile: nonEmpty(definition.budgetProfile, "budgetProfile"),
    handoffPolicy: Object.freeze({ ...(definition.handoffPolicy || {}) }),
    guardrails: Object.freeze([...(definition.guardrails || [])]),
    auditProfile: Object.freeze([...(definition.auditProfile || [])]),
  });
  skills.set(skillId, skill);
  return skill;
}
function getSkill(skillId) { return skills.get(skillId) || null; }
function resolveCapability(skillId, capability, action) {
  const skill = getSkill(skillId); if (!skill) return null;
  return skill.capabilities.find((c) => c.capability === capability && c.action === action) || null;
}
function clearSkillsForTests() { skills.clear(); }
module.exports = { VALID_RISK_CLASSES, registerSkill, getSkill, resolveCapability, clearSkillsForTests };
