# Sovereign Agent Harness

This directory is the isolated foundation for turning an idea into a governed production delivery workflow.

## Goal

Provide one orchestration layer that can coordinate planning, implementation, verification, release preparation and deployment without bypassing the existing Sovereign Agent Core trust boundary.

## Non-negotiable boundaries

- Agent Core remains authoritative for tool registration, policy, budgets, approvals, audit and dispatch.
- The harness may propose and coordinate work; it must not create a second privileged execution path.
- Risky or irreversible actions remain fail-closed until explicitly approved by policy/operator controls.
- Production readiness must be evidence-based. A plan or generated artifact is not deployment evidence.
- Existing Firebase/Earn production behavior is not changed by this foundation.

## Initial lifecycle

1. `IDEA` — capture objective, constraints and success criteria.
2. `PLAN` — produce an executable work plan and identify required agents/tools.
3. `BUILD` — execute approved implementation tasks on an isolated branch/worktree.
4. `VERIFY` — run tests, security checks and product/browser evidence where required.
5. `RELEASE` — assemble release evidence and rollback instructions.
6. `DEPLOY` — perform only explicitly authorized deployment actions.
7. `OBSERVE` — collect runtime evidence and surface regressions.

## Initial operating modes

- `suggest`: planning and recommendations only.
- `prepare`: create proposed changes/evidence but do not deploy.
- `execute`: allow governed tool execution through Agent Core.

The default mode is `prepare`.
