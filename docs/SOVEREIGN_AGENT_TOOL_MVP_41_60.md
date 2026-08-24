# Sovereign Agent Tool MVP — Schritte 41–60

## 41–45 — Tool Interface

- Stable discovery API via `discover()`.
- Stable single-tool metadata via `describe()`.
- Registry is the authoritative discovery source.
- Tool metadata exposes capability, action, risk and approval requirement.
- Unknown tools remain undiscoverable and non-executable.

## 46–50 — Operator / Co-Pilot

- Approval state is exposed through `approvalStatus()`.
- Explicit approval is available through `approve()`.
- Explicit rejection is available through `reject()`.
- Co-Pilot override continues through the existing trust boundary.
- Approval remains bound to the exact tool request and is one-shot at execution.

## 51–55 — MVP Product Surface Contract

The MVP now has a minimal programmatic surface for:

1. starting a run,
2. discovering tools,
3. describing a tool,
4. authorizing a request,
5. requesting a Co-Pilot override,
6. inspecting approval status,
7. approving/rejecting an approval,
8. executing a tool.

No UI claims are made here; this is the backend/product contract that a UI can consume.

## 56–60 — Release Gate

- Regression tests added for discovery, operator decisions and blocked execution.
- Existing Agent Core CI remains the verification authority.
- Security boundary is preserved: registry → policy/approval → audit → runtime → tool.
- Earn/Firebase remain outside this Agent Tool boundary.
- Branch is isolated and will only merge after green CI and review.
