# Harness P0

P0 is the minimum production-grade harness foundation. It is complete only when all seven contracts are implemented and enforced by tests.

1. Context Contract — deterministic, versioned run manifest and data classification.
2. Governance/Mode — server-owned identity, scopes, mode, and risk gates.
3. Budget Engine — bounded turns, handoffs, tool calls, runtime, tokens, and monetary exposure.
4. Failure/Recovery — typed failures, bounded retries, manual-review paths, replay protection, and fail-closed privileged audit.
5. Tracing — stable trace/run/tool identifiers and typed decision events.
6. Session Lifecycle — Orient → Context → Baseline → Execute → Verify → Audit → Close.
7. Harness E2E Gate — Node 22 CI plus canonical staging flows.

## P0 exit criteria

- No agent-controlled field can become authoritative identity, policy, approval, budget, or dispatch state.
- Privileged execution has one unavoidable runtime path.
- Security failures do not retry automatically.
- Privileged actions fail closed when durable audit cannot be recorded.
- Context, governance, budget, failure, tracing, and lifecycle contracts have adversarial tests.
- CI is green under Node 22.

P1 begins only after these conditions are met.
