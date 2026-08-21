# Sovereign Earn

Gamifizierte Get-Paid-To (GPT) PWA für Mobile-MMORPG-Spieler (Fokus: MU: Dark Epoch).

**Firebase-Projekt:** `sovereign-bdb76` (Blaze-Plan)

## Stack

- **Frontend:** SPA (HTML5 + Vanilla CSS3 + ES6+) · PWA
- **Backend:** Firebase Hosting + Cloud Functions (Node 22, **Functions v2**)
- **DB:** Firestore (fail-closed Rules – Coins client-readonly)
- **Postbacks:** Pollfish, BitLabs (HMAC-SHA256 + Idempotenz)
- **KI:** WorkAI (A2A-Agent auf Oracle VPS) für Build-Advisor & Sensei-Matching

## Projektstruktur

```
public/               Frontend / PWA
functions/            Cloud Functions (Node 22, v2)
  index.js            Zentraler Entrypoint
  coaching.js         Sensei-Coaching-Escrow
  workai.js           WorkAI A2A + Sensei-Profil + Coaching-Request
  users.js            Profil-Erstellung + DSGVO-Löschung
  postbacks.js        Pollfish/BitLabs HMAC + Idempotenz
scripts/              CI-/Staging-Checks
.github/workflows/    Manueller Staging-Deploy
```

## Sicherheitsregeln

1. Coins werden **niemals** vom Client geschrieben.
2. Coin-Änderungen laufen nur über Admin-SDK + Firestore-Transaktionen.
3. Postbacks werden serverseitig per **HMAC-SHA256** validiert.
4. Idempotenz verhindert Doppel-Auszahlungen.
5. Secrets werden über Firebase Secret Manager an die v2 Functions gebunden.

## Lokal testen

```bash
npm test
npm run check:staging
cd public && python3 -m http.server 8080
```

## Firebase Secrets

```bash
firebase functions:secrets:set POLLFISH_SECRET
firebase functions:secrets:set BITLABS_SECRET
firebase functions:secrets:set WORKAI_API_KEY
firebase functions:secrets:set WORKAI_A2A_ENDPOINT
```

## Offerwall-Postbacks

Die bestehenden historischen Gen-1-Endpunkte werden nicht automatisch gelöscht oder migriert. Die neue v2-Implementierung verwendet bewusst kollisionsfreie Namen:

| Provider | Firebase Function |
|---|---|
| Pollfish | `pollfishPostbackV2` |
| BitLabs | `bitlabsPostbackV2` |

Nach erfolgreichem Staging-Test können die alten Gen-1-Funktionen kontrolliert im Firebase-Projekt entfernt und die Provider-URLs auf die V2-Endpunkte umgestellt werden.

## Staging-Deploy

- GitHub Actions: **`workflow_dispatch`** – kein Auto-Deploy bei push/PR.
- GitHub Environment: `staging`
- Benötigtes Secret: `FIREBASE_SERVICE_ACCOUNT`
- Runtime: Node.js 22
- Firebase Functions SDK: 7.3.x
- Deploy-Reihenfolge: Checks → Functions → Firestore Rules → Hosting

Der Workflow listet oder löscht keine bestehenden Functions. Damit kann eine alte Gen-1-Funktion einen neuen Gen-2-Namen nicht blockieren.

## Coaching-Flow

`coachingRequests/{requestId}`:

| Status | Beschreibung |
|---|---|
| `pending` | Erstellt, Coins reserviert |
| `accepted` | Sensei nimmt an → Escrow |
| `completed` | 90 % Sensei / 10 % Plattform |
| `declined` / `cancelled` | Refund |

`users/{uid}.coinBalance` ist serverseitig geschützt.
