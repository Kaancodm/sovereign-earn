# Sovereign Agent Tool — Release Handover

## Repository

`Kaancodm/sovereign-earn`

## Product branch

`mvp/sovereign-agent-tool-product`

## Current release status

- Code: 🟢 implemented
- Release Contract: 🟢 present
- Browser Evidence: 🔴 required
- CI for PR #14: ⏳ pending
- PR #14: draft / not merged
- Promotion: 🔴 fail-closed

## Promotion gate

Promotion MUST remain blocked until real browser evidence has been captured and the required CI run for PR #14 has completed successfully.

## Browser evidence checklist

1. Dashboard loads in a real browser.
2. Agent Registry renders.
3. Tool Registry renders.
4. A tool request requiring approval is triggered.
5. `PENDING_APPROVAL` is visible.
6. APPROVE is verified.
7. REJECT is verified.
8. Co-Pilot Override is verified.
9. Audit entry is verified.
10. Evidence demonstrates that the product UI cannot manufacture an approval state or execute tools directly.

## Security boundary

```text
Product UI
    ↓
Product Adapter
    ↓
Agent Core Orchestrator
    ↓
Policy / Approval
    ↓
ToolRuntime.executeTool()
```

The Product Layer MUST NOT implement a second authorization path, directly execute tools, or manufacture `APPROVED` state. The Agent Core remains the authoritative security boundary.

## Known commits

- `23d5ba0fd16810b21af595748ed23ce1c6ba34e2`
- `a687ba14705f17b77b0a985516cfb23b55f7e446`

## Next action

Collect and attach real browser evidence, then wait for/verify CI for PR #14. Only after both gates pass should the PR be promoted toward merge and release.
