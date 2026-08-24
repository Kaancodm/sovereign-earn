# Sovereign Agent Tool — Release Candidate 121–140

## Purpose

This block turns the existing staging package into an explicit promotion contract. It does not add a second execution path.

## Gates

1. Manifest schema is valid.
2. Product and release line are correct.
3. Execution boundary is explicitly declared.
4. Operator evidence requirements are enumerated.
5. Promotion is fail-closed.
6. Real browser evidence is mandatory for promotion.
7. Structural CI validation may pass while browser promotion remains blocked.

## Required browser evidence

- Operator dashboard visible.
- Approval action visible.
- Execution result visible.
- Audit ID visible beside the result.
- Restricted/policy-blocked state visible.
- Mobile layout checked.

The screenshots supplied during design review are treated as **design reference**, not browser execution evidence. They therefore do not satisfy the promotion gate.

## Commands

- `npm run check:release-candidate` validates the manifest contract.
- `npm run check:release-promotion` intentionally fails until browser evidence is recorded as `PASS`.
- `npm run test:release` covers the staging gate and release-candidate contract.

## Security invariant

No operator UI, release check, or evidence mechanism may execute a tool directly. Tool execution remains behind the established Agent Core / ToolRuntime boundary.
