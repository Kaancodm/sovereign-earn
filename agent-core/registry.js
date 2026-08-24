"use strict";
const agents = new Map();
const skills = new Map();
const tools = new Map();
function registerAgent(agent) { if (!agent?.id) throw new Error("agent.id is required"); if (agents.has(agent.id)) throw new Error(`agent already registered: ${agent.id}`); agents.set(agent.id, Object.freeze({ active: true, ...agent })); return agents.get(agent.id); }
function getAgent(id) { return agents.get(id); }
function listAgents() { return [...agents.values()]; }
function registerSkill(skill) { if (!skill?.id) throw new Error("skill.id is required"); if (skills.has(skill.id)) throw new Error(`skill already registered: ${skill.id}`); skills.set(skill.id, Object.freeze({ ...skill, allowedAgents: [...(skill.allowedAgents || [])] })); return skills.get(skill.id); }
function getSkill(id) { return skills.get(id); }
function listSkills() { return [...skills.values()]; }
function toolKey(skillId, capability, action) { return `${skillId}\0${capability}\0${action}`; }
function registerTool(tool) { if (!tool?.skillId || !tool?.capability || !tool?.action || typeof tool.execute !== "function") throw new Error("tool requires skillId, capability, action, and execute"); const key = toolKey(tool.skillId, tool.capability, tool.action); if (tools.has(key)) throw new Error(`tool already registered: ${key}`); tools.set(key, Object.freeze({ ...tool })); return tools.get(key); }
function resolveTool(skillId, capability, action) { return tools.get(toolKey(skillId, capability, action)) || null; }
function listTools() { return [...tools.values()]; }
function clearRegistriesForTests() { agents.clear(); skills.clear(); tools.clear(); }
module.exports = { registerAgent, getAgent, listAgents, registerSkill, getSkill, listSkills, registerTool, resolveTool, listTools, clearRegistriesForTests };
