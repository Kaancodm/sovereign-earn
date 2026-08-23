# Sovereign Agent Orchestration Specification v1

## Objective
Coordinate specialized agents through skills and least-privilege capabilities while preserving approval boundaries, evidence, and handover state.

## Execution lifecycle

`INTAKE → CLASSIFY → PLAN → SELECT_AGENT → SELECT_SKILL → CAPABILITY_CHECK → PERMISSION_CHECK → APPROVAL_GATE → EXECUTE → VERIFY → HANDOVER → REPORT`

## Routing rules

1. Parse the user's objective and define scope.
2. Classify the task by domain.
3. Select the smallest set of agents capable of completing it.
4. Select the minimum skill set and tool capabilities required.
5. Check permission and risk before every consequential action.
6. If approval is required, stop before the external/destructive action.
7. Execute only permitted actions.
8. Verify consequential changes independently where practical.
9. Create a structured handover when another agent is needed.
10. Return the result with evidence, failures, blockers, and open loops.

## Decision rules

- Read-only research and analysis may run autonomously within scope.
- Drafting may run autonomously when it has no external side effect.
- Repository changes should use a working branch; production changes require approval.
- External communication requires approval before sending.
- Production deployment requires approval.
- Secret, credential, billing, permission, or destructive changes require explicit approval.
- Missing capability or permission means stop; never bypass the boundary.
- Failed verification must never be reported as success.
- Parallelize independent read/analyze work when useful; never parallelize conflicting writes to the same artifact.

## Escalation

If an action exceeds current authority:

1. Stop before the consequential action.
2. Preserve completed work.
3. Create a `needs_approval` handover.
4. State the exact action, affected system, risk, evidence, and expected result.
5. Wait for approval.

## Context integrity

A handover transfers context, not authority. Preserve facts, assumptions, recommendations, evidence, open loops, and approval state.

## Standard result

Every orchestration run returns:

- objective
- agents used
- skills used
- capabilities requested
- actions performed
- verification performed
- approval requests and decisions
- blockers
- unresolved open loops
- next recommended action

## Non-goals

This specification does not grant access to any external system and does not bypass tool-level permissions, repository protections, platform controls, or user approval.
