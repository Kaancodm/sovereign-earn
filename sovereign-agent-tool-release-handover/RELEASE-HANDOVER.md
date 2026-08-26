# Sovereign Agent Tool — Release Handover

## Release status

**NOT RELEASED / NOT PRODUCTION-READY**

This handover is an evidence record for the Agent Core MVP candidate. It must not be interpreted as approval to deploy the Agent Core harness to production.

## Source of truth

- Repository: `sovereign-earn`
- Release candidate branch: `release-handover/agent-core-mvp`
- Verified implementation commit: `174b91e6de6fe0ceb5f5099f692f729e16d2737b`
- Production base commit: `59fe01a7df7f1d51dd2da3f9bba5e4e1d3b491cf`
- Production `main` remains the production source of truth.
- The Agent Core harness remains off production until the remaining release gates pass.

## What is present

The candidate contains the MVP harness components and tests, including approval, contracts, audit, handoff, orchestrator, MVP runtime and end-to-end test files.

The candidate also contains persistent PostgreSQL approval and budget components with dedicated integration and adversarial test workflows.

## Verified evidence

The exact verified implementation commit `174b91e6de6fe0ceb5f5099f692f729e16d2737b` produced successful GitHub Actions runs for:

- Sovereign Agent Core Tests — success.
- Quality Gates — success.
- Sovereign PostgreSQL Approval Tests — success.
- Sovereign PostgreSQL Adversarial Approval Tests — success.
- Sovereign PostgreSQL Budget Tests — success.

The PostgreSQL adversarial suite explicitly covers replay after consumption, argument mutation against the approved argument hash, and identity substitution for agent/run request binding.

The PostgreSQL approval integration covers persistent create/get/assertUsable behavior, expiry rejection and single-use/concurrency behavior. The budget integration covers persistent reservation/consumption and concurrent enforcement of the configured limit.

## Release evidence classification

### Implemented / verified

- Agent Core approval, contracts, audit, orchestrator/runtime, handoff and MVP modules.
- Dedicated `test:agent-core` command and Node 22 CI execution.
- PostgreSQL approval-store adapter using an atomic single-use consumption boundary.
- PostgreSQL approval schema with state and consumption invariants.
- Persistent budget ledger and PostgreSQL budget schema.
- Real PostgreSQL approval integration tests.
- Real PostgreSQL adversarial replay, argument-mutation and identity-substitution tests.
- Real PostgreSQL budget integration and concurrency tests.
- Candidate repository Quality Gates.

### Not verified by this handover

- Strict TypeScript compile. The Agent Core implementation is JavaScript.
- Production-grade staging deployment of the Agent Core harness.
- Browser/operator post-deployment staging verification.
- Production configuration validation for the Agent Core runtime.
- Independent security sign-off.
- Production approval.

## Release gates

| Gate | Status | Evidence rule |
|---|---|---|
| Design reviewed | PARTIAL | Architecture material exists; release approval not proven. |
| Code implemented | PASS | Agent Core, PostgreSQL approval and budget components are present. |
| Strict TypeScript compile | NOT VERIFIED | Current Agent Core implementation is JavaScript; no strict TypeScript compile evidence. |
| Unit tests | PASS | Agent Core CI is green on the verified implementation commit. |
| Integration tests | PASS | Real PostgreSQL approval and budget integration workflows are green. |
| Concurrency tests | PASS | In-memory and real PostgreSQL approval/budget concurrency evidence exists. |
| Adversarial PostgreSQL tests | PASS | Replay, argument mutation and identity substitution tests are green. |
| Persistent PostgreSQL approval | PASS | Real PostgreSQL integration and concurrency evidence passed. |
| Persistent budget boundary | PASS | Real PostgreSQL reservation/consumption and concurrency evidence passed. |
| CI green | PASS | All five candidate workflows listed above passed on the verified implementation commit. |
| Config validated | NOT VERIFIED | Repository checks are not equivalent to production Agent Core configuration validation. |
| Staging deployed | NOT VERIFIED | No verified Agent Core staging deployment evidence is recorded. |
| Browser/operator staging verified | NOT VERIFIED | No retained real-browser/operator smoke evidence is recorded. |
| Security sign-off | NOT VERIFIED | No independent release security sign-off is recorded. |
| Production approved | NO | Explicitly not approved. |

## Security boundary

Privileged execution must remain fail-closed. The release candidate must not bypass authoritative policy, governance, approval, budget, audit, registry or runtime controls through caller-supplied state.

A human/co-pilot override must not be treated as an unconditional production bypass. Any override mechanism remains subject to exact-request binding, persistent approval/budget controls, auditability and release security review.

## Disabled until proven

Do not enable autonomous payout, destructive self-delete, or autonomous external upload as a production capability from this handover alone.

## Required next evidence

1. Produce a real staging deployment of the Agent Core candidate in an isolated non-production environment.
2. Run and retain post-deployment operator/browser smoke and end-to-end evidence.
3. Validate production-equivalent runtime configuration without enabling production execution.
4. Obtain security sign-off against the exact final candidate.
5. Re-run all release gates against the exact implementation candidate selected for release.
6. Only after all required gates pass may the status move from `NOT RELEASED` to a release-approved state.

## Final decision

**Current candidate: CI-verified MVP / release candidate, not a production release.**

Until staging evidence exists, the correct release statement is:

> REAL STAGING EVIDENCE NOT VERIFIED
