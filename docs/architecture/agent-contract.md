# Agent Core Contract v1

```text
AgentRequest
- contractVersion
- requestId
- correlationId
- actor
- agentId
- capability
- input
- context
- constraints
- deadline

AgentResult
- contractVersion
- requestId
- correlationId
- agentId
- status
- output
- handover
- error
- telemetry
```

## Lifecycle

`created -> authorized -> running -> waiting|handover -> completed|failed|cancelled`

## Rules

- Requests must be idempotency-aware.
- Authorization occurs before execution and at tool boundaries.
- Context is explicitly scoped; agents do not inherit arbitrary hidden state.
- Errors are structured and safe for logs/client display.
- Contract changes require a version bump and compatibility tests.
