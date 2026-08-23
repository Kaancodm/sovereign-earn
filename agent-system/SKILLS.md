# Sovereign Skills v1

Skills are reusable workflows shared by Sovereign agents. Plugins provide capabilities; skills define how those capabilities are used.

## Standard skill lifecycle

```text
Intent → Scope → Gather → Analyze → Present → Approve (if required) → Execute → Verify → Handover
```

## Skill contract

Every production skill should define:

- `name`
- `description`
- `triggers`
- `owner_agent`
- `risk_level`
- `required_tools`
- `inputs`
- `context_sources`
- `workflow`
- `approval_rules`
- `failure_handling`
- `output`

## Initial registry

### Core

- `project-intake`
- `project-briefing`
- `open-loops`
- `handover`
- `agent-onboarding`

### Engineering

- `repository-analysis`
- `architecture-review`
- `batch-task`
- `implementation`
- `testing`
- `deployment`

### Gaming

- `game-research`
- `release-monitor`
- `game-analysis`
- `guide-generation`

### Design

- `ux-review`
- `ui-generation`
- `theme-system`

### Security

- `security-review`
- `dependency-audit`
- `secret-audit`

### Business

- `entity-intelligence`
- `partner-research`
- `outreach`
- `relationship-tracker`
- `follow-up`

### Coordination

- `scheduling`
- `approvals`
- `multi-agent-coordination`

## Architecture rule

```text
Agent → Skill → Plugin/tool → External system
```

Agents must not bypass the skill/permission layer for consequential operations.
