"use strict";

const DEFAULTS = Object.freeze({ maxTurns: 20, maxHandoffs: 3, maxToolCalls: 20, maxRuntimeMs: 120000, maxTokens: 50000, maxMonetaryExposure: 0 });

function createBudget(input = {}) {
  const limits = { ...DEFAULTS, ...input };
  for (const [key, value] of Object.entries(limits)) if (!Number.isFinite(value) || value < 0) throw new TypeError(`${key} must be a non-negative finite number`);
  return Object.freeze({ limits: Object.freeze(limits), usage: Object.freeze({ turns: 0, handoffs: 0, toolCalls: 0, runtimeMs: 0, tokens: 0, monetaryExposure: 0 }) });
}

function consume(budget, delta = {}) {
  const usage = { ...budget.usage };
  for (const [key, value] of Object.entries(delta)) {
    if (!Object.hasOwn(usage, key)) throw new TypeError(`unknown budget metric: ${key}`);
    if (!Number.isFinite(value) || value < 0) throw new TypeError(`${key} increment is invalid`);
    usage[key] += value;
    const limitKey = `max${key[0].toUpperCase()}${key.slice(1)}`;
    if (usage[key] > budget.limits[limitKey]) throw new Error(`budget_exceeded:${key}`);
  }
  return Object.freeze({ limits: budget.limits, usage: Object.freeze(usage) });
}

module.exports = { DEFAULTS, createBudget, consume };
