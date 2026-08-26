CREATE TABLE IF NOT EXISTS sovereign_approvals (
  approval_id UUID PRIMARY KEY,
  run_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  tool_call_id TEXT NOT NULL,
  skill_id TEXT NOT NULL,
  capability TEXT NOT NULL,
  action TEXT NOT NULL,
  args_hash TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  approved_by TEXT,
  source TEXT NOT NULL,
  reason TEXT,
  state TEXT NOT NULL CHECK (state IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'CONSUMED')),
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT sovereign_approvals_consumed_at_check CHECK (
    (state = 'CONSUMED' AND consumed_at IS NOT NULL) OR
    (state <> 'CONSUMED' AND consumed_at IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS sovereign_approvals_run_idx ON sovereign_approvals (run_id);
CREATE INDEX IF NOT EXISTS sovereign_approvals_expiry_idx ON sovereign_approvals (expires_at);
