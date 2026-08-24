# Browser/Product QA — Sovereign Agent Tool

Status: **BLOCKED UNTIL REAL-BROWSER EVIDENCE**

This document is a release gate, not a claim that browser QA has already passed.

## Required checks

1. Open Operator Command Center on desktop.
2. Confirm KPI strip and current run state are visible.
3. Start a run and verify the run timeline.
4. Trigger a tool requiring approval.
5. Confirm `PENDING_APPROVAL` is visually unambiguous.
6. Verify `ABLEHNEN`, `CO-PILOT OVERRIDE`, and `GENEHMIGEN` are distinct actions.
7. Execute an approved action.
8. Confirm `Execution Result` and `Audit ID` are adjacent.
9. Verify blocked/restricted state explains the policy or budget reason.
10. Verify terminal state cannot be reopened from the UI.
11. Repeat the critical flow on mobile width.
12. Capture screenshots/video and attach evidence to the release PR.

## Pass criteria

All 12 checks pass in a real browser, with evidence attached to the release candidate. A code-only CI pass does not satisfy this gate.
