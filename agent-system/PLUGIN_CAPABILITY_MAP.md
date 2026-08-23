# Sovereign Plugin → Capability → Agent Map v1

## Principle
Installed integrations are capabilities, not autonomous authority. Skills decide when a capability is useful; permissions decide whether an action may execute.

## Core mappings

| Integration | Capability | Primary agents | Default risk |
|---|---|---|---|
| GitHub | source, issues, PRs, branches, CI/CD | Headcoder, Tech, Security | 0–5 |
| Atlassian Rovo | Jira/Confluence planning and project state | Sovereign Core, Headcoder, Tech | 0–4 |
| OpenAI Platform | AI infrastructure and API/project operations | Sovereign Core, Headcoder | 0–5 |
| Superhuman Mail | partner communication and scheduling | Partnership Agent | 0–5 |
| Exa | discovery and research | Research, Partnership | 0–1 |
| Firecrawl | web extraction and page research | Research, Partnership | 0–1 |
| Context7 | current technical documentation | Headcoder, Tech, Security | 0–1 |
| Reverse Contact | professional/company enrichment | Research, Partnership | 0–2 |
| LinkedIn | professional discovery | Research, Partnership | 0–2 |
| Webflow | website/CMS implementation | Design, Headcoder | 0–5 |
| Canva | visual collateral and design workflows | Design, Partnership | 0–3 |
| Mermaid Chart | architecture/flow diagrams | Design, Headcoder | 0–2 |
| Higgsfield | media generation | Design, Creator/Media | 0–3 |
| Magnific | media enhancement | Design, Creator/Media | 0–3 |
| Vercel | deployment and observability | Headcoder, Tech | 0–5 |
| Supabase | database/auth/edge infrastructure | Tech | 0–5 |
| Replit | rapid prototyping/development | Headcoder, Tech | 0–4 |
| Lovable | rapid application/UI prototyping | Headcoder, Design | 0–4 |
| Windsor.ai | marketing/data analytics | Research, Partnership | 0–3 |
| Malwarebytes | reputation/link safety checks | Security, Research | 0–1 |
| Kleinanzeigen | marketplace research | Research | 0–1 |

## Risk policy

- 0 Read: autonomous.
- 1 Analyze: autonomous.
- 2 Draft/prepare: autonomous; no external execution.
- 3 Modify: controlled and auditable.
- 4 External action: explicit approval by default.
- 5 Destructive/production/secret/billing action: explicit approval immediately before execution.

## Domain policy

A plugin requiring a domain does not automatically justify purchasing a new domain. Prefer the existing Sovereign domain architecture and assign subdomains by product function. Keep provider-specific domains separate from Sovereign ownership where appropriate.

## Agent boundaries

### Sovereign Core
Coordinates skills and handovers. It does not inherit unrestricted access to every tool.

### Headcoder
Primary technical implementation authority. Can work on branches and prepare PRs. Production merges, production deployments, secret changes, and destructive actions require approval.

### Tech Agent
Owns infrastructure, backend, integration, and runtime work. Production changes and destructive operations require approval.

### Design Agent
Owns UX/UI and visual systems. Changes stay in controlled branches/workflows unless explicitly approved for production.

### Security Agent
Can inspect and flag/block unsafe work. Security-sensitive changes remain controlled; it does not silently weaken security controls.

### Research Agent
Read/analyze only by default. Produces evidence-backed findings and rankings.

### Partnership Agent
Can research and draft. External email, scheduling, or other communications require approval unless a later explicit policy grants automation.

### Creator/Media Agent
Can research, generate, and prepare media. Publishing or external distribution requires approval by default.

## Handover contract

Every cross-agent handover should include:

- objective
- current state
- evidence/source references
- work already completed
- unresolved questions/open loops
- proposed next action
- required capability/plugin
- risk level
- approval status
- expected output

## Tool-selection rule

Agents should select the smallest capability set sufficient for the task. Availability of a plugin is not permission to use it, and access to a tool is not permission to perform every action exposed by that tool.
