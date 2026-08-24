"use strict";

const { listAgents, listSkills } = require("../../agent-core/registry");

function listRegisteredAgents() {
  return listAgents().map(({ id, active = true, ...metadata }) => ({ id, active, ...metadata }));
}

function listRegisteredSkills() {
  return listSkills().map(({ id, allowedAgents = [], ...metadata }) => ({ id, allowedAgents: [...allowedAgents], ...metadata }));
}

module.exports = { listRegisteredAgents, listRegisteredSkills };
