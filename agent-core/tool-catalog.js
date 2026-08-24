"use strict";

const { listSkills, resolveTool } = require("./registry");

function discoverTools({ skillId, capability } = {}) {
  const skills = skillId ? listSkills().filter((skill) => skill.id === skillId) : listSkills();
  const results = [];
  for (const skill of skills) {
    for (const tool of skill.tools || []) {
      if (capability && tool.capability !== capability) continue;
      if (!resolveTool(skill.id, tool.capability, tool.action)) continue;
      results.push(Object.freeze({
        skillId: skill.id,
        capability: tool.capability,
        action: tool.action,
        description: tool.description || null,
        risk: tool.risk || "unknown",
        requiresApproval: Boolean(tool.requiresApproval),
      }));
    }
  }
  return Object.freeze(results);
}

function describeTool({ skillId, capability, action }) {
  const tool = resolveTool(skillId, capability, action);
  if (!tool) return null;
  return Object.freeze({
    skillId,
    capability,
    action,
    description: tool.description || null,
    risk: tool.risk || "unknown",
    requiresApproval: Boolean(tool.requiresApproval),
  });
}

module.exports = { discoverTools, describeTool };
