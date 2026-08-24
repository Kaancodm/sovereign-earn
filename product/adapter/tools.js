"use strict";

const { listTools } = require("../../agent-core/registry");

function listRegisteredTools() {
  return listTools().map(({ skillId, capability, action, ...metadata }) => ({
    skillId,
    capability,
    action,
    ...metadata,
  }));
}

module.exports = { listRegisteredTools };
