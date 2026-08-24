"use strict";

const { listSkills } = require("../../agent-core/registry");
const { resolveTool } = require("../../agent-core/registry");

function listRegisteredTools() {
  const tools = [];
  for (const skill of listSkills()) {
    for (const capability of skill.capabilities || []) {
      for (const action of capability.actions || []) {
        const tool = resolveTool(skill.id, capability.id || capability.name || capability, action);
        if (!tool) continue;
        tools.push({ skillId: skill.id, capability: tool.capability, action: tool.action });
      }
    }
  }
  return tools;
}

module.exports = { listRegisteredTools };
