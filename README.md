# Sovereign Earn

Gamifizierte Get-Paid-To (GPT) PWA für Mobile-MMORPG-Spieler (Fokus: MU: Dark Epoch).

**Firebase-Projekt:** `sovereign-bdb76` (Blaze-Plan)

## Stack

- **Frontend:** SPA (HTML5 + Vanilla CSS3 + ES6+) · PWA (sw.js, manifest.json) · 9 Module
- **Backend:** Firebase Hosting + Cloud Functions (Node 20, **Functions v2**)
- **DB:** Firestore (fail-closed Rules – Coins client-readonly)
- **Postbacks:** Pollfish, BitLabs (HMAC-SHA256 + Idempotenz)
- **KI:** WorkAI (A2A-Agent auf Oracle VPS) für Build-Advisor & Sensei-Matching

## Projektstruktur

```
public/               Frontend (wird gehostet)
  index.html          SPA mit 9 Modulen
  styles.css          Dark-Fantasy Cyber-MMO Theme
  app.js              Anwendungslogik (+ Firebase-Init mit Demo-Fallback)
  firebase-config.js  HIER deinen Firebase-Web-Key eintragen
  sw.js               Service Worker (Offline + Push)
  manifest.json       PWA Manifest
  icons/              PWA-Icons 72–512px

functions/            Cloud Functions (Node 20, v2)
  index.js            Zentraler Entrypoint (alle Exporte)
  coaching.js         Sensei-Coaching-Escrow (accept/complete/decline/cancel)
  workai.js           askBuildAdvisor (A2A), updateSenseiProfile, createCoachingRequest
  users.js            ensureUserProfile, requestAccountDeletion (DSGVO Art. 17)
  postbacks.js        pollfishPostback, bitlabsPostback (HMAC + Idempotenz)

scripts/              CI-Checks
  syntax-check.js     npm test – Syntax aller JS-Dateien
  staging-check.js    npm run check:staging – Deployment-Sicherheit
.github/workflows/    Staging-Deploy (nur workflow_dispatch, kein Auto-Deploy)
```

## Sicherheitsregeln (nicht verhandelbar)

1. Coins werden **niemals** vom Client geschrieben – `coinBalance` / `reservedCoins` / `coins` sind in `firestore.rules` für Clients gesperrt.
2. Alle Coin-Änderungen nur über Admin-SDK + Firestore-**Transaktionen**.
3. Postbacks werden serverseitig per **HMAC-SHA256** validiert.
4. **Idempotenz:** jede `rx_id` wird atomar in `transactions/{rx_id}` gespeichert → keine Doppel-Auszahlung.
5. Auszahlungen laufen durch eine 24h-Sicherheitswarteschlange.

## Lokal entwickeln & testen

```bash
npm test               # Syntax-Check aller JS-Dateien (8/8)
npm run check:staging  # Staging-Konfig validieren
cd public && python3 -m http.server 8080   # Frontend lokal
```

## Firebase Live-Modus aktivieren (Milestone 1)

1. **Frontend-Config** (`public/firebase-config.js`):
   Firebase Console → Project settings → Your apps → Web-App → `apiKey` + `appId` eintragen.
   Solange dort `YOUR_...` steht, läuft die App im Demo-Modus.
2. **Google-Login**: Console → Authentication → Sign-in method → *Google* aktivieren.
3. **Functions + Rules deployen** (Staging):

```bash
firebase use sovereign-bdb76
firebase deploy --only functions,firestore:rules
```

4. Beim ersten Login legt `ensureUserProfile` das Profil serverseitig an;
   das Wallet wird per `onSnapshot` live gesynct (read-only für den Client).

## Offerwall-Postbacks (Milestone 2)

Secrets setzen und die Endpoint-URLs im jeweiligen Publisher-Dashboard hinterlegen:

```bash
firebase functions:secrets:set POLLFISH_SECRET
firebase functions:secrets:set BITLABS_SECRET
firebase functions:secrets:set WORKAI_API_KEY
firebase functions:secrets:set WORKAI_A2A_ENDPOINT
```

| Provider | Postback-URL |
|---|---|
| Pollfish | `https://us-central1-sovereign-bdb76.cloudfunctions.net/pollfishPostback` |
| BitLabs | `https://us-central1-sovereign-bdb76.cloudfunctions.net/bitlabsPostback` |

> ⚠️ Das Pollfish-Signaturschema (siehe `functions/postbacks.js`) muss exakt
> mit der Konfiguration im Pollfish-Dashboard übereinstimmen.

## Staging-Deploy (GitHub Actions)

- Workflow: **`workflow_dispatch`** (manuell) – es gibt **keinen** Auto-Deploy bei push/PR.
- Benötigt Environment-Secret: `FIREBASE_SERVICE_ACCOUNT`
- Steps: `npm test` + `check:staging` → Functions (12 Stück) → Firestore-Rules → Hosting

## Coaching-Flow (Datenmodell)

`coachingRequests/{requestId}`:

| Status | Beschreibung |
|---|---|
| `pending` | Erstellt, Coins reserviert (`reservedCoins`) |
| `accepted` | Sensei nimmt an → Coins gehen in **Escrow** (`escrowCoins`) |
| `completed` | Schüler bestätigt → 90 % an Sensei, 10 % Plattformgebühr |
| `declined` / `cancelled` | Kein Geld bewegt bzw. voller Refund |

`users/{uid}.coinBalance` — Kontostand (Feld konsistent in coaching.js / postbacks.js / rules).

## Nächste Schritte (Backlog)

1. ✅ ~~Postbacks + Entrypoints konsolidieren~~ (erledigt)
2. ✅ ~~Firebase Auth/Firestore-Code im Frontend~~ (erledigt, Key eintragen)
3. [ ] Pollfish/BitLabs SDK in `index.html` einbinden
4. [ ] `initiateEscrowTrade` für Marketplace-Escrow (5%)
5. [ ] Web-Push VAPID + FCM (Milestone 4)
6. [ ] Sensei-Verifizierungsprozess + Discord OIDC-Login
