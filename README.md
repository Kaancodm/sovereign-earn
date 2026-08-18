# Sovereign Earn

Gamifizierte Get-Paid-To (GPT) PWA für Mobile-MMORPG-Spieler (Fokus: MU: Dark Epoch).

**Live:** https://sovereign-bdb76.web.app
**Firebase-Projekt:** `sovereign-bdb76` (Blaze-Plan)

## Stack

- Firebase Hosting + Cloud Functions (Node 20, Functions v2)
- Firestore (fail-closed Rules für Coins)
- Postbacks: Pollfish, BitLabs, CPALead
- Auszahlungen mit 24h-Sicherheitswarteschlange
- WorkAI (A2A-Agent auf Oracle VPS) für Build-Advisor & Sensei-Matching

## Struktur

```
functions/        Cloud Functions (Node 20)
  index.js        Exporte
  coaching.js     Sensei-Coaching-Flow (accept / complete / decline / cancel)
workai/           WorkAI A2A-Server (Oracle VPS, Python/FastAPI)
  a2a_server.py   JSON-RPC Endpoint + Agent Card
```

## Sicherheitsregeln (nicht verhandelbar)

- Coins werden **niemals** vom Client geschrieben.
- Alle Coin-Änderungen nur über Admin-SDK + Firestore-Transaktionen.
- Secrets: `WORKAI_API_KEY`, `WORKAI_A2A_ENDPOINT` (via `firebase functions:secrets:set`).

## Deploy

```bash
firebase use sovereign-bdb76
firebase deploy --only functions
```

## Coaching-Flow (Datenmodell)

`coachingRequests/{requestId}`:

| Feld | Typ | Beschreibung |
|---|---|---|
| `studentId` | string | UID des Schülers |
| `senseiId` | string | UID des Sensei |
| `priceCoins` | number | Preis in Coins (> 0) |
| `status` | string | `pending` → `accepted` → `completed` / `declined` / `cancelled` |
| `escrowCoins` | number | gehaltene Coins während `accepted` |
| `createdAt` / `acceptedAt` / `completedAt` | timestamp | serverTimestamp |

`users/{uid}.coinBalance` (number) — Coin-Kontostand. Falls dein Feld anders heißt: `COIN_BALANCE_FIELD` in `functions/coaching.js` anpassen.

**Ablauf:**
1. Client erstellt Request (`pending`, kein Geld bewegt sich)
2. `acceptCoachingRequest` (Sensei) → Coins des Schülers gehen in Escrow
3. `completeCoachingRequest` (Schüler bestätigt Session) → 90 % an Sensei, 10 % Plattformgebühr
4. Alternativ: `declineCoachingRequest` (vor Annahme, kostenlos) oder `cancelCoachingRequest` (nach Annahme, voller Refund)

## Nächste Schritte (aus 30-Tage-Backlog)

1. Postbacks + Auszahlungen final testen
2. `askBuildAdvisor` deployen und testen
3. Sensei-Profil um `offersPaidCoaching` erweitern
4. Erste 10–15 DE/RU-Senseis gewinnen
5. WorkAI (Oracle VPS) final anbinden
