"use strict";

const { listTools, resolveTool } = require("./registry");

function discoverTools({ skillId, capability } = {}) {
  return Object.freeze(listTools()
    .filter((tool) => !skillId || tool.skillId === skillId)
    .filter((tool) => !capability || tool.capability === capability)
    .map((tool) => Object.freeze({
      skillId: tool.skillId,
      capability: tool.capability,
      action: tool.action,
      description: tool.description || null,
      risk: tool.risk || "unknown",
      requiresApproval: Boolean(tool.requiresApproval),
    })));
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
