export function createAuditEvent({ runId, type, actor, target, outcome, metadata = {} }) {
  if (!runId) throw new Error('runId is required');
  if (!type) throw new Error('type is required');
  if (!actor) throw new Error('actor is required');
  if (!outcome) throw new Error('outcome is required');

  return Object.freeze({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    runId,
    type,
    actor,
    target: target ?? null,
    outcome,
    metadata: Object.freeze({ ...metadata }),
  });
}

export class AuditLog {
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
