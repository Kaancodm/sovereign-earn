# Sovereign-earn — Product Architecture v1

## Scope

Sovereign-earn is the product. The multi-agent system is a core internal platform component, not the product itself.

## Layers

```text
Sovereign-earn
├── Product
│   ├── Games / Game Registry
│   ├── Sovereign Level-1 Design System
│   ├── Game-specific themes
│   ├── Creator / Gameplay features
│   ├── Users / Accounts
│   ├── Economy / Earnings
│   └── Partnerships
├── Agent Platform
│   ├── Orchestrator
│   ├── Agents
│   ├── Skills
│   ├── Handoffs
│   ├── Guardrails
│   ├── Tool Registry
│   ├── Runtime Policy / Permissions
│   ├── Approval Gates
│   ├── Audit
│   └── Tracing
└── Infrastructure
    ├── Firebase / Firestore / Functions / Hosting
    ├── GitHub
    ├── Atlassian
    ├── Superhuman Mail
    ├── OpenAI Platform
    ├── Webflow
    └── other external adapters
```

## Agent execution boundary

```text
Agent -> Skill -> Capability -> Tool -> Adapter -> External System
```

Agents do not receive arbitrary plugin access. Tool access is deny-by-default and controlled by runtime policy.

## Product boundary

End users interact with the Sovereign product, not with the internal orchestration protocol. Agent runtime details remain an internal implementation concern unless explicitly surfaced as a product feature.

## Game integration

Games should integrate through a game registry/adapter boundary so additional games can be introduced without rebuilding the Sovereign platform. Sovereign Level-1 is the default design system; game-specific themes are optional presentation layers.

## Creator / gameplay foundation

The architecture reserves a creator/gameplay layer for future recording, sharing and rewards. Session provenance should be represented explicitly (human, agent, or hybrid) rather than misrepresenting agent activity as human activity.

## Security boundary

```text
User -> Auth -> Application Function -> Policy -> Agent -> Skill -> Tool Permission -> Adapter -> External System
```

External credentials remain behind adapters and are never exposed to end-user clients or arbitrary agents.

## v1 implementation rule

This branch is an analysis/implementation harness. Do not deploy it as production. Preserve `main` and existing product functionality. Prefer additive, testable contracts and adapters over rewrites.
