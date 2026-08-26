"use strict";

const { randomUUID } = require("node:crypto");
const { Orchestrator } = require("./orchestrator");
const { ToolRuntime } = require("./tool-runtime");

class SovereignAgentToolMVP {
  constructor({ orchestrator = new Orchestrator(), runtime = new ToolRuntime() } = {}) {
    this.orchestrator = orchestrator;
    this.runtime = runtime;
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
}

module.exports = { SovereignAgentToolMVP };
