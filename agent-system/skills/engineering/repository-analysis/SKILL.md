---
name: repository-analysis
description: Analyze repository structure, code, workflows, dependencies, and implementation state before engineering action.
triggers: [repository analysis, inspect repo, codebase analysis]
owners: [headcoder, tech-agent, security-agent]
risk_level: 1
---

# Purpose
Build an evidence-based technical model of a repository before proposing or making changes.

# Workflow
1. Establish repository, branch, and scope.
2. Inspect documentation and top-level structure.
3. Trace relevant code paths and configuration.
4. Inspect tests, CI/CD, dependencies, and security-sensitive configuration.
5. Identify inconsistencies, risks, and missing information.
6. Produce findings with evidence and recommended next actions.

# Output
- Architecture map
- Relevant files/components
- Runtime/dependency information
- CI/CD state
- Findings and risks
- Recommended implementation plan

# Safety
Default is read-only. Analysis does not authorize commits, merges, secret changes, deployments, or destructive operations.
