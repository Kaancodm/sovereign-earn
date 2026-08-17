# Coaching Request Status Machine

## Status Overview

| Status | Description | Who can transition | Next status |
|--------|-------------|-------------------|-------------|
| `pending` | Request created, coins reserved | Sensei: `accept`, `reject`<br>Player: `cancel` | `accepted`, `rejected`, `cancelled` |
| `accepted` | Sensei accepted, 7-day timeout running | Sensei: `complete`<br>Player: `cancel`<br>System: `timeout` | `completed`, `cancelled` |
| `completed` | Coaching done, coins transferred (10% fee) | - | - |
| `rejected` | Sensei rejected, coins released | - | - |
| `cancelled` | Player cancelled or timeout, coins released | - | - |

## Lifecycle

1. Player calls `createCoachingRequest` → `pending`
2. Sensei calls `acceptCoachingRequest` → `accepted` (timeoutAt = now + 7 days)
3. Sensei calls `completeCoachingRequest` → `completed` (coins transferred)
4. Sensei calls `rejectCoachingRequest` → `rejected` (coins released)
5. Player calls `cancelCoachingRequest` → `cancelled` (coins released)
6. System calls `timeoutCoachingRequests` → `cancelled` for expired accepted requests

## Idempotency

- `completeCoachingRequest` checks `completedAt` – safe to call multiple times
- All functions use Firestore transactions
- `reservedCoins` never goes negative

## Security

- Coins only modifiable server-side (Admin SDK)
- Firestore rules forbid client writes to `coins`, `reservedCoins`
- `coachingRequests` readable only by involved player/sensei
- `accept`/`complete`/`reject` only by sensei, `cancel` only by player
