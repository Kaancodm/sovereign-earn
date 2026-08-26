# Sovereign-earn — Repository Roadmap v1

## Build now on the analysis branch

1. Agent runtime contracts
2. Agent registry
3. Skill contract and registry
4. Tool/capability registry
5. Runtime permission evaluation
6. Approval state model
7. Handoff contract
8. Guardrail hooks
9. Audit event model
10. Trace correlation
11. Unit and integration tests

## Integrate after harness verification

1. GitHub adapter
2. Superhuman Mail adapter
3. OpenAI Platform adapter
4. Atlassian adapter
5. Webflow adapter
6. Other approved plugin adapters

Each adapter must expose a narrow tool contract and remain behind the policy layer.

## Product work after core harness

1. Game Registry
2. Game Adapter interface
3. Sovereign Level-1 Design System integration
4. Game-specific theme support
5. Creator/gameplay session model
6. Recording/sharing workflow
7. Rewards model
8. Partnership workflows

## Production hardening later

- staging/production separation
- secret management
- IAM review
- monitoring and alerting
- failure recovery
- rate and cost controls
- security evaluation
- release gates

## Explicit non-goals for this branch

- no production deployment
- no automatic external email sending
- no production secret changes
- no replacement of the existing product architecture
- no assumption that every available plugin belongs in the core
- no direct agent-to-plugin bypass of the Tool Registry / Policy layer
