"use strict";

const TRACE_EVENTS = Object.freeze([
  "run.started", "context.loaded", "governance.decided", "budget.updated", "guardrail.decided",
  "tool.requested", "tool.denied", "tool.executing", "tool.succeeded", "tool.failed",
  "handoff.requested", "approval.requested", "approval.validated", "run.verified", "run.closed",
]);

function createTraceContext({ traceId, runId, agentId }) {
  for (const [key, value] of Object.entries({ traceId, runId, agentId })) if (typeof value !== "string" || !value) throw new TypeError(`${key} is required`);
  return Object.freeze({ traceId, runId, agentId });
}
function createTraceEvent(context, type, fields = {}) {
  if (!TRACE_EVENTS.includes(type)) throw new TypeError("trace event type is invalid");
  return Object.freeze({ ...context, type, timestamp: new Date().toISOString(), ...fields });
}

class TraceLog {
  #events = [];
  append(event) { this.#events.push(event); return event; }
  listByRun(runId) { return this.#events.filter((event) => event.runId === runId); }
  all() { return [...this.#events]; }
}

module.exports = { TRACE_EVENTS, createTraceContext, createTraceEvent, TraceLog };
