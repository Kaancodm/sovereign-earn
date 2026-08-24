"use strict";

const { createRunAdapter } = require("./runs");
const { createApprovalAdapter } = require("./approvals");
const { createAuditAdapter } = require("./audit");
const { listRegisteredAgents, listRegisteredSkills } = require("./agents");
const { listRegisteredTools } = require("./tools");

function createProductAdapter({ orchestrator }) {
  return Object.freeze({
    runs: createRunAdapter({ orchestrator }),
    approvals: createApprovalAdapter({ orchestrator }),
    audit: createAuditAdapter({ orchestrator }),
    agents: Object.freeze({ list: listRegisteredAgents, listSkills: listRegisteredSkills }),
    tools: Object.freeze({ list: listRegisteredTools }),
  });
}

module.exports = { createProductAdapter };
