# Staging Rollback Runbook

## Trigger rollback when

- approval/execution trust boundary is violated
- audit identifiers are missing or inconsistent
- a restricted action executes without valid approval
- terminal run state can be reopened
- critical browser QA regression is discovered after deployment

## Procedure

1. Stop further staging promotion.
2. Preserve the release evidence and audit trail.
3. Revert the staging deployment to the last verified candidate.
4. Re-run Agent-Core tests and quality gates.
5. Verify the operator smoke flow.
6. Record incident, release SHA, rollback SHA, and operator.
7. Do not re-promote until the failed gate has evidence of remediation.

## Abort principle

Rollback is preferred over bypassing a failed policy, approval, audit, or release gate.
