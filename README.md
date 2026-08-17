# Sovereign Earn v2

**AI-First Companion + Sensei-Coaching for MU: Dark Epoch (DE/RU)**

Live: https://sovereign-bdb76.web.app

## Vision

Sovereign Earn is the leading platform for ambitious mobile MMORPG players (especially MU: Dark Epoch) in German and Russian speaking regions - with strong AI companion, quality Sensei coaching, and the ability to earn coins on the side.

## Three Pillars

1. **AI-First Companion** - Build optimization, skill priorities, gear evolution, daily routines (DE + RU)
2. **Sensei & Coaching** - Verified mentors, 10% lifetime provision + paid sessions (coins)
3. **Earn System** - Offerwalls (Pollfish, BitLabs, CPALead), coins for payout or coaching

## Tech Stack

- Firebase Hosting + Cloud Functions (Node 20)
- Firestore (fail-closed rules for coins)
- WorkAI A2A (JSON-RPC 2.0) for AI skills
- PWA (monolithic index.html)

## Repository Structure

```
sovereign-earn/
├── functions/
│   └── coaching.js        # Coaching Cloud Functions (accept, complete, reject, cancel, timeout)
├── docs/
│   └── COACHING_STATUS.md # Coaching status machine documentation
├── firestore.rules        # Firestore security rules
└── README.md
```

## Coaching Flow (Quick)

| Status | Description |
|--------|-------------|
| `pending` | Request created, coins reserved |
| `accepted` | Sensei accepted, 7-day timeout running |
| `completed` | Coaching done, coins transferred (10% platform fee) |
| `rejected` | Sensei rejected, coins released |
| `cancelled` | Player cancelled or timeout, coins released |

**Functions:** `acceptCoachingRequest`, `completeCoachingRequest`, `rejectCoachingRequest`, `cancelCoachingRequest`, `timeoutCoachingRequests`

## Next Steps (P0)

1. Final test postbacks + payouts
2. Deploy + test `askBuildAdvisor` (mu-build-advisor)
3. Extend Sensei profile with `offersPaidCoaching`
4. Win first 10-15 DE/RU Senseis (templates available)
5. End-to-end test coaching request flow

## Security

- Coins only modifiable server-side (Admin SDK)
- Firestore rules: client cannot write `coins`, `reservedCoins`
- `coachingRequests` readable only by involved player/sensei
- API key rotation every 90 days, secrets in Firebase

## License

Private - all rights reserved.
