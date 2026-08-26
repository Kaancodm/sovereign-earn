"use strict";
const { hashArgs } = require("./approval");

const APPROVAL_COLUMNS = [
  "approval_id", "run_id", "agent_id", "tool_call_id", "skill_id",
  "capability", "action", "args_hash", "requested_by", "approved_by",
  "source", "reason", "state", "expires_at", "consumed_at"
];

function requirePool(pool) {
  if (!pool || typeof pool.query !== "function") throw new TypeError("pool.query is required");
  return pool;
}

function rowToApproval(row) {
  if (!row) return null;
  return Object.freeze({
    approvalId: row.approval_id,
    runId: row.run_id,
    agentId: row.agent_id,
    toolCallId: row.tool_call_id,
    skillId: row.skill_id,
    capability: row.capability,
    action: row.action,
    argsHash: row.args_hash,
    requestedBy: row.requested_by,
    approvedBy: row.approved_by,
    source: row.source,
    reason: row.reason,
    state: row.state,
    expiresAt: new Date(row.expires_at).toISOString(),
    consumedAt: row.consumed_at ? new Date(row.consumed_at).toISOString() : null,
  });
}

class PostgresApprovalStore {
  #pool;
  constructor(pool) { this.#pool = requirePool(pool); }

  async get(approvalId) {
    const result = await this.#pool.query(
      `SELECT ${APPROVAL_COLUMNS.join(", ")} FROM sovereign_approvals WHERE approval_id = $1`,
      [approvalId]
    );
    return rowToApproval(result.rows[0]);
  }

  async create(approval) {
    const result = await this.#pool.query(
      `INSERT INTO sovereign_approvals (${APPROVAL_COLUMNS.join(", ")})
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING ${APPROVAL_COLUMNS.join(", ")}`,
      [approval.approvalId, approval.runId, approval.agentId, approval.toolCallId,
       approval.skillId, approval.capability, approval.action, approval.argsHash,
       approval.requestedBy, approval.approvedBy, approval.source, approval.reason,
       approval.state, approval.expiresAt, approval.consumedAt]
    );
    return rowToApproval(result.rows[0]);
  }

  async consume(approvalId) {
    const result = await this.#pool.query(
      `UPDATE sovereign_approvals
          SET state = 'CONSUMED', consumed_at = CURRENT_TIMESTAMP
        WHERE approval_id = $1
          AND state = 'APPROVED'
          AND expires_at > CURRENT_TIMESTAMP
        RETURNING ${APPROVAL_COLUMNS.join(", ")}`,
      [approvalId]
    );
    if (result.rowCount !== 1) throw new Error("approval is not consumable");
    return rowToApproval(result.rows[0]);
  }

  async assertUsable({ approvalId, request }) {
    const result = await this.#pool.query(
      `SELECT ${APPROVAL_COLUMNS.join(", ")} FROM sovereign_approvals
        WHERE approval_id = $1 AND state = 'APPROVED' AND expires_at > CURRENT_TIMESTAMP`,
      [approvalId]
    );
    const approval = rowToApproval(result.rows[0]);
    if (!approval) throw new Error("approval is not approved or is expired");
    const exact = ["runId", "agentId", "toolCallId", "skillId", "capability", "action"]
      .every((field) => approval[field] === request[field]);
    if (!exact || approval.argsHash !== hashArgs(request.args)) {
      throw new Error("approval is not bound to this exact request");
    }
    return approval;
  }
}

module.exports = { PostgresApprovalStore };
