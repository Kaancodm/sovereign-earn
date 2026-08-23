const agents = new Map();
const skills = new Map();

export function registerAgent(agent) {
  if (!agent?.id) throw new Error('agent.id is required');
  if (agents.has(agent.id)) throw new Error(`agent already registered: ${agent.id}`);
  agents.set(agent.id, Object.freeze({ ...agent }));
  return agents.get(agent.id);
}

export function getAgent(id) {
  return agents.get(id);
}

export function listAgents() {
  return [...agents.values()];
}

export function registerSkill(skill) {
  if (!skill?.id) throw new Error('skill.id is required');
  if (skills.has(skill.id)) throw new Error(`skill already registered: ${skill.id}`);
  skills.set(skill.id, Object.freeze({ ...skill }));
  return skills.get(skill.id);
}

export function getSkill(id) {
  return skills.get(id);
}

export function listSkills() {
  return [...skills.values()];
}

export function clearRegistriesForTests() {
  agents.clear();
  skills.clear();
}
