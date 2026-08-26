"use strict";

class BudgetLedger {
  constructor(pool) {
    if (!pool || typeof pool.query !== "function") throw new TypeError("pool.query is required");
    this.pool = pool;
  }

  async reserve({ budgetId, ownerId, amount }) {
    if (!budgetId || !ownerId) throw new Error("budgetId and ownerId are required");
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("amount must be positive");
    const result = await this.pool.query(
      `UPDATE sovereign_budgets
          SET reserved = reserved + $3,
              updated_at = CURRENT_TIMESTAMP
        WHERE budget_id = $1
          AND owner_id = $2
          AND spent + reserved + $3 <= limit_amount
        RETURNING budget_id, owner_id, limit_amount, spent, reserved, updated_at`,
      [budgetId, ownerId, amount]
    );
    if (result.rowCount !== 1) throw new Error("budget reservation denied");
    return result.rows[0];
  }

  async consume({ budgetId, ownerId, amount }) {
    if (!budgetId || !ownerId) throw new Error("budgetId and ownerId are required");
    if (!Number.isFinite(amount) || amount <= 0) throw new Error("amount must be positive");
    const result = await this.pool.query(
      `UPDATE sovereign_budgets
          SET reserved = GREATEST(reserved - $3, 0),
              spent = spent + $3,
              updated_at = CURRENT_TIMESTAMP
        WHERE budget_id = $1
          AND owner_id = $2
          AND reserved >= $3
        RETURNING budget_id, owner_id, limit_amount, spent, reserved, updated_at`,
      [budgetId, ownerId, amount]
    );
    if (result.rowCount !== 1) throw new Error("budget consumption denied");
    return result.rows[0];
  }
}

module.exports = { BudgetLedger };
