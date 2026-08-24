"use strict";

function createApprovalAdapter({ orchestrator }) {
  if (!orchestrator?.approvalStore) throw new TypeError("orchestrator with approvalStore is required");
  const store = orchestrator.approvalStore;
  return Object.freeze({
    list() { return store.list(); },
    listByRun(runId) { return store.listByRun(runId); },
    get(approvalId) { return store.get(approvalId); },
    approve(approvalId, actorId) { return orchestrator.approve(approvalId, actorId); },
    reject(approvalId, actorId) { return orchestrator.reject(approvalId, actorId); },
    coPilotOverride(input) { return orchestrator.coPilotOverride(input); },
  });
}

module.exports = { createApprovalAdapter };
