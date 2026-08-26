# Agent Core v1 — Trust Boundary Hardening

Privileged tool execution has one enforcement path: `ToolRuntime.executeTool(request, context)`.

The runtime performs, in order:

1. agent registration and active-state lookup
2. skill registration and agent binding lookup
3. optional validation of a server-issued co-pilot override approval
4. server-held policy evaluation
5. authoritative approval validation when required
6. allowlisted registry tool resolution
7. pre-execution audit emission; privileged execution fails closed if it cannot be recorded
8. one-shot approval consumption
9. tool dispatch
10. success/failure audit emission

`createToolRequest()` is untrusted normalization only. It does not accept or preserve caller approval state.

Approvals are server-created artifacts bound to `runId`, `agentId`, `toolCallId`, `skillId`, `capability`, `action`, and a SHA-256 hash of arguments. They expire and are single-use.

A `co_pilot_override` is also a server-created approval artifact. The caller cannot obtain it by merely setting `agentRole: "co-pilot"` or `intent: "co_pilot_override"` in untrusted payload data. The orchestrator validates the trusted co-pilot actor, validates the registered agent/skill/tool, records the reason and args hash, and issues a short-lived approval. The runtime recognizes only that server-issued artifact and consumes it once.

A valid co-pilot override may supersede the normal policy decision for the exact approved request, including an otherwise denied policy decision. It does not authorize unknown agents, unauthorized skills, unregistered tools, changed arguments, or a different tool call.

The current Agent Core branch does not yet contain a dedicated persistent budget ledger/cost accounting subsystem. Budget enforcement must therefore not be claimed as implemented until such a subsystem is added and wired into the same runtime gate.

No Skills v1 work should begin until the hardened Agent Core suite passes in Node 22 CI.
