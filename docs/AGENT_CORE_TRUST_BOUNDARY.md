# Agent Core v1 — Trust Boundary Hardening

Privileged tool execution has one enforcement path: `ToolRuntime.executeTool(request, context)`.

The runtime performs, in order:

1. agent registration and active-state lookup
2. skill registration and agent binding lookup
3. server-held policy evaluation
4. authoritative approval validation when required
5. allowlisted registry tool resolution
6. pre-execution audit emission; privileged execution fails closed if it cannot be recorded
7. tool dispatch
8. success/failure audit emission
9. approval consumption after successful execution

`createToolRequest()` is untrusted normalization only. It does not accept or preserve caller approval state.

Approvals are server-created artifacts bound to `runId`, `agentId`, `toolCallId`, `skillId`, `capability`, `action`, and a SHA-256 hash of arguments. They expire and are single-use.

No Skills v1 work should begin until the hardened Agent Core suite passes in Node 22 CI.
