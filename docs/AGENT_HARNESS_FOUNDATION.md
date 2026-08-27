# Agent Harness Foundation

## Purpose

The Sovereign Agent Harness is the delivery coordinator above Agent Core. It is intended to move a project from an initial idea to verified production delivery while preserving the existing trust boundary.

## Architecture

```text
Idea / Operator
      |
      v
Agent Harness
  | plan / route / collect evidence
  v
Agents + Skills
      |
      v
Sovereign Agent Core
  | registry -> policy -> budget -> approval -> audit -> dispatch
  v
Allowlisted tools / CI / deployment systems
```

The harness never calls privileged tools around Agent Core. It coordinates requests into the existing governed execution boundary.

## Foundation scope

This first slice intentionally contains only the lifecycle and governance contract. It does not alter Firebase Functions, payment paths, Firestore rules, or production deployment configuration.

## Next implementation slice

1. Add a typed/validated run manifest for project objective, constraints, stage and evidence.
2. Add deterministic lifecycle transitions with fail-closed invalid transition handling.
3. Add planner output contract for tasks, dependencies, tools and risk.
4. Bind executable tasks to Agent Core requests rather than direct tool calls.
5. Add verification aggregation so release status is derived from evidence.
6. Add tests for lifecycle, privilege bypass attempts and missing release evidence.
7. Wire CI for the harness tests before adding deployment adapters.

## Production gate

Production deployment is not enabled by this foundation. It remains blocked until implementation, tests, security checks, rollback evidence and explicit production approval exist.
