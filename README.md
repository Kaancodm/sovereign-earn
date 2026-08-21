# Sovereign Earn

Sovereign Earn is a mobile-first player economy platform for MMORPG communities. This repository is rebuilt from a clean baseline; the uploaded archive was treated as architectural reference only.

## Architecture
- Firebase Hosting: `public/` PWA
- Firebase Functions v2 / Node 20: authenticated coaching + server-side coin ledger
- Firestore: fail-closed rules; clients cannot mutate balances or ledger
- WorkAI: isolated FastAPI/A2A gateway in `workai/`
- CI: syntax, unit and dependency checks in GitHub Actions

## Security invariants
1. Coin balances are never client-writable.
2. Escrow, payout and refund state transitions happen atomically in Firestore transactions.
3. Every coaching transition checks authenticated identity and current state.
4. WorkAI refuses to boot without `SOVEREIGN_API_KEY`.
5. No demo Sensei or fraud results are treated as real production data.

## Local verification
```bash
npm test
npm run check
cd functions && npm install
```

For WorkAI:
```bash
cd workai
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
SOVEREIGN_API_KEY='local-only-secret' uvicorn a2a_server:app --reload --port 8080
```

Deployment requires Firebase project credentials/secrets to be configured in the target environment. The codebase deliberately does not contain credentials.
