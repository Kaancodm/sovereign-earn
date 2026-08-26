"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { Client } = require("pg");
const { PostgresApprovalStore } = require("./postgres-approval-store");
const { hashArgs } = require("./approval");

const DATABASE_URL = process.env.DATABASE_URL;
const baseArgs = { to: "test@example.com", body: "hello" };

function approval(overrides = {}) {
  return {
    approvalId: "00000000-0000-4000-8000-000000000021",
    runId: "run-adversarial-1",
    agentId: "agent-adversarial-1",
    toolCallId: "tool-adversarial-1",
    skillId: "skill-adversarial-1",
    capability: "mail.send",
    action: "send",
    argsHash: hashArgs(baseArgs),
    requestedBy: "agent-adversarial-1",
    approvedBy: "human-adversarial-1",
    source: "human",
    reason: null,
    state: "APPROVED",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    consumedAt: null,
    ...overrides,
  };
}

async function withDatabase(fn) {
  if (!DATABASE_URL) throw new Error("DATABASE_URL is required for adversarial PostgreSQL tests");
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query("TRUNCATE sovereign_approvals");
    await fn(client, new PostgresApprovalStore(client));
  } finally {
    await client.end();
  }
}

async function seed(store, item = approval()) {
  await store.create(item);
  return item;
}

test("postgres rejects replay after approval has been consumed", async () => {
  await withDatabase(async (_client, store) => {
    const item = await seed(store);
    await store.assertUsable({ approvalId: item.approvalId, request: { runId: item.runId, agentId: item.agentId, toolCallId: item.toolCallId, skillId: item.skillId, capability: item.capability, action: item.action, args: baseArgs } });
    await store.consume(item.approvalId);
    await assert.rejects(() => store.consume(item.approvalId), /not consumable/);
  });
});

test("postgres rejects argument mutation against approved args hash", async () => {
  await withDatabase(async (_client, store) => {
    const item = await seed(store, approval({ approvalId: "00000000-0000-4000-8000-000000000022" }));
    await assert.rejects(() => store.assertUsable({ approvalId: item.approvalId, request: { runId: item.runId, agentId: item.agentId, toolCallId: item.toolCallId, skillId: item.skillId, capability: item.capability, action: item.action, args: { ...baseArgs, body: "MUTATED" } } }), /not bound to this exact request/);
  });
});

test("postgres rejects identity substitution", async () => {
  await withDatabase(async (_client, store) => {
    const item = await seed(store, approval({ approvalId: "00000000-0000-4000-8000-000000000023" }));
    await assert.rejects(() => store.assertUsable({ approvalId: item.approvalId, request: { runId: item.runId, agentId: "attacker-agent", toolCallId: item.toolCallId, skillId: item.skillId, capability: item.capability, action: item.action, args: baseArgs } }), /not bound to this exact request/);
    await assert.rejects(() => store.assertUsable({ approvalId: item.approvalId, request: { runId: "attacker-run", agentId: item.agentId, toolCallId: item.toolCallId, skillId: item.skillId, capability: item.capability, action: item.action, args: baseArgs } }), /not bound to this exact request/);
  });
});
