---
name: open-loops
description: Detect unresolved work, dependencies, unanswered requests, and commitments across project state.
triggers: [open loops, blockers, pending work, follow up]
owners: [sovereign-core]
risk_level: 1
---

# Purpose
Find work that is incomplete or waiting on a person, system, decision, or dependency.

# Workflow
1. Define scope.
2. Gather relevant project signals.
3. Identify unresolved items.
4. Classify owner, dependency, urgency, and impact.
5. Remove duplicates and stale observations.
6. Report the highest-value loops first.

# Output
Each loop should include: item, state, owner/dependency, impact, urgency, and recommended next action.

# Safety
Read/analyze only. Never close, delete, send, merge, deploy, or otherwise resolve an external item automatically.
