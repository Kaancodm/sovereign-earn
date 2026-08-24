"use strict";

function createRunAdapter({ orchestrator }) {
  if (!orchestrator) throw new TypeError("orchestrator is required");
  return Object.freeze({
    start(input) { return orchestrator.startRun(input); },
    authorize(input) { return orchestrator.authorizeTool(input); },
  });
}

module.exports = { createRunAdapter };
