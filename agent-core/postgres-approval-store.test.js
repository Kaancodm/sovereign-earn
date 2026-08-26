"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { PostgresApprovalStore } = require("./postgres-approval-store");

function makeApproval() {
  return {
    approvalId: "00000000-0000-4000-8000-000000000001",
    runId: "run-pg-1",
    agentId: "agent-1",
    toolCallId: "tool-1",
    skillId: "skill-1",
    capability: "mail.send",
    action: "send",
    argsHash: "args-hash",
    requestedBy: "agent-1",
    approvedBy: "human-1",
    source: "human",
    reason: null,
    state: "APPROVED",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    consumedAt: null,
  };
}

function makePool(rows = []) {
  const calls = [];
  return {
    calls,
    async query(text, params) {
      calls.push({ text, params });
      return { rows, rowCount: rows.length };
    },
  };
}

test("PostgresApprovalStore validates the database pool contract", () => {
  assert.throws(() => new PostgresApprovalStore(null), /pool.query is required/);
});

test("consume uses an atomic APPROVED-only SQL transition", async () => {
  const approval = makeApproval();
  const pool = makePool([{
    approval_id: approval.approvalId,
    run_id: approval.runId,
    agent_id: approval.agentId,
    tool_call_id: approval.toolCallId,
    skill_id: approval.skillId,
    capability: approval.capability,
    action: approval.action,
    args_hash: approval.argsHash,
    requested_by: approval.requestedBy,
    approved_by: approval.approvedBy,
    source: approval.source,
    reason: approval.reason,
    state: "CONSUMED",
    expires_at: approval.expiresAt,
    consumed_at: new Date().toISOString(),
  }]);
  const store = new PostgresApprovalStore(pool);
  const consumed = await store.consume(approval.approvalId);
  assert.equal(consumed.state, "CONSUMED");
  assert.match(pool.calls[0].text, /WHERE approval_id = \$1/);
  assert.match(pool.calls[0].text, /AND state = 'APPROVED'/);
  assert.match(pool.calls[0].text, /AND expires_at > CURRENT_TIMESTAMP/);
  assert.match(pool.calls[0].text, /RETURNING/);
});

test("consume fails when the atomic update affects no row", async () => {
  const pool = makePool([]);
  const store = new PostgresApprovalStore(pool);
  await assert.rejects(() => store.consume("missing"), /not consumable/);
});

test("assertUsable performs exact request binding after persistent lookup", async () => {
  const approval = makeApproval();
  const pool = makePool([{
    approval_id: approval.approvalId,
    run_id: approval.runId,
    agent_id: approval.agentId,
    tool_call_id: approval.toolCallId,
    skill_id: approval.skillId,
    capability: approval.capability,
    action: approval.action,
    args_hash: approval.argsHash,
    requested_by: approval.requestedBy,
    approved_by: approval.approvedBy,
    source: approval.source,
    reason: approval.reason,
    state: "APPROVED",
    expires_at: approval.expiresAt,
    consumed_at: null,
  }]);
  const store = new PostgresApprovalStore(pool);
  await assert.rejects(() => store.assertUsable({
    approvalId: approval.approvalId,
    request: { runId: "other-run", agentId: approval.agentId, toolCallId: approval.toolCallId, skillId: approval.skillId, capability: approval.capability, action: approval.action, args: {} },
  }), /not bound/);
});
