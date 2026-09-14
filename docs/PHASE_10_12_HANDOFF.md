# Phase 10–12 billing handoff

Date: 2026-09-15
Scope: Money/PriceCatalog, billing domain, and Razorpay test-mode production foundation only. Phase 13 and later work are not included.

`docs/V1_PROGRESS.md` was intentionally not edited because it is an untracked, actively modified file in the concurrent Story workstream. Reconcile this handoff into that progress document later.

## Phase 10 — Money and PriceCatalog

Checkpoint: `2bd26cf` — `Phase 10: production money and price catalog foundation`

Files:

- `server/billing/money.js`
- `server/billing/priceCatalog.js`
- `server/premium/catalog.js`
- `server/tests/billingMoneyAndCatalog.test.js`
- `docs/BILLING_ARCHITECTURE.md`

The canonical immutable Money value uses non-negative safe integer minor units and explicit INR/USD currency. Arithmetic and comparison require identical currencies; construction rejects floating, non-finite, unsafe, negative, and unsupported values. Formatting is presentational only.

The fixed server PriceCatalog contains the four Premium product codes for India and International markets at the approved INR/USD amounts. Stored account country data selects market; checkout accepts only a product code. There is no FX conversion and provider plan identifiers are configuration-driven.

Phase validation recorded at checkpoint: 2 focused suites and 30 tests passed; server syntax, migration validation, and `git diff --check` passed. No migration was applied.

## Phase 11 — Billing domain

Checkpoint: `d77f371` — `Phase 11: production billing domain foundation`

Models and services:

- `Payment` records immutable terms, provider identities, lifecycle state, order-creation recovery state, and revenue components.
- The existing `ReaderMembership` remains the one Subscription/Premium aggregate and gains priced-term, lifecycle, payment, and provider-event audit fields.
- `Invoice` is an internal auditable financial snapshot, not a claim of statutory invoice compliance.
- `Refund` supports full/partial lifecycle, ownership, idempotency, and provider linkage.
- `BillingEvent` provides durable provider replay claims, bounded safe payload summaries, status transitions, and recovery leases.
- `billingDomainService` centralizes authoritative creation, conditional transitions, invoice creation, refund reservation/settlement, and event claims.

Migration `012-production-billing-domain` creates the Payment, Invoice, Refund, and new BillingEvent indexes and normalizes legacy event processing fields. It is non-destructive and rerunnable; duplicates deliberately block correctness indexes instead of being silently merged.

Correctness/query index reasons are documented in `docs/BILLING_ARCHITECTURE.md`. The core boundaries are user/idempotency uniqueness, provider order/payment/refund identity uniqueness, one invoice per Payment, durable provider-event deduplication, owner history queries, refund reconciliation, aggregate audit ordering, and failed/expired event recovery.

Concurrency controls use MongoDB unique indexes, atomic conditional updates, short transactions for refund reservation/settlement, provider event claim tokens/leases, and monotonic state graphs. No process-local structure is authoritative.

Phase validation recorded at checkpoint: 9 focused suites and 71 tests passed; server syntax, migration validation, and `git diff --check` passed. No migration was applied.

## Phase 12 — Razorpay test-mode provider

Checkpoint message: `Phase 12: Razorpay test-mode production foundation`

Implementation:

- Environment-only test-mode configuration rejects `rzp_live_` keys and disabled test mode. Missing configuration reports unavailable; no simulated provider success exists.
- The REST adapter uses bounded requests for Orders, Payment/Order reads, receipt reconciliation, and idempotent normal refunds.
- Checkout creates/reuses the server-priced Payment, acquires an atomic order claim, creates a provider Order, validates echoed terms, then stores the provider mapping before returning safe fields.
- Browser callbacks are owner-scoped, use constant-time HMAC verification over the stored order ID, and require server-to-server captured Payment plus paid Order confirmation before capture.
- The dedicated webhook route receives raw bytes before JSON/sanitization/CSRF, verifies HMAC before parsing or persistence, requires a provider event ID, hashes the exact body, and claims the durable event before a side effect.
- Duplicate and concurrent delivery are database-idempotent. Event-ID reuse with different signed bytes is rejected. Invalid signatures never claim or mutate records. Terminal/out-of-order transitions are ignored rather than rolled back.
- Refund requests are owner-scoped and transactionally reserve remaining captured funds. The provider receives the internal Refund reference as receipt and `X-Refund-Idempotency`. Unknown outcomes remain reserved; definitive failures release the reservation; settlement updates Payment, Refund, and Invoice atomically.
- Selected-record Admin reconciliation compares internal terms/status with provider Order/Payment state without mutation. This is a queue-ready boundary, not a background system.
- Structured financial logs contain bounded IDs, operation, result, and safe error code only. They do not contain credentials, signatures, or raw provider payloads.
- Provider-verified Payment state does not activate or extend Premium. Phase 13 owns entitlement lifecycle.

Official Razorpay documentation reviewed on 2026-09-15 is linked in `docs/BILLING_ARCHITECTURE.md`: Orders creation, Standard Checkout signature verification and best practices, raw webhook validation/deduplication, payment/refund events, idempotent normal refunds, and Payment/Order reconciliation reads.

Tests cover exact catalog prices, invalid/disabled products, price/currency tampering, unauthenticated and cross-user access, Admin authorization, order creation and uncertain recovery, callback HMAC/provider confirmation, raw webhook middleware/signatures, duplicate/concurrent/replayed/unknown/out-of-order events, failed/captured states, full/partial/excess refunds, refund failure/timeout, and read-only reconciliation. Provider HTTP is mocked; automated tests do not need credentials or network access.

## Final validation

- Focused billing/Premium regression: 15 suites passed, 134 tests passed, 0 snapshots.
- Full Jest regression: 98 suites passed, 979 tests passed, 0 snapshots.
- `npm run check:server`: passed.
- `npm run migrate:validate`: passed; migrations 001–012 are valid and pending in the connected environment, with no missing indexes reported. No migration was applied.
- `npm run build`: passed; Parcel production build completed in 14.81 seconds.
- `git diff --check`: passed (only existing LF-to-CRLF checkout warnings were emitted).
- Browser QA: `STRUCTURALLY VERIFIED — MANUAL BROWSER QA REQUIRED`. Phase 12 adds server APIs and no Phase 13 checkout UI.

## Known risks and deferred work

- Razorpay behavior is source-verified and mock-tested, but no credentialed Razorpay test-account transaction or dashboard webhook delivery was performed. Staging must prove configuration, connectivity, event delivery, secret rotation, rate limits, and recovery.
- Migration 012 remains pending. Refund transactions require a transaction-capable MongoDB deployment and must be exercised in staging after backup/preflight review.
- Statutory invoicing, GST/tax allocation, legal text, and the retention/anonymization policy for Payment/Invoice/Refund records require Indian CA/legal/privacy review before production activation.
- Synchronous provider calls and post-claim webhook work are appropriate for this foundation but should move behind durable queues/workers, alerts, and distributed admission controls in the authorized later infrastructure phase.
- Phase 13 Premium activation, renewals, grace, cancellation, UI, notifications, and emails are deliberately deferred. Standalone Course billing and Creator economics/payouts are also deferred.

## Likely merge-conflict surfaces

The billing implementation did not edit Story source files. Shared files most likely to overlap the active Phase 4 branch are `README.md`, `docs/ARCHITECTURE.md`, `docs/DATA_AND_MIGRATIONS.md`, `docs/DEVELOPMENT.md`, `docs/FEATURES.md`, `docs/SECURITY.md`, `docs/TESTING.md`, and `server/index.js`. Billing-only hunks in those files must be retained while reconciling concurrent Story/Game/Reader changes. `docs/V1_PROGRESS.md` remains untouched for that reason.
