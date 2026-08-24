"use strict";

const { listTools } = require("../../agent-core/registry");

function listRegisteredTools() {
  return listTools().map((tool) => ({
    skillId: tool.skillId,
    capability: tool.capability,
    action: tool.action,
    ...(tool.name ? { name: tool.name } : {}),
    ...(tool.description ? { description: tool.description } : {}),
    ...(tool.risk ? { risk: tool.risk } : {}),
    ...(tool.cost !== undefined ? { cost: tool.cost } : {}),
  }));
}

module.exports = { listRegisteredTools };
