"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { Client } = require("pg");
const { PostgresApprovalStore } = require("./postgres-approval-store");

const DATABASE_URL = process.env.DATABASE_URL;

function requireDatabase() {
  if (!DATABASE_URL) throw new Error("DATABASE_URL is required for PostgreSQL integration tests");
}

function approval(overrides = {}) {
  return {
    approvalId: "00000000-0000-4000-8000-000000000010",
    runId: "run-real-pg-1",
    agentId: "agent-real-pg-1",
    toolCallId: "tool-real-pg-1",
    skillId: "skill-real-pg-1",
    capability: "mail.send",
    action: "send",
    argsHash: require("./approval").hashArgs({ to: "test@example.com", body: "hello" }),
    requestedBy: "agent-real-pg-1",
    approvedBy: "human-real-pg-1",
    source: "human",
    reason: null,
    state: "APPROVED",
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    consumedAt: null,
    ...overrides,
  };
}

async function withDatabase(fn) {
  requireDatabase();
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query("TRUNCATE sovereign_approvals");
    await fn(client, new PostgresApprovalStore(client));
  } finally {
    await client.end();
  }
}

test("real postgres create/get/assertUsable round trip", async () => {
  await withDatabase(async (_client, store) => {
    const item = approval();
    await store.create(item);
    const loaded = await store.get(item.approvalId);
    assert.equal(loaded.approvalId, item.approvalId);
    assert.equal(loaded.state, "APPROVED");
    await store.assertUsable({
      approvalId: item.approvalId,
      request: {
        runId: item.runId,
        agentId: item.agentId,
        toolCallId: item.toolCallId,
        skillId: item.skillId,
        capability: item.capability,
        action: item.action,
        args: { to: "test@example.com", body: "hello" },
      },
    });
  });
});

test("real postgres atomic consume allows exactly one concurrent consumer", async () => {
  await withDatabase(async (client, store) => {
    const item = approval({ approvalId: "00000000-0000-4000-8000-000000000011" });
    await store.create(item);
    const first = new PostgresApprovalStore(client);
    const second = new PostgresApprovalStore(client);
    const results = await Promise.allSettled([
      first.consume(item.approvalId),
      second.consume(item.approvalId),
    ]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(results.filter((r) => r.status === "rejected").length, 1);
    const row = await store.get(item.approvalId);
    assert.equal(row.state, "CONSUMED");
    assert.ok(row.consumedAt);
  });
});

test("real postgres rejects expired approval consumption", async () => {
  await withDatabase(async (_client, store) => {
    const item = approval({
      approvalId: "00000000-0000-4000-8000-000000000012",
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
    });
    await store.create(item);
    await assert.rejects(() => store.consume(item.approvalId), /not consumable/);
  });
});
