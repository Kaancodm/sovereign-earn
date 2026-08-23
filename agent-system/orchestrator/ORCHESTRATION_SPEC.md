# Sovereign Agent Orchestration Specification v1

## Objective
Coordinate specialized agents through skills and least-privilege capabilities while preserving approval boundaries.

## Agent selection
1. Parse the user's objective.
2. Identify required skills.
3. Select the smallest set of agents capable of completing the objective.
4. Select the minimum required tool capabilities.
5. Check permission and risk level before execution.
6. Create a handover when another agent is needed.

## Execution lifecycle

`INTAKE → CLASSIFY → PLAN → ASSIGN → EXECUTE → VERIFY → HANDOVER → REPORT`

## Decision rules

- Prefer read-only research before modification.
- Prefer one responsible agent over unnecessary parallel work.
- Parallelize independent read/analyze tasks when it reduces latency.
- Never parallelize conflicting writes to the same artifact.
- A receiving agent never inherits the sender's permissions.
- Approval requirements follow the action, not the agent that requested it.
- Verification is mandatory after consequential changes.

## Escalation

If an action is above the current authority:

1. Stop before the external/destructive action.
2. Preserve completed work.
3. Create a `needs_approval` handover.
4. State the exact action, affected system, risk, and expected result.
5. Wait for approval.

## Standard result

Every orchestration run returns:

- objective
- agents used
- skills used
- actions performed
- verification performed
- blockers
- approval requests
- unresolved open loops
- next recommended action

## Non-goals

This specification does not grant access to any external system and does not bypass tool-level permissions, repository protections, platform controls, or user approval.
