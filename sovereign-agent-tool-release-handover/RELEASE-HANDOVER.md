# Sovereign Agent Tool — Release Handover

## Release status

**NOT RELEASED / NOT PRODUCTION-READY**

This handover is an evidence record for the agent-core MVP branch. It must not be interpreted as approval to deploy the agent-core harness to production.

## Source of truth

- Repository: `Kaancodm/sovereign-earn`
- Release candidate branch: `release-handover/agent-core-mvp`
- Base implementation branch: `agent-core-trust-boundary-hardening`
- Base branch HEAD reviewed: `fb7ac56c08388cd8a934957746c58f5f0721ec8f`
- Production `main` HEAD reviewed: `59fe01a7df7f1d51dd2da3f9bba5e4e1d3b491cf`
- `main` explicitly keeps the agent-core harness off production.

## What is present

The agent-core branch contains the MVP harness components and tests, including approval, contracts, audit, handoff, orchestrator, MVP runtime and end-to-end test files.

The branch package metadata exposes a dedicated `test:agent-core` command using Node's test runner. The repository also retains the existing syntax and staging checks.

## Release evidence classification

### Implemented / present in repository

- Agent-core approval module and approval tests.
- Agent-core contracts and contract tests.
- Agent-core orchestration/runtime components.
- Agent-core handoff module and tests.
- Agent-core MVP module and tests.
- Agent-core end-to-end test file.
- Dedicated `test:agent-core` script.

### Not verified by this handover

- Successful execution of the full agent-core test suite.
- Successful integration/concurrency/adversarial test execution.
- PostgreSQL approval storage against a real PostgreSQL test database.
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
| Unit tests | NOT VERIFIED | Test files exist; execution result is not recorded here. |
| Integration tests | NOT VERIFIED | No real integration-test evidence recorded. |
| Concurrency tests | NOT VERIFIED | No passing concurrency evidence recorded. |
| Adversarial tests | NOT VERIFIED | No passing adversarial evidence recorded. |
| CI green | NOT VERIFIED | Workflow exists, but a passing run for this release candidate is not recorded here. |
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

1. Run the complete agent-core test suite and record the exact command and result.
2. Add/execute adversarial and concurrency coverage for approval replay, argument mutation, identity substitution and concurrent consumption/reservation.
3. Implement and verify the required persistent approval/budget boundary before claiming production readiness.
4. Produce real staging deployment evidence and post-deployment verification logs.
5. Re-run all release gates against the exact candidate commit.
6. Only after all gates pass may the status move from `NOT RELEASED` to a release-approved state.

## Final decision

**Current candidate: MVP implementation / review candidate, not a production release.**

If staging evidence is missing, the correct release statement is:

> REAL STAGING EVIDENCE NOT VERIFIED
