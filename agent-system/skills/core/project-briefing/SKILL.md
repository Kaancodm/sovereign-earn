---
name: project-briefing
description: Build a prioritized operational briefing from available Sovereign project state.
triggers: [briefing, status, sovereign status, what matters now]
owners: [sovereign-core]
risk_level: 1
---

# Purpose
Provide a concise, prioritized view of the current project state and recommended next actions.

# Workflow
1. Identify the requested scope and time horizon.
2. Gather only relevant read-accessible project signals.
3. Separate critical blockers, important work, open loops, and informational items.
4. Prioritize by impact, dependency, urgency, and risk.
5. Present facts separately from recommendations.
6. Offer concrete next actions without executing consequential changes.

# Output
- Critical blockers
- Important changes
- Open loops
- Recommended next actions
- Items requiring user decision

# Safety
Read/analyze only. Do not modify repositories, send messages, deploy, or change infrastructure.
