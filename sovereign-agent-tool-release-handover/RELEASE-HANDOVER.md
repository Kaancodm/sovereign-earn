# Sovereign Agent Tool — Release Handover

## Release status

**NOT RELEASED / NOT PRODUCTION-READY**

This handover is an evidence record for the agent-core MVP branch. It must not be interpreted as approval to deploy the agent-core harness to production.

## Source of truth

- Repository: `sovereign-earn`
- Release candidate branch: `release-handover/agent-core-mvp`
- Base implementation branch: `agent-core-trust-boundary-hardening`
- Production `main` was reviewed before the release branch was created.
- `main` explicitly keeps the agent-core harness off production.

## What is present

The agent-core branch contains the MVP harness components and tests, including approval, contracts, audit, handoff, orchestrator, MVP runtime and end-to-end test files.

The branch package metadata exposes a dedicated `test:agent-core` command using Node's test runner. The repository also retains the existing syntax and staging checks.

The candidate now also contains a PostgreSQL approval-store adapter and SQL schema. These are implementation artifacts only until exercised against a real PostgreSQL instance.

## Release evidence classification

### Implemented / present in repository

- Agent-core approval module and approval tests.
- Agent-core contracts and contract tests.
- Agent-core orchestration/runtime components.
- Agent-core handoff module and tests.
- Agent-core MVP module and tests.
- Agent-core end-to-end test file.
- Dedicated `test:agent-core` script.
- Candidate concurrency test covering concurrent single-use consumption and consumed-approval rejection.
- PostgreSQL approval-store adapter using an atomic `UPDATE ... WHERE state = 'APPROVED'` consumption boundary.
- PostgreSQL schema with approval state constraints and consumption timestamp invariant.

### Verified evidence

- Agent Core CI previously passed the agent-core suite with 39/39 tests on the PR merge commit.
- Candidate Quality Gates previously passed.
- The PostgreSQL adapter and schema have been added, but their behavior is not yet verified against a real PostgreSQL database.

### Not verified by this handover

- Real PostgreSQL integration test execution.
- PostgreSQL concurrency test against a real database.
- Persistent budget reservation/consumption boundary.
- Production deployment.
- Production staging evidence for the agent-core harness.
- Security sign-off.
- Production approval.

## Release gates

| Gate | Status | Evidence rule |
|---|---|---|
| Design reviewed | PARTIAL | Architecture material exists; release approval not proven. |
| Code implemented | PRESENT | Agent-core modules and tests are present on the candidate branch. |
| Strict TypeScript compile | NOT VERIFIED | Current agent-core implementation is JavaScript; no strict TypeScript compile evidence. |
| Unit tests | PASS | 39/39 Agent Core tests passed on the reviewed PR merge commit. |
| Integration tests | NOT VERIFIED | Real PostgreSQL integration is still missing. |
| Concurrency tests | PASS | 39/39 Agent Core CI included the concurrent single-use consumption test. |
| Adversarial tests | PARTIAL | Existing boundary tests cover multiple adversarial cases; complete release evidence is not recorded. |
| Persistent PostgreSQL approval | IMPLEMENTED / NOT VERIFIED | Adapter and schema exist; real database execution is required. |
| Persistent budget boundary | NOT IMPLEMENTED / NOT VERIFIED | No production-grade persistent budget reservation/consumption evidence. |
| Adversarial replay under PostgreSQL | NOT VERIFIED | Requires real database test execution. |
| CI green | PASS | Candidate Quality Gates and Agent Core CI have passed on reviewed candidate history. |
| Config validated | NOT VERIFIED | Existing repository checks are not equivalent to agent-core production validation. |
| Staging deployed | NOT VERIFIED | No agent-core staging deployment evidence recorded. |
| Staging verified | NOT VERIFIED | No verified staging logs/evidence recorded. |
| Production approved | NO | Explicitly not approved. |

## Security boundary

Privileged execution must remain fail-closed. The release candidate must not bypass authoritative policy, governance, approval, budget, audit, registry or runtime controls through caller-supplied state.

A human/co-pilot override must not be treated as an unconditional production bypass. Any override mechanism must remain subject to the release security review and exact-request binding requirements.

## Disabled until proven

Do not enable autonomous payout, destructive self-delete, or autonomous external upload as a production capability from this handover alone.

## Required next evidence

1. Add a real PostgreSQL integration-test harness and run it against PostgreSQL 15+.
2. Verify atomic concurrent consumption with two database-backed consumers and assert exactly one success.
3. Add persistent budget reservation/consumption with an atomic database boundary and test insufficient funds, duplicate reservation and concurrent reservation.
4. Add PostgreSQL replay/argument-mutation/identity-substitution tests.
5. Produce real staging deployment evidence and post-deployment verification logs.
6. Re-run all release gates against the exact candidate commit.
7. Only after all gates pass may the status move from `NOT RELEASED` to a release-approved state.

## Final decision

**Current candidate: MVP implementation / review candidate, not a production release.**

If staging evidence is missing, the correct release statement is:

> REAL STAGING EVIDENCE NOT VERIFIED
