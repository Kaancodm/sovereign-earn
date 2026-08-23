# Sovereign Earn Agent System

## Purpose

The agent system is a shared orchestration layer. Specialist agents are capabilities inside the system, not independent chatbots.

## Core components

- **Agent Core** — canonical lifecycle, identity, context and execution contract.
- **Agent Registry** — discovers agents and their declared capabilities.
- **Orchestrator** — selects the appropriate specialist and controls execution.
- **Handover** — transfers bounded work using a versioned envelope.
- **Tool Gateway** — authorizes and audits every tool invocation.
- **Observability** — records correlation IDs, agent IDs, tool IDs, outcomes and latency without secrets.

## Required invariants

1. Deny by default.
2. Every agent has a stable identity and declared capabilities.
3. Every handover is explicit, versioned and auditable.
4. Tool access is capability-scoped and server-authorized.
5. Secrets never enter prompts, logs or client-readable state.
6. Failed specialist execution returns control to the orchestrator.

## Initial specialist roles

- Product/Build Agent
- Design Agent
- Security Agent (restricted to approved game/security scope)
- Research/Analysis Agent
- Operations/Release Agent

These roles share the same Agent Core, Registry, Handover and Tool Gateway.