# Sovereign Agent Tool — Release Handover

## Release status

**NOT RELEASED / NOT PRODUCTION-READY**

This handover is an evidence record for the agent-core MVP candidate. It must not be interpreted as approval to deploy the agent-core harness to production.

## Source of truth

- Repository: `sovereign-earn`
- Release candidate branch: `release-handover/agent-core-mvp`
- Base implementation branch: `agent-core-trust-boundary-hardening`
- Production `main` remains the production source of truth.
- The agent-core harness remains off production until the remaining release gates pass.

## What is present

The candidate contains the MVP harness components and tests, including approval, contracts, audit, handoff, orchestrator, MVP runtime and end-to-end test files.

The candidate also contains persistent PostgreSQL approval and budget components with dedicated integration-test workflows.

## Release evidence classification

### Implemented / present in repository

- Agent-core approval module and approval tests.
- Agent-core contracts and contract tests.
- Agent-core orchestration/runtime components.
- Agent-core handoff module and tests.
- Agent-core MVP module and tests.
- Dedicated `test:agent-core` script.
- PostgreSQL approval-store adapter using an atomic `UPDATE ... WHERE state = 'APPROVED'` consumption boundary.
- PostgreSQL approval schema with state and consumption invariants.
- Persistent budget ledger with atomic reservation and consumption boundaries.
- PostgreSQL budget schema with database-side total-limit invariant.
- Real PostgreSQL integration-test workflows for approval and budget boundaries.

### Verified evidence

- Agent Core CI passed on the current candidate test-suite structure.
- Candidate Quality Gates passed.
- Real PostgreSQL approval integration passed against PostgreSQL 16, including create/get/assertUsable, expiry rejection and concurrent single-use consumption with exactly one successful consumer.
- Real PostgreSQL budget integration passed against PostgreSQL 16, including limit enforcement, concurrent reservations that remain within the limit, and atomic reservation-to-spent consumption.

### Not verified by this handover

- Strict TypeScript compile.
- Complete adversarial replay/argument-mutation/identity-substitution coverage against PostgreSQL.
- Production-grade staging deployment of the agent-core harness.
- Staging post-deployment verification.
- Security sign-off.
- Production approval.

## Release gates

| Gate | Status | Evidence rule |
|---|---|---|
| Design reviewed | PARTIAL | Architecture material exists; release approval not proven. |
| Code implemented | PASS | Agent-core, PostgreSQL approval and budget components are present. |
| Strict TypeScript compile | NOT VERIFIED | Current agent-core implementation is JavaScript; no strict TypeScript compile evidence. |
| Unit tests | PASS | Current Agent Core CI is green. |
| Integration tests | PASS | Real PostgreSQL approval and budget integration workflows are green. |
| Concurrency tests | PASS | In-memory and real PostgreSQL approval/budget concurrency evidence exists. |
| Adversarial tests | PARTIAL | Existing boundary tests are present; full PostgreSQL adversarial replay/mutation coverage is not yet verified. |
| Persistent PostgreSQL approval | PASS | Real PostgreSQL integration and concurrency evidence passed. |
| Persistent budget boundary | PASS | Real PostgreSQL reservation/consumption and concurrency evidence passed. |
| Adversarial replay under PostgreSQL | NOT VERIFIED | Requires dedicated replay/mutation/identity-substitution evidence. |
| CI green | PASS | Candidate Agent Core, Quality Gates, PostgreSQL Approval and PostgreSQL Budget workflows passed. |
| Config validated | NOT VERIFIED | Existing repository checks are not equivalent to agent-core production validation. |
| Staging deployed | NOT VERIFIED | No verified agent-core staging deployment evidence recorded. |
| Staging verified | NOT VERIFIED | No verified staging post-deployment logs recorded. |
| Production approved | NO | Explicitly not approved. |

## Security boundary

Privileged execution must remain fail-closed. The release candidate must not bypass authoritative policy, governance, approval, budget, audit, registry or runtime controls through caller-supplied state.

A human/co-pilot override must not be treated as an unconditional production bypass. Any override mechanism must remain subject to release security review and exact-request binding requirements.

## Disabled until proven

Do not enable autonomous payout, destructive self-delete, or autonomous external upload as a production capability from this handover alone.

## Required next evidence

1. Add and run PostgreSQL replay/argument-mutation/identity-substitution tests.
2. Produce real staging deployment evidence for the agent-core harness.
3. Run post-deployment staging smoke/E2E verification and retain logs.
4. Validate production configuration and runtime controls.
5. Obtain security sign-off.
6. Re-run all release gates against the exact final candidate commit.
7. Only after all required gates pass may the status move from `NOT RELEASED` to a release-approved state.

## Final decision

**Current candidate: verified MVP / release candidate, not a production release.**

If staging evidence is missing, the correct release statement is:

> REAL STAGING EVIDENCE NOT VERIFIED
