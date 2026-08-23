"use strict";

const agents = new Map();
const skills = new Map();

function registerAgent(agent) {
  if (!agent?.id) throw new Error("agent.id is required");
  if (agents.has(agent.id)) throw new Error(`agent already registered: ${agent.id}`);
  agents.set(agent.id, Object.freeze({ ...agent }));
  return agents.get(agent.id);
}

function getAgent(id) {
  return agents.get(id);
}

function listAgents() {
  return [...agents.values()];
}

function registerSkill(skill) {
  if (!skill?.id) throw new Error("skill.id is required");
  if (skills.has(skill.id)) throw new Error(`skill already registered: ${skill.id}`);
  skills.set(skill.id, Object.freeze({ ...skill }));
  return skills.get(skill.id);
}

function getSkill(id) {
  return skills.get(id);
}

function listSkills() {
  return [...skills.values()];
}

function clearRegistriesForTests() {
  agents.clear();
  skills.clear();
}

module.exports = {
  registerAgent,
  getAgent,
  listAgents,
  registerSkill,
  getSkill,
  listSkills,
  clearRegistriesForTests,
};
