CREATE TABLE IF NOT EXISTS sovereign_budgets (
  budget_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  limit_amount NUMERIC(20, 6) NOT NULL CHECK (limit_amount >= 0),
  spent NUMERIC(20, 6) NOT NULL DEFAULT 0 CHECK (spent >= 0),
  reserved NUMERIC(20, 6) NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT budget_total_within_limit CHECK (spent + reserved <= limit_amount)
);
CREATE INDEX IF NOT EXISTS sovereign_budgets_owner_idx ON sovereign_budgets(owner_id);
