# Staging runbook

## 1. Firebase project

Create or select a dedicated Firebase project for staging. Do **not** use the production project for the first staging deployment.

Enable:

- Authentication (the provider used by the client)
- Firestore
- Cloud Functions
- Hosting

The project must use Node.js 20 for Functions.

## 2. Local verification

```bash
npm test
npm run check
```

For a full local Firebase stack, install the Firebase CLI and run:

```bash
firebase emulators:start
```

The emulator configuration is already present in `firebase.json`.

## 3. GitHub Actions staging deployment

Create a GitHub environment named `staging` and add this environment secret:

- `FIREBASE_SERVICE_ACCOUNT` — JSON service-account credentials with permission to deploy the staging Firebase project.

Then run **Actions → Deploy staging → Run workflow** and provide the dedicated staging Firebase project ID.

The workflow intentionally uses `workflow_dispatch`; pushes and pull requests never deploy automatically.

## 4. Post-deploy smoke test

Verify:

1. Hosting returns the PWA shell.
2. `/manifest.webmanifest` is served with the manifest content type.
3. `/sw.js` is reachable and is not cached indefinitely.
4. Firestore rules deploy successfully.
5. All five coaching callables deploy successfully:
   - `createCoachingRequest`
   - `acceptCoachingRequest`
   - `completeCoachingRequest`
   - `declineCoachingRequest`
   - `cancelCoachingRequest`
6. An unauthenticated callable request is rejected.
7. A client cannot directly write `coinBalance`, `ledger`, or `coachingRequests` updates.

## 5. Important staging limitation

The current PWA shell does not yet contain the final Firebase client-auth/session UI. Staging-ready here means the infrastructure, security boundary, Functions API, Firestore rules, hosting configuration and deployment pipeline are ready for integration testing; it does not claim that the product UI is feature-complete.

Never place Firebase service-account JSON, API keys with elevated privileges, or other secrets in the repository.
