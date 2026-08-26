"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { Client } = require("pg");
const { BudgetLedger } = require("./budget-ledger");

const DATABASE_URL = process.env.DATABASE_URL;
const budgetId = "budget-real-pg-1";
const ownerId = "owner-real-pg-1";

async function withDatabase(fn) {
  if (!DATABASE_URL) throw new Error("DATABASE_URL is required for budget integration tests");
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query("TRUNCATE sovereign_budgets");
    await client.query("INSERT INTO sovereign_budgets (budget_id, owner_id, limit_amount) VALUES ($1, $2, $3)", [budgetId, ownerId, 10]);
    await fn(client, new BudgetLedger(client));
  } finally {
    await client.end();
  }
}

test("real postgres budget reservation stays within limit", async () => {
  await withDatabase(async (client, ledger) => {
    const row = await ledger.reserve({ budgetId, ownerId, amount: 7 });
    assert.equal(Number(row.reserved), 7);
    await assert.rejects(() => ledger.reserve({ budgetId, ownerId, amount: 4 }), /reservation denied/);
    const check = await client.query("SELECT spent, reserved FROM sovereign_budgets WHERE budget_id = $1", [budgetId]);
    assert.equal(Number(check.rows[0].reserved), 7);
    assert.equal(Number(check.rows[0].spent), 0);
  });
});

test("real postgres concurrent reservations never exceed the budget", async () => {
  await withDatabase(async (client, ledger) => {
    const attempts = Array.from({ length: 10 }, () => ledger.reserve({ budgetId, ownerId, amount: 2 }));
    const results = await Promise.allSettled(attempts);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 5);
    assert.equal(results.filter((r) => r.status === "rejected").length, 5);
    const check = await client.query("SELECT spent, reserved FROM sovereign_budgets WHERE budget_id = $1", [budgetId]);
    assert.equal(Number(check.rows[0].reserved), 10);
    assert.equal(Number(check.rows[0].spent) + Number(check.rows[0].reserved), 10);
  });
});

test("real postgres consumption moves reserved amount to spent atomically", async () => {
  await withDatabase(async (_client, ledger) => {
    await ledger.reserve({ budgetId, ownerId, amount: 6 });
    const row = await ledger.consume({ budgetId, ownerId, amount: 6 });
    assert.equal(Number(row.reserved), 0);
    assert.equal(Number(row.spent), 6);
    await assert.rejects(() => ledger.consume({ budgetId, ownerId, amount: 1 }), /consumption denied/);
  });
});
