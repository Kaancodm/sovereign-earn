# Sovereign Agent Tool — Hybrid Operator Command Center

## Design decision

Selected direction: **Hybrid of 1) Operator Command Center + 2) Release/Trust Dashboard + 3) Agent Run Control**.

The interface is optimized for three simultaneous operator questions:

1. **What needs my decision now?**
2. **What is the agent doing and what happened?**
3. **Can I trust the execution boundary and release state?**

## Visual hierarchy

### Header: Command + trust

- Product identity: Sovereign Agent Tool
- Current run / environment
- Co-Pilot presence and operator role
- Compact trust indicator
- Primary action: open pending approval

### KPI strip

Five compact cards:

- Active Runs
- Pending Approvals
- Completed
- Blocked
- Trust / Audit status

The KPI strip follows the stakeholder-friendly structure of the dashboard reference while keeping approval and execution state immediately visible.

### Main workspace

**Left:** Agent Run Control

- current run
- agent
- status
- next tool call
- risk level
- estimated cost
- run timeline

**Center:** Approval / execution decision card

- tool
- capability
- action
- parameters
- policy reason
- audit ID
- three explicit actions:
  - ABLEHNEN
  - CO-PILOT OVERRIDE
  - GENEHMIGEN

**Right:** Trust + release rail

- trust-boundary summary
- policy state
- audit state
- recent blocked/restricted events
- release gate status

### Bottom: E2E flow

A compact, icon-backed flow communicates the pipeline in seconds:

`Run → Discover → Approval → Execute → Result → Audit`

Each stage has a visible state and links to the corresponding detail panel.

## Key UX rule from the reference

`Execution Result + Audit ID` must be visible together. A successful operation therefore communicates both outcome and traceability without requiring a second screen.

Restricted operations such as `shell.exec` must display a strong `RESTRICTED` state and the policy/budget reason before any approval action is offered.

## Mobile behavior

The supplied reference is a mobile chat screenshot, but the selected product direction is a desktop-first operator console. Mobile uses the same hierarchy in this order:

1. Pending approval
2. Execution result + Audit ID
3. Current run
4. Trust boundary
5. E2E flow

The three approval actions remain persistent and thumb-accessible.

## Product-design source

The direction is grounded in the supplied reference screenshots and the requested hybrid selection. The implementation intentionally combines the stakeholder overview of Design 1, the state visibility of Design 2, and the actionable approval/run controls of Design 3.

## Non-negotiables

- No hidden Co-Pilot bypass.
- No execution outside ToolRuntime.
- No approval without policy/audit context.
- No successful execution result without its audit identifier.
- Earn/Firebase remains outside the Agent Tool product boundary.
