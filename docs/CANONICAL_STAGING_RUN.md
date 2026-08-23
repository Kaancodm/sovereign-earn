# Canonical Staging Run

## Name

`earn.review_and_prepare_payout_demo`

## Purpose

Provide one deterministic, repeatable staging run that proves the Sovereign-Earn harness can process an earnings review and prepare a payout request without executing a payment.

## Lifecycle

1. Orient and load the server-owned context manifest.
2. Validate identity, environment, mode, policy version, and budget.
3. Resolve the registered `earn.review` capability/action.
4. Calculate earnings from an immutable test snapshot.
5. Verify the calculation and preserve its versioned reference.
6. Resolve `earn.prepare_payout` only from the verified calculation reference.
7. Produce a payout request containing exposure fields and policy/risk metadata.
8. Do not dispatch any payment execution capability.
9. Emit audit and trace events for each decision and tool call.
10. Close the session with an explicit terminal state.

## Assertions

- No agent-supplied approval can authorize execution.
- No payout execution function is exposed to the agent.
- Calculation output remains unauthorized until independently verified.
- Payout preparation cannot mutate earnings records or call payment rails.
- Tool resolution is allowlisted and server-owned.
- A missing policy, governance decision, budget, audit event, or required approval fails closed.
- Every run has a unique `runId` and complete audit/trace references.
- A handoff, if introduced later, starts a new run and receives no inherited approval.

## Expected result

`SUCCESS_PREPARED_NO_PAYMENT`

This run is a staging proof only. It must never be interpreted as evidence that a payout was executed.