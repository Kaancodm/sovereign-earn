# Sovereign Multi-Agent Handover Contract v1

A handover is a structured transfer of responsibility, not a new conversation.

## Required fields

```yaml
handover_id: unique-id
from_agent: agent-name
to_agent: agent-name
objective: concise outcome
scope: files/systems/tasks in scope
state: current state
completed: []
evidence: []
open_loops: []
assumptions: []
proposed_next_action: action
required_capabilities: []
risk_level: 0
approval_required: false
approval_status: not_required
expected_output: concise description
audit_notes: []
```

## Rules

1. Never silently discard prior work.
2. Distinguish facts, assumptions, and recommendations.
3. Include evidence for consequential technical or security claims.
4. Identify blockers and dependencies explicitly.
5. Preserve approval state; a handover does not grant new permissions.
6. The receiving agent must stay within its own capability and permission scope.
7. If required authority is missing, stop and request escalation rather than bypassing controls.
8. On completion, return a result and unresolved items to the originating orchestrator/agent.

## Standard lifecycle

`INTAKE → EXECUTE → VERIFY → HANDOVER → ACCEPT → EXECUTE → VERIFY → REPORT`

## Failure handling

If an agent cannot complete the requested work:

- state exactly what failed;
- preserve partial results;
- include relevant evidence/logs;
- identify the next viable action;
- do not hide or overwrite the failure;
- escalate only the missing capability or approval.
