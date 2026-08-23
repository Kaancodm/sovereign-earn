# Sovereign Failure Playbook — Agent Core Gate

## Kill signal

Do not proceed to Skills v1 if any privileged execution path can bypass runtime registration lookup, policy evaluation, authoritative approval validation, audit emission, or allowlisted dispatch.

## Required evidence

- adversarial tests deny forged approval fields
- unknown approval IDs are denied
- approval/tool/action/args mismatches are denied
- approvals expire and are single-use
- unregistered tools cannot execute
- no policy entry denies
- explicit deny overrides broad allow
- handoff capability escalation is denied
- parent approvals cannot be reused for a different tool call
- audit failure prevents privileged execution
- one end-to-end authorized action executes once with audit trail
- Node 22 CI is green
