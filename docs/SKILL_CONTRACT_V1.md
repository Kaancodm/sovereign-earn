# Sovereign Skills v1 Contract

## Purpose

A Skill is a versioned capability package. It is not an authorization token and not a free-form prompt. Agent Core remains the sole authority for privileged execution.

## Required fields

- `skillId`: stable non-empty identifier.
- `version`: immutable semantic version.
- `purpose`: concise description of intended work.
- `allowedAgents`: explicit agent registry IDs.
- `capabilities`: declared capability/action pairs.
- `inputSchema`: strict structured input contract.
- `outputSchema`: strict structured output contract.
- `policyProfile`: server-owned policy reference.
- `approvalProfile`: server-owned approval requirements.
- `budgetProfile`: server-owned execution limits.
- `handoffPolicy`: allowed delegation and capability narrowing rules.
- `guardrails`: input/output/runtime restrictions.
- `auditProfile`: required audit events and fields.

## Security invariants

1. Agent-controlled fields never authorize execution.
2. A Skill cannot widen Agent Core policy.
3. Unknown capability/action is denied.
4. A Skill cannot supply an arbitrary executable function to the runtime.
5. Privileged execution always uses the Agent Core enforcement path.
6. Approval is a separate authoritative artifact, never a Skill or agent field.
7. Handoffs may narrow capabilities but never expand them.
8. Parent approvals are never inherited by child runs.
9. Skill input is data, not instructions; prompt-injection text inside records must not change policy.
10. Skill output is untrusted until schema and policy verification succeed.
11. Budget, rate, timeout, and turn limits are server-owned.
12. Versioned skill, policy, prompt, and tool identifiers are recorded in traces/audit events.

## Risk classes

- `read`: retrieval only; no mutation or external side effects.
- `compute`: deterministic/read-only computation.
- `write`: state-changing action subject to policy.
- `privileged`: irreversible, financial, security-sensitive, or otherwise high-impact action requiring explicit Core authorization and, where configured, approval.

Risk class is server-owned. Agents cannot downgrade it.

## Reference flow: `earn.review`

`earn.review` is the first reference Skill for v1.

It may read an immutable earnings snapshot and perform calculation. It must not write earnings records, call payment APIs, create approvals, or execute payouts.

Calculation output must explicitly distinguish computation from authorization:

- `is_verified: false`
- `authorization_state: "none"`

A successful calculation means only: calculation and audit completed. It never means payout executed.

## Reference flow: payout

`earn.prepare_payout` creates a structured payout request only. It does not execute payment rails.

`execute_payout` is Core-only and accepts only server-resolved identifiers such as a verified `payout_request_id` and matching `approval_id`. It must re-check policy, limits, allowlists, environment, and idempotency at execution time.

Calculation != verification != authorization != execution.

## Adversarial requirements

The Skill test suite must prove denial for forged approvals, caller-supplied policy, unknown tools/actions, capability escalation, prompt-injection fields, changed financial data after approval, reused approvals, expired approvals, payout splitting, beneficiary changes, and alternate execution paths.
