# Sovereign-Earn P1 Release Plan

## Gate
P1 starts only after the Node 22 Agent Core/Skills v1 workflow is green.

## P1.1 — earn.review

The first production-shaped flow is read/compute-only.

Invariants:
- input references an immutable earnings snapshot;
- snapshot version and calculation version are explicit;
- no Firestore mutation of earnings data;
- no payment API access;
- output is structured and explicitly unauthorized;
- calculation is auditable and traceable;
- repeated requests are deterministic or explicitly versioned as separate attempts;
- only a verified calculation reference can feed payout preparation.

## P1.2 — earn.prepare_payout

The agent may construct a payout request but cannot execute a payment.

Required request identity:
- payoutRequestId
- calculationId
- amount
- currency
- beneficiaryId
- policy context
- risk flags
- runId
- toolCallId
- version

Approval and execution remain Core-only.

## P1.3 — canonical staging run

Create one named, repeatable staging workflow:

`earn.review_and_prepare_payout_demo`

Expected terminal state:
- earnings calculation completed;
- payout request created;
- no money moved;
- complete audit and trace trail exists;
- policy and approval state are explicit;
- run closes deterministically.

## Explicit non-goals

P1 does not introduce:
- agent-controlled approvals;
- direct payment execution as an agent tool;
- inherited Handoff privileges;
- unrestricted external tools;
- production payment credentials.

## Exit criteria

P1 is complete when the canonical staging run is repeatable under CI/staging test data and demonstrates the complete Context → Governance → Budget → Policy → Tool → Verify → Audit → Close lifecycle.