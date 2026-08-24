"use strict";

const { randomUUID } = require("node:crypto");

const STATES = Object.freeze([
  "PENDING_APPROVAL",
  "APPROVED",
  "EXECUTING",
  "COMPLETED",
  "FAILED",
  "BLOCKED",
]);

const TERMINAL = new Set(["COMPLETED", "FAILED", "BLOCKED"]);

const TRANSITIONS = Object.freeze({
  PENDING_APPROVAL: new Set(["APPROVED", "BLOCKED"]),
  APPROVED: new Set(["EXECUTING", "BLOCKED"]),
  EXECUTING: new Set(["COMPLETED", "FAILED", "BLOCKED"]),
  COMPLETED: new Set(),
  FAILED: new Set(),
  BLOCKED: new Set(),
});

class RunControl {
  constructor() {
    this.runs = new Map();
  }

  create({ runId = randomUUID(), agentId, skillId, toolCallId = null } = {}) {
    const run = {
      runId,
      agentId,
      skillId,
      toolCallId,
      state: "PENDING_APPROVAL",
      history: [{ state: "PENDING_APPROVAL", at: new Date().toISOString() }],
      auditId: `audit_${randomUUID()}`,
    };
    this.runs.set(runId, run);
    return this.snapshot(run);
  }

  transition(runId, nextState, metadata = {}) {
    if (!STATES.includes(nextState)) throw new TypeError(`invalid run state: ${nextState}`);
    const run = this.get(runId);
    if (!TRANSITIONS[run.state].has(nextState)) {
      throw new Error(`invalid run transition: ${run.state} -> ${nextState}`);
    }
    run.state = nextState;
    run.history.push({ state: nextState, at: new Date().toISOString(), ...metadata });
    return this.snapshot(run);
  }

  get(runId) {
    const run = this.runs.get(runId);
    if (!run) throw new Error(`run not found: ${runId}`);
    return run;
  }

  snapshot(run) {
    return {
      ...run,
      terminal: TERMINAL.has(run.state),
      history: run.history.map((entry) => ({ ...entry })),
    };
  }

  status(runId) {
    return this.snapshot(this.get(runId));
  }
}

module.exports = { RunControl, STATES };
