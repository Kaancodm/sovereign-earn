"use strict";

const { randomUUID } = require("node:crypto");
const { Orchestrator } = require("./orchestrator");
const { ToolRuntime } = require("./tool-runtime");
const { OperatorSurface } = require("./operator");
const { discoverTools, describeTool } = require("./tool-catalog");

class SovereignAgentToolMVP {
  constructor({ orchestrator = new Orchestrator(), runtime = new ToolRuntime() } = {}) {
    this.orchestrator = orchestrator;
    this.runtime = runtime;
    this.operator = new OperatorSurface({ approvalStore: orchestrator.approvalStore });
  }

  start({ agentId, skillId, taskId = randomUUID(), input = {} }) {
    return this.orchestrator.startRun({ agentId, skillId, taskId, input });
  }

  authorize(request) {
    return this.orchestrator.authorizeTool(request);
  }

  override({ actorId, toolRequest, reason, expiresInMs }) {
    return this.orchestrator.coPilotOverride({ actorId, toolRequest, reason, expiresInMs });
  }

  execute(request, options = {}) {
    return this.runtime.executeTool(request, options);
  }

  discover({ skillId, capability } = {}) {
    return discoverTools({ skillId, capability });
  }

  describe({ skillId, capability, action }) {
    return describeTool({ skillId, capability, action });
  }

  approvalStatus(approvalId) {
    return this.operator.status(approvalId);
  }

  approve(approvalId, actorId) {
    return this.operator.approve(approvalId, actorId);
  }

  reject(approvalId) {
    return this.operator.reject(approvalId);
  }
}

module.exports = { SovereignAgentToolMVP };
