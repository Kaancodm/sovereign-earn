"use strict";

const { randomUUID } = require("node:crypto");

function createAuditEvent({ runId, type, actor, target = null, outcome, metadata = {} }) {
  if (!runId) throw new Error("runId is required");
  if (!type) throw new Error("type is required");
  if (!actor) throw new Error("actor is required");
  if (!outcome) throw new Error("outcome is required");

  return Object.freeze({
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    runId,
    type,
    actor,
    target,
    outcome,
    metadata: Object.freeze({ ...metadata }),
  });
}

class AuditLog {
  #events = [];

  append(event) {
    this.#events.push(event);
    return event;
  }

  listByRun(runId) {
    return this.#events.filter((event) => event.runId === runId);
  }

  all() {
    return [...this.#events];
  }
}

module.exports = { createAuditEvent, AuditLog };
