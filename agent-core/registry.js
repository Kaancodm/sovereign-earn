'use strict';

function createRegistry({ agents = [], skills = [], tools = [] } = {}) {
  const agentTable = new Map(agents.map(agent => [agent.agentId, Object.freeze({ ...agent })]));
  const skillTable = new Map(skills.map(skill => [`${skill.agentId}\u0000${skill.skillId}`, Object.freeze({ ...skill })]));
  const toolTable = new Map(tools.map(tool => [`${tool.skillId}\u0000${tool.capability}\u0000${tool.action}`, Object.freeze({ ...tool })]));

  return Object.freeze({
    lookupAgent(agentId) {
      const agent = agentTable.get(agentId);
      return agent && agent.active === true ? agent : null;
    },
    lookupSkill(agentId, skillId) {
      return skillTable.get(`${agentId}\u0000${skillId}`) || null;
    },
    resolveTool(skillId, capability, action) {
      return toolTable.get(`${skillId}\u0000${capability}\u0000${action}`) || null;
    },
  });
}

module.exports = { createRegistry };
