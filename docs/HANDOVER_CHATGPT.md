# Sovereign Earn — ChatGPT Headcoder Handover

> **Purpose:** Copy/paste the section `HANDOVER PROMPT` below into another ChatGPT account. It is designed to give a new coding agent the project context in seconds.

## Source of truth

- Repository: `Kaancodm/sovereign-earn`
- Branch: `main`
- Current verified HEAD at handover: `a9461f1c3978f6ca9c3cac95a0927cb23c29f785`
- Treat GitHub `main` as the only source of truth. Do **not** use the original ZIP as an implementation source.
- Before making changes, re-check the current `main` HEAD and relevant files because `main` may have advanced.

## Product

Sovereign Earn is a gamified Get-Paid-To / coaching PWA for mobile MMORPG players. The backend is Firebase Functions v2 + Firestore; the frontend is a PWA hosted by Firebase Hosting. WorkAI/A2A is intended for build advice and Sensei matching.

## Current stack

- Frontend: HTML/CSS/vanilla JS PWA under `public/`
- Backend: Firebase Cloud Functions v2
- Functions runtime: Node.js 22
- GitHub Actions runner: Node.js 24
- `firebase-functions`: `^7.3.2`
- `firebase-admin`: `^13.10.0`
- Database: Firestore
- Auth: Firebase Auth
- Postbacks: Pollfish + BitLabs, HMAC-SHA256 + idempotency
- AI integration: WorkAI/A2A

## Important backend modules

- `functions/index.js` — central exports
- `functions/coaching.js` — coaching escrow lifecycle
- `functions/workai.js` — WorkAI/A2A, Sensei profile, coaching request
- `functions/users.js` — profile creation + account deletion
- `functions/postbacks.js` — Pollfish/BitLabs HMAC + idempotency

## Security invariants

1. Clients must never write coin balances/reserved coins/ledger state.
2. Coin mutations are server-side and transactional.
3. Postbacks must be HMAC verified.
4. Postbacks must be idempotent to prevent double payout.
5. Secrets must not be committed; use Firebase Secret Manager / GitHub Environment secrets.
6. Never paste or request the actual private service-account JSON in chat.

## Staging deployment

Workflow: `.github/workflows/deploy.yml`

- Manual `workflow_dispatch` only.
- GitHub Actions uses `actions/checkout@v5` and `actions/setup-node@v5` with Node 24.
- Firebase Functions target Node 22.
- The workflow expects:
  - input: `firebase_project_id`
  - GitHub Environment: `staging`
  - secret: `FIREBASE_SERVICE_ACCOUNT`
- Firebase/IAM preflight currently runs `firebase functions:list` before Functions deployment.
- Functions deployment currently targets the v2 postback names:
  - `pollfishPostbackV2`
  - `bitlabsPostbackV2`
- Firestore Rules and Hosting deploy only after Functions succeed.

## Known blocker / current investigation

The latest user-provided GitHub Actions failure was:

`Error: Failed to list functions for sovereign-bdb76`

This occurs in the Firebase/IAM preflight. The Node.js 20 deprecation message shown in GitHub is a warning, not the direct failure. The project/workflow has already been moved to Node 22 for Firebase Functions and Node 24 for GitHub Actions.

Likely area to verify next:

- GitHub Environment `staging` secret `FIREBASE_SERVICE_ACCOUNT`
- Service account identity contained in that secret
- IAM permissions on Firebase/GCP project `sovereign-bdb76`
- Cloud Functions permissions and `iam.serviceAccounts.actAs` / Service Account User permissions for the relevant runtime/build service accounts
- Firebase CLI authentication in the workflow

Do not claim staging is deployed until a real successful GitHub Actions run confirms it.

## Gen 1 / Gen 2 migration history

A previous deployment failed because Firebase detected an attempt to upgrade an existing Gen 1 `pollfishPostback` function to Gen 2. The workflow was changed to avoid automatically deleting/listing legacy functions and the new v2 postback exports use `pollfishPostbackV2` and `bitlabsPostbackV2`.

Do not reintroduce an automatic destructive Gen 1 deletion step without explicit approval and a migration plan.

## Validation

Run before committing:

```bash
npm test
npm run check:staging
```

Also install/check dependencies under `functions/` when needed.

## Agent rules

- Work as **Headcoder / lead engineer**.
- Use GitHub as the source of truth.
- Inspect the current code before changing it.
- Prefer small, testable commits.
- Never invent cloud credentials, deployment success, Firebase project state, IAM state, or external API responses.
- Do not weaken security rules just to make staging deploy.
- Do not silently delete production/staging resources.
- When blocked by external IAM/secrets, identify the exact missing permission/configuration and continue all code-side work that can be completed safely.
- After changes, run validation and update GitHub.

---

# HANDOVER PROMPT

You are taking over as **Headcoder** for the project `Kaancodm/sovereign-earn`.

Use GitHub `main` as the source of truth and first inspect the current HEAD; do not trust this handover's SHA if `main` has advanced.

Project: Sovereign Earn, a gamified GPT/coaching PWA for mobile MMORPG players.

Stack: Firebase Hosting + Firestore + Firebase Auth + Cloud Functions v2. Firebase Functions use Node 22. GitHub Actions uses Node 24. Functions dependencies currently target `firebase-functions ^7.3.2` and `firebase-admin ^13.10.0`.

Main backend files: `functions/index.js`, `functions/coaching.js`, `functions/workai.js`, `functions/users.js`, `functions/postbacks.js`.

Non-negotiable security: client cannot write coin balances/reserved coins/ledger; server mutations are transactional; postbacks are HMAC verified and idempotent; secrets never go into Git; never weaken rules for convenience.

Staging workflow: `.github/workflows/deploy.yml`, manual only, GitHub Environment `staging`, secret `FIREBASE_SERVICE_ACCOUNT`, input `firebase_project_id`. It performs CI, Firebase authentication, IAM preflight, Functions deploy, Firestore Rules deploy, then Hosting deploy.

Current known blocker from the last real user-run GitHub Action: `Failed to list functions for sovereign-bdb76` during the Firebase/IAM preflight. Treat the Node.js 20 deprecation annotation as a warning, not the direct failure. Investigate the service account/IAM/Cloud Functions permissions and authentication path before changing application code. Never ask for or expose the private service-account JSON.

There was an earlier Gen1→Gen2 migration problem with `pollfishPostback` / `bitlabsPostback`. The safe current design uses `pollfishPostbackV2` and `bitlabsPostbackV2`; do not add destructive automatic deletion of legacy functions without explicit approval.

Goal: continue from the actual current GitHub state, finish all code-side hardening, get the project to a verified staging deployment, then run smoke/E2E validation. Do not claim success until the GitHub Actions run is actually green.

Start by:
1. Read current `main` HEAD.
2. Inspect `.github/workflows/deploy.yml`, `functions/package.json`, `functions/index.js`, `functions/postbacks.js`, `firebase.json`, `firestore.rules`, and staging checks.
3. Reproduce/diagnose the latest deployment failure from the workflow logs if accessible.
4. Fix the smallest root cause safely.
5. Run `npm test` and `npm run check:staging`.
6. Commit the fix to GitHub and report the exact commit and remaining external blocker, if any.
