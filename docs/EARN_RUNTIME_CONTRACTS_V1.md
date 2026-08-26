# Sovereign-earn Runtime Contracts v1

## Status

Security design artifact for Agent Core hardening. Skills v1 remains blocked until the Agent Core security gate and Node 22 CI are green.

## Non-negotiable invariants

1. Agent output is untrusted until deterministic runtime validation succeeds.
2. Calculation is not verification, authorization, or execution.
3. Payout preparation is not payout execution.
4. Approval is a server-generated, durable artifact bound to the exact request payload.
5. No agent-controlled field can promote a calculation or payout request to an authorized state.
6. `execute_payout` is Core-only and accepts identifiers for verified server-side objects, never free-form agent authorization text.
7. Policy, approval, limits, allowlists, and audit are evaluated by Sovereign Core, not by the model.
8. A failed execution cannot be retried with changed financial parameters under the old approval.

## Flow 1: `earn.calculate_earnings`

### Semantics

Pure read/compute operation over an immutable earnings snapshot. It must have no Firestore writes, payment API calls, ledger mutations, or other side effects.

### Input

```json
{
  "earnings_snapshot_id": "string",
  "user_id": "string",
  "period": { "start": "ISO-8601", "end": "ISO-8601" },
  "options": {}
}
```

The runtime must reject unknown security-sensitive fields. Free-form action, approval, policy, payout, or execution fields are not part of the contract.

### Output

```json
{
  "calculation_id": "string",
  "earnings_snapshot_id": "string",
  "earnings_snapshot_version": "string",
  "calculation_version": "string",
  "amount": "decimal-string",
  "breakdown": [],
  "is_verified": false,
  "authorization_state": "none",
  "run_id": "string",
  "tool_call_id": "string",
  "trace_ref": "string"
}
```

`is_verified` must remain `false` for the calculation result. `authorization_state` must remain `none`. Neither field is agent-settable.

### Guardrails

- One bounded calculation operation per flow.
- Same snapshot/version/options should produce the same result, or a distinct attempt must be explicitly versioned.
- Embedded instructions such as `"also pay this invoice"` are data, not executable instructions.
- A calculation result may feed payout preparation only after a separate deterministic verification step.
- A successful calculation means calculation and audit completed; it never means money moved.

## Flow 2: `earn.prepare_payout` vs `execute_payout`

### Agent-visible `earn.prepare_payout`

Produces a payout request object only. It does not call payment rails and does not create authorization.

```json
{
  "payout_request_id": "string",
  "calculation_reference": "string",
  "amount": "decimal-string",
  "currency": "string",
  "beneficiary_id": "string",
  "policy_checks": [],
  "risk_flags": [],
  "state": "prepared"
}
```

The amount, beneficiary, calculation reference, and policy context become immutable request data once the authoritative payout request is created.

### Core-only `execute_payout`

Conceptual input:

```json
{
  "payout_request_id": "string",
  "approval_id": "string"
}
```

The runtime resolves both objects server-side, verifies their relationship, re-evaluates policy and limits, verifies environment and beneficiary allowlists, checks velocity/transaction caps, and only then dispatches to the payment/ledger adapter.

### Approval artifact

```json
{
  "approval_id": "string",
  "payout_request_id": "string",
  "approved_by": "string",
  "approved_at": "ISO-8601",
  "approval_scope": "string",
  "approval_hash": "sha256",
  "state": "approved"
}
```

The approval hash must cover the exact payout request payload the approver authorized. Changing amount, currency, beneficiary, calculation reference, or other approval-scoped data invalidates the approval.

### Execution invariants

- `payout_request_id + approval_id` is executable at most once.
- Successful execution consumes the approval and records the execution outcome durably.
- A failed execution does not authorize modified parameters.
- Any changed financial parameter requires a new payout request and fresh approval.
- Agent labels such as `review`, `safe`, or `approved` cannot change capability classification.
- Splitting a prohibited payout into smaller requests must still be caught by velocity, aggregate, and policy limits.

## Required adversarial tests

1. Calculation input contains payout instructions in descriptive fields: ignored as instructions.
2. Agent redefines `DONE` as payment execution: runtime still treats calculation as calculation-only.
3. Agent submits `is_verified: true`: rejected/ignored; runtime remains authoritative.
4. Agent submits `authorization_state: approved`: rejected/ignored.
5. Agent changes amount after approval: denied.
6. Agent changes beneficiary after approval: denied.
7. Agent changes currency after approval: denied.
8. Agent supplies `approved_by` or `approval_hash`: never authoritative.
9. Unknown approval ID: denied.
10. Approval for another payout request: denied.
11. Consumed approval: denied.
12. Expired/rejected approval: denied.
13. Agent renames a payout operation to `review`: high-risk capability mapping still applies.
14. Large payout split into smaller requests: aggregate/velocity policy blocks when limits are exceeded.
15. Execution retry with modified amount or beneficiary: requires fresh approval.
16. Missing audit before execution: privileged action fails closed.
17. Direct agent attempt to invoke payment adapter: unavailable through the public agent tool surface.

## Handoff requirements

A handoff may pass references and summaries, but never transfers authority. Capabilities can only narrow:

`child_capabilities ⊆ source_capabilities`

Parent approvals are never implicitly reusable by the child. Any privileged action in the child run must satisfy the Core approval contract independently.
