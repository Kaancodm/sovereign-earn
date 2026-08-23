# Agents

Shared agent-system boundary for sovereign-earn.

## Intended structure

```text
agents/
  core/          Agent Core contracts and lifecycle
  registry/      Agent identity and capability registry
  orchestrator/  Routing and execution control
  handover/      Versioned handover protocol
  tools/         Capability-scoped tool gateway
  specialists/   Specialist implementations
```

Specialists must depend on shared contracts rather than implementing independent orchestration, authentication or tool authorization.