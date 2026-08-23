# Sovereign Agent Approval Policy v1

## Principle

Agents may reason broadly, but their ability to act is narrowly scoped.

## Default action classes

| Class | Meaning | Approval |
|---|---|---|
| Read | Search, inspect, retrieve | No |
| Analyze | Review, compare, diagnose, research | No |
| Draft | Prepare code, email, plan, configuration | No |
| Modify | Change a non-production working resource | Usually no; audit required |
| External | Affect an outside party or service | Yes |
| Destructive | Delete, overwrite, revoke, or materially damage | Yes |

## Always require explicit approval

- Sending external email.
- Replying to an external recipient.
- Bulk outreach.
- Merging into `main`.
- Direct pushes to `main`.
- Production deployment.
- Production configuration changes.
- Secret/API-key changes.
- Destructive repository or data operations.
- Financial or billing changes.
- Operations that materially increase recurring cost.

## Approval request format

Before execution, the agent should state:

1. **Action** — exactly what will happen.
2. **Target** — repository, branch, recipient, project, environment, etc.
3. **Reason** — why the action is needed.
4. **Expected effect** — what changes if approved.
5. **Risk** — relevant side effects or uncertainty.
6. **Rollback** — whether/how it can be reversed.

Example:

> **Approval required:** Send partner outreach email to `example.com` contact.\n> Reason: qualified AI/cloud partner.\n> Effect: external email will be sent from Sovereign Play.\n> Risk: low; external communication is irreversible once delivered.\n> Draft is ready for review.

## Security rules

- Never expose secrets, API keys, credentials, or private tokens in chat, email, commits, logs, or generated files.
- Never silently escalate privileges.
- Never treat a tool's technical ability as permission to use it.
- Security findings may block a release, but the Security Agent must not silently override the project owner.
- Production changes remain approval-gated even when CI/CD can execute them automatically.

## Audit record

For consequential actions, record:

```text
agent
skill
plugin/tool
action
resource
approval
result
timestamp
```
