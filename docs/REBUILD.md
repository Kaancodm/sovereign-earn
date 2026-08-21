# Headcoder rebuild

The archive was treated as reference material only. The production repository was rebuilt from a clean baseline with explicit security invariants, a mobile PWA shell, atomic coaching escrow, a server-only ledger, fail-closed Firestore rules, CI checks, and a separately authenticated WorkAI gateway.

Before production deployment, connect Firebase Auth, configure service-account/CI credentials, provision WorkAI secrets, and run emulator/integration tests against a staging project.
