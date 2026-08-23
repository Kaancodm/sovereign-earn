"use strict";
const { getAgent } = require("./registry");
const { getSkill, resolveCapability } = require("./skill-registry");
const { createToolRequest } = require("./contracts");

function authorizeSkillRequest(input = {}) {
  const agent = getAgent(input.agentId);
  if (!agent || agent.active === false) return { allowed: false, reason: "agent_not_registered_or_inactive" };
  const skill = getSkill(input.skillId);
  if (!skill || !skill.allowedAgents.includes(input.agentId)) return { allowed: false, reason: "skill_not_allowed_for_agent" };
  const capability = resolveCapability(input.skillId, input.capability, input.action);
  if (!capability) return { allowed: false, reason: "capability_or_action_not_registered" };
  const request = createToolRequest({ toolCallId: input.toolCallId, runId: input.runId, agentId: input.agentId, skillId: input.skillId, capability: input.capability, action: input.action, args: input.args });
  return Object.freeze({ allowed: true, request, skill, capability });
}
module.exports = { authorizeSkillRequest };
