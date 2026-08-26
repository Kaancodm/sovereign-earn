# Sovereign Agent Tool MVP — Schritte 21–40

## Ziel

Die Agent-Core-Basis wird als klar abgegrenztes Tool-MVP nutzbar. Die Earn-Logik bleibt außerhalb der Tool-Ausführungsgrenze.

## Umsetzung 21–40

21. MVP-Fassade über Orchestrator und ToolRuntime eingeführt.
22. Run-Start als öffentliche MVP-Operation verfügbar gemacht.
23. Tool-Autorisierung als eigene Operation verfügbar gemacht.
24. Co-Pilot-Override bleibt an Actor-ID und Begründung gebunden.
25. Registry bleibt die Autoritätsquelle für Agent, Skill und Tool.
26. Tool-Ausführung läuft weiterhin über ToolRuntime.
27. Einmalige Approvals werden vor Dispatch konsumiert.
28. Ablaufzeit der Co-Pilot-Freigabe bleibt enforced.
29. Auditierung bleibt Teil der Execution Boundary.
30. Fehlgeschlagene privilegierte Auditierung blockiert Ausführung.
31. MVP erhält einen minimalen öffentlichen API-Surface.
32. End-to-end-orientierter Smoke-Test für den MVP ergänzt.
33. Registry-Isolation wird im Test-Setup explizit hergestellt.
34. Erfolgreiche Tool-Ausführung wird strukturiert zurückgegeben.
35. Blockierte Ausführung bleibt strukturiert und nicht-exekutierend.
36. MVP enthält keine Earn-/Coin-Abhängigkeit.
37. MVP enthält keine Firebase-Abhängigkeit.
38. MVP ist damit als separates Agent-Tool-Modul innerhalb des Repositories abgrenzbar.
39. Änderungen liegen auf einem eigenen Feature-Branch und werden nicht in `main` gemischt.
40. Nächster Gate ist CI-/Review-Verifikation vor Merge.

## Public surface

```js
const mvp = new SovereignAgentToolMVP();
const run = mvp.start({ agentId, skillId, input });
const decision = mvp.authorize({ runId: run.runId, agentId, skillId, capability, action });
const result = await mvp.execute({ runId: run.runId, toolCallId, agentId, skillId, capability, action, args });
```

Für privilegierte Aktionen wird die bestehende `coPilotOverride`-Route verwendet. Es gibt keinen direkten Bypass um Registry, Policy, Approval oder Audit.

## Branching

Arbeitsbranch: `mvp/sovereign-agent-tool-21-40`.
Basis: `agent-core-trust-boundary-hardening`.
`main` bleibt unverändert.
