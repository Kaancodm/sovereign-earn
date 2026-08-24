# Sovereign Agent Tool — Schritte 81–100

## Produktziel

Der Operator sieht einen vollständigen, nachvollziehbaren Run: Zustand, Approval, Policy/Capability, Execution Result und Audit-ID. Die Oberfläche ist Kontrolle, nicht eine zweite Execution Engine.

## 81–85 — Live Run Control

- Explizite Zustände: `PENDING_APPROVAL`, `APPROVED`, `EXECUTING`, `COMPLETED`, `FAILED`, `BLOCKED`.
- Übergänge sind whitelisted; terminale Runs können nicht wieder geöffnet werden.
- Jeder Run besitzt eine stabile `auditId`.
- Statushistorie wird append-only geführt.
- E2E-Flows können dadurch einen deterministischen Run-Lifecycle darstellen.

## 86–90 — Trust & Audit

- Audit-ID ist am Run verankert.
- Actor-Information kann an Zustandsübergängen hängen.
- Policy-/Capability-Information bleibt Bestandteil des bestehenden Agent-Core-Vertrags.
- Blocked/Failed ist ein expliziter Zustand, kein stiller Fehler.
- Kein Übergang darf die bestehende Registry-/Approval-/Audit-Grenze umgehen.

## 91–95 — Operator UX

- Approval wird vor Execution sichtbar.
- Override ist eine bewusste Operator-Aktion.
- Blocked und Failed erhalten getrennte Zustände.
- Mobile Darstellung priorisiert Zustand → Aktion → Resultat → Audit-ID.
- Der komplette E2E-Weg soll in wenigen Sekunden erklärbar sein.

## 96–100 — Release Candidate

- Contract-Tests für Run-Lifecycle.
- Regression gegen terminal-state reopening.
- CI Quality Gate.
- Product QA für Desktop/Mobile als separater manueller Gate.
- Staging Candidate erst nach grünem CI **und** bestätigter Browser-/Design-QA.

## Sicherheitsentscheidung

`RunControl` ist bewusst ein Zustands-/Audit-Modul. Es führt keine Tools aus und besitzt keinen alternativen Dispatch-Pfad. Execution bleibt beim bestehenden `ToolRuntime` und den bestehenden Approval-/Policy-Grenzen.
