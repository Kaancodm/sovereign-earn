# Sovereign Agent Tool — Product Layer

This directory is the product-facing adapter boundary for the Sovereign Agent Tool.

## Boundary

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

The product layer MUST NOT implement its own authorization, policy bypass, or tool execution path. The Agent Core remains the authoritative security boundary.

## Planned adapter surfaces

- runs
- approvals
- agents
- tools
- audit

The first MVP implementation will expose read-oriented product contracts before adding mutating UI actions.
