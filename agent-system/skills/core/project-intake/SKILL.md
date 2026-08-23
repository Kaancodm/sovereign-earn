---
name: project-intake
description: Establish project scope, constraints, goals, current state, and safe next steps for a new or unfamiliar project.
triggers: [intake, onboard project, understand project, inspect project]
owners: [sovereign-core]
risk_level: 1
---

# Purpose
Create a reliable initial model of a project before agents make changes.

# Workflow
1. Identify the project and authoritative sources.
2. Inspect repository structure and available project documentation.
3. Identify stack, deployment targets, integrations, agents, and constraints.
4. Record known unknowns rather than guessing.
5. Produce a current-state summary and prioritized next steps.

# Output
- Project identity
- Goals and constraints
- Architecture snapshot
- Integrations and external systems
- Risks/unknowns
- Recommended first actions

# Safety
Initial intake is read-only. Do not create branches, modify files, send communications, or deploy unless a separate approved workflow explicitly permits it.
