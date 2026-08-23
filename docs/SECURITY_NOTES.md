# Security Notes — P0 Approval / Replay / Handoff Hardening

## P0 status

P0 remains GREEN at the contract/security-boundary level. The remaining verification gate is the executable Node 22 test/CI result for the current branch.

## Approval and exposure binding

Privileged approvals are bound to the exact runtime request. The approval store derives a canonical SHA-256 hash from the request arguments and additionally matches `runId`, `agentId`, `toolCallId`, `skillId`, `capability`, and `action`. Agent-supplied approval or hash fields are not authoritative.

An approval/exposure tuple is tracked as spent using `runId + toolCallId + argsHash`. Once consumed, a subsequent attempt is classified as `replay_detected` and is denied before tool dispatch. This also prevents a fresh approval from replaying an already-spent exposure.

## Runtime enforcement

The runtime itself performs registration lookup, policy evaluation, governance evaluation, budget consumption, authoritative approval validation, audit emission, allowlisted tool resolution, and dispatch. A privileged execution fails closed when the required audit event cannot be recorded.

## Handoff isolation

A handoff must create a new run and its own runtime context, governance decision, and policy authorization. Privileges and approvals are not inherited from the source run. The target agent must independently satisfy its registration, scope, policy, governance, budget, and approval requirements.

## Verification target

The canonical verification should show:

1. One authorized privileged action executes exactly once.
2. Audit and trace contain the approval-validation and execution path.
3. Reusing the approval is denied as `replay_detected`.
4. Changing exposure arguments is denied because the request hash no longer matches.
5. A handoff cannot activate a privileged capability outside the target agent's policy/scope.

> Note: this document records the security contract. It does not claim a local executable run was performed by the GitHub connector.
