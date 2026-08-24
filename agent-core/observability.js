"use strict";

const { randomUUID } = require("node:crypto");

class AuditEventSink {
  constructor({ clock = () => new Date() } = {}) {
    this.clock = clock;
    this.events = [];
  }

  emit({ type, runId, toolId, status, actorId, approvalId, metadata = {} }) {
    if (!type || !runId) throw new TypeError("type and runId are required");
    const event = Object.freeze({
      id: randomUUID(),
      timestamp: this.clock().toISOString(),
      type,
      runId,
      toolId: toolId || null,
      status: status || null,
      actorId: actorId || null,
      approvalId: approvalId || null,
      metadata: Object.freeze({ ...metadata }),
    });
    this.events.push(event);
    return event;
  }

  forRun(runId) {
    return this.events.filter((event) => event.runId === runId);
  }

  snapshot() {
    return this.events.slice();
  }
}

function createMetrics() {
  const counters = new Map();

  function increment(name, value = 1) {
    if (!name) throw new TypeError("metric name is required");
    counters.set(name, (counters.get(name) || 0) + value);
  }

  return {
    increment,
    get(name) {
      return counters.get(name) || 0;
    },
    snapshot() {
      return Object.fromEntries(counters.entries());
    },
  };
}

module.exports = { AuditEventSink, createMetrics };
