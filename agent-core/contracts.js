'use strict';

const APPROVAL_STATES = Object.freeze({
  NOT_REQUIRED: 'not_required',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  CONSUMED: 'consumed',
});

const REQUEST_STATUSES = Object.freeze({ CREATED: 'created' });

function requireNonEmptyString(value, field) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`${field} must be a non-empty string`);
  }
  return value;
}

function requireEnum(value, allowed, field) {
  if (!Object.values(allowed).includes(value)) throw new TypeError(`${field} is invalid`);
  return value;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((out, key) => {
      out[key] = stableValue(value[key]);
      return out;
    }, {});
  }
  return value;
}

function cloneArgs(args) {
  if (args === undefined || args === null) return {};
  if (typeof args !== 'object' || Array.isArray(args)) throw new TypeError('args must be an object');
  return structuredClone(args);
}

function hashArgs(args) {
  return require('node:crypto').createHash('sha256').update(JSON.stringify(stableValue(args))).digest('hex');
}

function createToolRequest(input = {}) {
  // Untrusted normalization only. Never copy status/approval or other authority fields.
  return Object.freeze({
    toolCallId: requireNonEmptyString(input.toolCallId, 'toolCallId'),
    runId: requireNonEmptyString(input.runId, 'runId'),
    agentId: requireNonEmptyString(input.agentId, 'agentId'),
    skillId: requireNonEmptyString(input.skillId, 'skillId'),
    capability: requireNonEmptyString(input.capability, 'capability'),
    action: requireNonEmptyString(input.action, 'action'),
    args: Object.freeze(cloneArgs(input.args)),
    createdAt: new Date().toISOString(),
  });
}

module.exports = { APPROVAL_STATES, REQUEST_STATUSES, requireNonEmptyString, requireEnum, createToolRequest, hashArgs, stableValue };
