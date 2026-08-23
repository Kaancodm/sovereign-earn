# Sovereign Agent Core v1

This directory contains the non-production Agent Core harness.

## Enforcement path

`ToolRuntime.executeTool(request, context)` is the only execution boundary. It performs agent/skill lookup, server-held policy evaluation, authoritative approval validation, allowlisted tool resolution, audit emission, dispatch, and approval consumption.

`createToolRequest()` is input normalization only. Caller-supplied approval or policy fields are ignored for authorization.

Skills v1 is blocked until the hardened test suite passes in Node 22 CI.
