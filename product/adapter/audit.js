"use strict";

function createAuditAdapter({ orchestrator }) {
  if (!orchestrator?.auditLog) throw new TypeError("orchestrator with auditLog is required");
  return Object.freeze({
    all() { return orchestrator.auditLog.all(); },
    listByRun(runId) { return orchestrator.auditLog.listByRun(runId); },
  });
}

module.exports = { createAuditAdapter };
