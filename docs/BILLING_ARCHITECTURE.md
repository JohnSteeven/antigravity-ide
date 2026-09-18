# Billing architecture

This document is the durable source of truth for MyJourney billing work. It covers the billing foundation introduced in V1 Phases 10–12 and the Phase 13 prepaid Premium lifecycle. Standalone Course purchases, Creator revenue sharing, payouts, and background-worker infrastructure remain outside this scope.

## Domain boundaries

- `ReaderMembership` remains the single account-level Premium entitlement source. Billing durations do not create feature tiers.
- The billing domain records money collection, provider events, invoices, refunds, and reconciliation evidence. It does not grant browser-controlled entitlement.
- MongoDB uniqueness and conditional writes are the correctness boundary. Process-local memory must never deduplicate financial operations.
- Provider-dependent operations fail unavailable when required test-mode configuration is missing. Real credentials are never stored in source.

## Phase 10: money and catalog

`server/billing/money.js` defines immutable `Money` values. An amount is a non-negative JavaScript safe integer in minor units plus an explicit supported ISO 4217 currency (`INR` or `USD`). Construction rejects floats, `NaN`, infinity, unsafe integers, negative values, and unsupported currencies. Addition, subtraction, and comparison require identical currencies; subtraction cannot produce a negative amount. Formatting is presentational only and never feeds authoritative arithmetic.

`server/billing/priceCatalog.js` is the server-authoritative fixed catalog. Checkout clients may select only a product code. Client-supplied amount, currency, market, duration, discount, or entitlement date is not an input to price resolution.

| Product code | Duration | India | International |
| --- | ---: | ---: | ---: |
| `PREMIUM_MONTHLY` | 1 month | INR 39,900 minor (₹399.00) | USD 999 minor ($9.99) |
| `PREMIUM_3_MONTH` | 3 months | INR 109,900 minor (₹1,099.00) | USD 2,799 minor ($27.99) |
| `PREMIUM_6_MONTH` | 6 months | INR 199,900 minor (₹1,999.00) | USD 4,999 minor ($49.99) |
| `PREMIUM_12_MONTH` | 12 months | INR 349,900 minor (₹3,499.00) | USD 8,999 minor ($89.99) |

There is no live FX conversion. Stored account country code `IN`, `+91`, or `91` resolves to market `INDIA`/currency `INR`; all other or missing values resolve to `INTERNATIONAL`/`USD`. India entries carry `gst_inclusive` configuration metadata, but final invoicing and tax treatment require Indian CA/legal review.

Every catalog entry declares its product, duration, billing mode, tax treatment, provider, active status, and environment-variable key for an optional Razorpay plan ID. Provider identifiers can select provider configuration but cannot redefine price or duration.

## Phase 11: billing domain

`ReaderMembership` remains the Subscription aggregate so entitlement checks, content serializers, and Life access continue to use one global Premium record. It now has priced-term audit fields (`productCode`, market, amount/currency), lifecycle timestamps, and the latest verified Payment reference. Provider event time/ID fields support out-of-order rejection. Existing status vocabulary is retained for compatibility: `incomplete`, `trialing`, `active`, `past_due`, `grace_period`, `cancel_pending`, `canceled`, and `expired`.

`Payment` represents one attempt to collect an authoritative catalog amount. Immutable identity/terms include the internal reference, user, product, market, amount/currency, provider, and caller idempotency key. Provider order/payment/subscription IDs and timestamps are populated as verified state arrives. Status transitions are domain-allowlisted; atomic conditional updates prevent a delayed event from moving `captured` or `refunded` back to `pending`. Its monetary components preserve captured amount, pending refund reservations, successful refunds, chargebacks, indirect tax, processor fee, tax on processor fee, FX/cross-border cost, and future app-store commission.

`Invoice` is an auditable commercial record linked to Payment and optionally Subscription. It preserves gross, tax, fee, refund, chargeback, FX/cross-border, app-store commission, and known net values in one explicit currency. This is configuration-ready accounting data, not a representation of final Indian statutory invoice requirements; invoice numbering, GST fields, place-of-supply rules, retention, and legal text require CA/legal approval before production activation.

`Refund` represents a full or partial refund request. It has separate internal/provider references, owner, Payment, positive amount/currency, idempotency key, reason, timestamps, state, and provider-event linkage. Refund reservation and settlement use Mongo transactions. The Payment row is conditionally updated using `captured >= refunded + reserved + requested`; therefore two application instances cannot reserve more than captured funds. Provider timeouts leave a reservation pending for reconciliation rather than guessing success. Production MongoDB must support transactions (replica set or sharded topology).

`BillingEvent` is the durable external/internal audit and replay record. The provider event ID is unique per provider. Each row carries the provider event type, aggregate identity, optional user and money, previous/new state, received/occurred/processed times, a safe payload summary/hash, processing outcome, and bounded error information. Sensitive metadata keys are redacted. Raw payment credentials, secrets, signatures, and complete provider payloads are not stored.

### Idempotency and concurrency

- Payment attempt creation atomically upserts on `(userId, idempotencyKey)` and verifies that repeated use resolves to identical server-owned terms.
- Provider order and payment IDs are unique within a provider. Refund provider IDs and refund idempotency keys are also unique.
- A new BillingEvent is the event-processing claim. Concurrent duplicate insertions lose on the unique provider event index and cannot run side effects. Failed claims or expired five-minute leases can be reclaimed; completed/ignored events cannot.
- Payment and Subscription state changes use conditional queries over explicit predecessor states. Subscription changes additionally reject provider events older than `latestProviderEventAt`.
- Refund reservation/settlement spans Payment and Refund in a Mongo transaction. Provider API calls are never placed inside a database transaction.
- External APIs cannot provide a exactly-once guarantee across an unknown network timeout. An `uncertain` order/refund state is reconciled before retrying rather than risking duplicate money movement.

### Index review

| Index | Reason |
| --- | --- |
| `payment_reference_unique` | Stable internal traceability. |
| `payment_user_idempotency_unique` | A client retry cannot create a second Payment. |
| `payment_provider_order_unique` | One internal Payment per Razorpay order. |
| `payment_provider_payment_unique` | One internal Payment per Razorpay payment/capture. |
| `payment_user_created` | Owner-scoped billing-history queries. |
| `invoice_number_unique` / `invoice_payment_unique` / `invoice_provider_unique` | Internal identity, one invoice snapshot per Payment, and provider identity correctness. |
| `invoice_user_issued` | Owner-scoped invoice history. |
| `refund_reference_unique` / `refund_user_idempotency_unique` / `refund_provider_unique` | Internal, client-retry, and provider-retry refund deduplication. |
| `refund_payment_status` | Reconciliation and refund-total review for a Payment. |
| `billing_event_dedupe` | Provider replay protection. |
| `billing_event_aggregate_order` | Ordered audit trail for one financial aggregate. |
| `billing_event_retry` | Bounded recovery scan for failed/expired claims. |
| Existing membership user/provider indexes | One global membership per user and one membership per provider subscription. |

Migration `012-production-billing-domain` creates only the new named indexes and normalizes legacy BillingEvent processing fields. It is non-destructive and safe to rerun. Duplicate legacy provider identities will deliberately block a unique index rather than silently discard or merge financial data.

### Adjusted Net Revenue data boundary

The stored component foundation supports future calculation of customer payment less indirect tax, processor fees and fee tax, refunds, chargebacks, FX/cross-border costs, and future app-store commissions. Creator allocation is not implemented. Salaries, hosting/server costs, marketing, and ordinary company operating costs are not part of contractual Adjusted Net Revenue deductions.

## Phase 12: Razorpay test-mode provider

The Razorpay adapter is intentionally test-mode only. `RAZORPAY_TEST_MODE=false` and `rzp_live_` key IDs are rejected. No operation falls back to a simulated success. API and webhook capabilities are reported separately and remain unavailable until the complete relevant test configuration exists.

Configuration:

- `RAZORPAY_TEST_MODE=true`
- `RAZORPAY_KEY_ID` (must begin `rzp_test_`)
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- optional `RAZORPAY_WEBHOOK_SECRET_PREVIOUS` while previously signed deliveries are retrying after rotation
- `RAZORPAY_TIMEOUT_MS` (bounded from 1–30 seconds; default 8 seconds)
- optional `RAZORPAY_PLAN_<PRODUCT_CODE>_<CURRENCY>` mappings reserved for later subscription lifecycle work; Phase 12 Order checkout does not consume them

### Official provider behavior reviewed

Reviewed on 2026-09-15 against current official Razorpay documentation:

- [Create an Order](https://razorpay.com/docs/api/orders/create/): integer currency subunits, ISO currency, unique receipt up to 40 characters, at most 15 notes, and partial payment disabled for MyJourney.
- [Standard Checkout integration](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/): verify HMAC-SHA256 over the server-stored `order_id + "|" + razorpay_payment_id`; the callback order ID is not the authority.
- [Checkout best practices](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/best-practices/): verify captured Payment and paid Order state before fulfillment and use webhooks/API queries for server-to-server truth.
- [Validate and test webhooks](https://razorpay.com/docs/webhooks/validate-test/): HMAC-SHA256 over untouched raw request bytes using `X-Razorpay-Signature`, duplicate identity from `x-razorpay-event-id`, secret-rotation considerations, and no assumption of event order.
- [Payment webhook payloads](https://razorpay.com/docs/webhooks/payments/): `payment.authorized`, `payment.captured`, `payment.failed`, and `order.paid` entity snapshots.
- [Idempotent normal refunds](https://razorpay.com/docs/api/refunds/normal-refunds-idempotent/): positive integer subunits, `X-Refund-Idempotency`, identical-body retries, and `pending`/`processed`/`failed` results.
- [Refund webhooks](https://razorpay.com/docs/webhooks/refunds/): created, processed, and failed refund snapshots.
- [Fetch Payment](https://razorpay.com/docs/api/payments/fetch-with-id/), [Fetch Order](https://razorpay.com/docs/api/orders/fetch-with-id/), and [Fetch Orders by receipt](https://razorpay.com/docs/api/orders/fetch-all/): reconciliation inputs.

### Checkout and verification flow

1. Authenticated client sends `productCode` and an `Idempotency-Key`. Browser CSRF and the existing production global API limiter apply.
2. Server resolves market from the stored account country code and resolves amount/currency/duration from PriceCatalog. Client amount, currency, market, duration, discount, and Premium dates are ignored.
3. A Payment is atomically created/reused under the owner/idempotency unique index.
4. One process acquires the Payment order-creation claim. It calls `POST /v1/orders` with the internal Payment reference as the unique receipt, exact integer amount/currency, and no partial payments.
5. The provider response must echo matching receipt/amount/currency before the provider order ID is stored. Only safe checkout fields (including test key ID, never secret) are returned.
6. The browser success handler sends the three Razorpay callback values plus internal Payment ID to the server. The server loads that Payment by authenticated owner, verifies the signature using its stored order ID, then fetches both Payment and Order from Razorpay.
7. Only provider status `captured=true/status=captured` plus Order `status=paid` with exact amount/currency/order linkage can mark Payment captured. Phase 13 then transactionally activates the canonical ReaderMembership and creates/reconciles its associated Invoice snapshot. A failed activation remains recoverable by the same verified callback/webhook; no second order is needed.

If order creation times out, returns a 5xx, loses its database claim, or otherwise becomes ambiguous after the network boundary, the Payment moves to `uncertain`. It is not retried as a new order until reconciliation. A definitive provider 4xx moves the attempt to `failed` and can be deliberately retried under the same internal Payment receipt.

### Webhook flow

`POST /api/billing/webhooks/razorpay` is mounted with `express.raw({type: "application/json"})` before `express.json`, sanitization, cookie parsing, and browser CSRF. The route has no user authentication; authenticity is the provider HMAC. Invalid signatures never parse JSON, claim a BillingEvent, or mutate a financial record.

After signature verification, the handler requires `x-razorpay-event-id`, parses JSON, hashes the exact bytes, and acquires the durable BillingEvent claim. A duplicate event ID cannot run a second side effect; reuse with different content is rejected. Known payment/refund events validate internal order/payment/amount/currency linkage before conditional state changes. Unsupported event types are retained as `ignored`. Processing failures are stored safely as `failed` and return non-success so provider retry/reconciliation can recover. Delayed events that would roll terminal state backward are marked ignored.

The webhook route intentionally bypasses browser CSRF and the application’s user-auth rate assumptions. Cryptographic verification, the 512 KiB body limit, and upstream edge/WAF limits are the appropriate boundary. Phase 22 may add durable queue handoff and distributed admission controls; no process-local structure is used for correctness.

### Refund flow

Authenticated users can request a refund only against their own captured Payment. The server validates positive integer amount, exact Payment currency, remaining captured funds, and idempotency before reserving the amount transactionally. Razorpay receives the internal Refund reference as both receipt and `X-Refund-Idempotency`. A pending or unknown-timeout result remains reserved for webhook/API reconciliation. Processed results atomically move reserved funds to refunded funds and update the internal Invoice. Definitive failures release the reservation. Full and partial refunds share this flow; successful totals cannot exceed captured amount.

### APIs

| Route | Policy | Purpose |
| --- | --- | --- |
| `GET /api/billing/capability` | Public, no secrets | Honest test-provider availability. |
| `POST /api/billing/checkout/orders` | Authenticated + CSRF + idempotency | Create/reuse a server-priced order. |
| `POST /api/billing/checkout/verify` | Authenticated + CSRF | Verify checkout HMAC and provider state. |
| `GET /api/billing/payments/:paymentId` | Authenticated owner only | Safe private Payment view. |
| `POST /api/billing/payments/:paymentId/refunds` | Authenticated owner + CSRF + idempotency | Full/partial refund foundation. |
| `GET /api/billing/admin/reconcile/payments/:paymentId` | Admin only | Read-only internal/provider comparison. |
| `POST /api/billing/webhooks/razorpay` | Raw-body provider HMAC | Provider event ingestion; no browser CSRF. |

The legacy `POST /api/membership/subscribe` endpoint delegates to the same product-code/idempotency checkout service. `GET /api/membership/me` and `/me/entitlements` return the same safe canonical status. `POST /api/membership/cancel` supports audited application cancellation of paid prepaid/manual terms while retaining access. Provider portal, recurring cancellation/resumption, and synchronization remain unavailable; prepaid Razorpay Orders do not claim automatic renewal.

### Threat review

| Threat | Phase 12 control |
| --- | --- |
| Price/currency/duration manipulation | Only product code enters PriceCatalog; provider response and S2S verification must match stored terms. |
| IDOR/mass assignment | Payment reads, verification, and refunds scope to authenticated user; reconciliation requires Admin; allowlisted mutations only. |
| Forged callback/webhook | Constant-time HMAC comparison; checkout uses stored order ID; webhook uses raw bytes and configured secret. |
| Duplicate/replayed events | Unique provider event IDs, content hash comparison, durable claims/leases, conditional transitions, idempotent settlement. |
| Concurrent refunds | Mongo transaction plus conditional captured/refunded/reserved arithmetic; provider refund idempotency header. |
| Out-of-order state rollback | Explicit transition graphs and terminal-state ignore policy. |
| Provider timeout | Ambiguous Order/Refund remains uncertain/pending for reconciliation; no guessed success. |
| Secret/log exposure | Environment only; safe checkout serializer; bounded redacted metadata; structured logs contain IDs/results but no secrets/raw payload. |
| CSRF/middleware order | Browser billing routes remain after global CSRF; provider route is raw and mounted before parsing/CSRF. |

### Performance and scale review

Checkout performs one indexed idempotent Payment upsert, one short claim update, one provider call, and one final update. Webhook ingestion performs one unique event insert/claim and indexed aggregate lookups; payload storage is bounded to a small summary/hash. Refund correctness uses a short Mongo transaction around internal records only, never around network I/O. Owner and provider lookup indexes avoid collection scans. Reconciliation is selected-record and read-only, not an unbounded sweep. There are no N+1 loops in request paths.

Provider latency remains synchronous on checkout verification/refund initiation, and verified webhook processing is synchronous after the durable claim. At larger scale, Phase 22 should move post-claim processing/retries/reconciliation to durable queues/workers and add distributed admission limiting. Mongo transaction/topology capacity, provider rate limits, WAF configuration, alerting, and restoration drills require staging evidence; source structure alone does not prove production capacity.

## Phase 13: Premium lifecycle and entitlement activation

### Canonical authority and legacy compatibility

`ReaderMembership` remains the only entitlement authority, read by `subscriptionService`/`entitlementService` for Article/Story previews, protected bodies/sections, Premium Learn, and Life middleware. There is one membership per user, never a separate billing entitlement system. The User model has no independent Premium grant field; arbitrary legacy/client flags cannot grant access.

New paid memberships store purchase-attributed `paidPeriods` on ReaderMembership. Their union is the authoritative paid window. The existing start/end fields are a projection; they cannot bridge a gap after refund. Payment retains historical start/end/applied/revoked dates and membership/provider/order references. Expired periods are pruned on lifecycle mutations; financial/audit records remain. Legacy rows with no periods array retain existing explicit trial/grace/paid-date behavior until a verified purchase converts remaining valid access to a `legacy` period. An empty array grants no paid access. Development-provider grants remain disabled in production.

### Activation, renewal and expiration rules

- Both verified checkout and signed `payment.captured`/`order.paid` events invoke the same activation service. The service rereads authoritative Payment state, requires full capture and non-full-refund, and resolves duration/amount/currency/provider from PriceCatalog. Client dates, amount, currency, duration, and status are never inputs.
- Entitlement takes effect at the application's successful verification time. New/expired access starts then. If an unexpired paid term exists, the new term starts at the latest retained end, preserving all purchased time. UTC calendar-month addition clamps month-end dates. Provider event creation time is audit evidence and never backdates/truncates a newly verified purchase.
- Concurrent distinct purchases are allocated in transaction commit order. Once assigned, each purchase's dates remain fixed. Overlapping legacy windows are unioned for access; a current window requires `start <= now < end`.
- Expiration is enforced on every lookup without cron. Raw `active` status cannot grant past an end, before a future start, or through a refund gap. API status derives `expired`/`scheduled` immediately even when stored status normalization has not run.

### Cancellation, failures and grace

All catalog purchases use `prepaid_term`. Razorpay Order checkout does not schedule a subscription or automatic renewal. Audited application cancellation sets `cancelAtPeriodEnd`/`canceledAt` and preserves paid periods; repeating it is idempotent. An explicit later verified purchase activates another prepaid term and clears cancellation. Memberships with recurring provider subscription IDs require reconciliation and provider cancellation remains honestly unavailable. Unsupported/stale subscription webhook types are recorded as ignored, so they cannot replace a newer prepaid purchase.

A failed attempt updates only Payment and an allowlisted account issue summary, never paid dates/status or grace. Existing legacy `past_due`/`grace_period` rows still retain already-paid time; explicitly existing grace dates can apply after paid expiry, but Phase 13 creates no grace. Verified authorisation/capture may recover a failed order with another provider payment attempt. Captured/refunded states cannot roll back to failed/authorized. Account issue ordering uses authoritative internal Payment creation time relative to the latest successful activation and latest issue attempt; an older failed order cannot replace a newer success. The successful-activation timestamp remains monotonic when an earlier request commits later, preserving the stale-failure boundary. Repeated state transitions preserve original capture/failure dates. Successful activation clears the issue.

### Refund/revocation and overlapping purchases

Pending/failed/partial refunds leave paid access intact; there is no invented proportional-day reduction. When processed refund totals equal captured funds, settlement atomically removes only the matching Payment's period and marks its historical attribution revoked. Other purchases and legacy periods remain. Later purchases are never shortened or shifted: refunding an earlier stacked term can leave a gap until the next term's original start. The access helper denies that gap and the account API reports the next start. A currently valid independent later/overlapping period still grants access. Replayed refunds neither refund money nor revoke twice.

### Idempotency, concurrency and event ordering

The existing unique BillingEvent provider/event claim protects webhook delivery. Payment's `entitlementAppliedAt` is the cross-channel fulfillment marker: different capture/order event IDs and checkout confirmation for the same Payment cannot extend twice. ReaderMembership mutation, Payment attribution, Invoice association, and a deterministic internal `premium.activated` BillingEvent are one Mongo transaction. Cancellation state/audit are also transactional. Full-refund money settlement, Invoice snapshot, purchase-scoped revocation, and `premium.revoked` audit share settlement's transaction. There is no process-local correctness state.

Transactions serialize competing writes to the same membership and Payment. The Mongo driver retries transient conflicts; first-membership unique-index races retry from a fresh transaction snapshot, bounded to three attempts. Provider HTTP runs before/after these short internal transactions, never inside them. A capture recorded before activation failure can be retried safely. Activation/refund races cannot resurrect fully refunded access; invoice recovery preserves refunded totals. Subscription transition helpers reject older/equal-time competing updates and treat a repeated event ID as a read-only repeat. No synthetic provider sequencing is assumed.

### Account/client contract and support surface

The existing membership API allowlists active/plan/name/code, duration, started/current start/end dates, next access start, effective status/reason, source, prepaid mode, `autoRenew=false` for Orders (otherwise unknown), cancellation fields, and `{status, occurredAt}` payment issue. It omits internal references, raw periods, customer/subscription IDs, secrets, credentials, signatures, and raw webhook data; responses are private/no-store.

The existing `/premium` page uses product-code/idempotent checkout and Razorpay's real test Checkout script. Public plan reads optionally authenticate through the existing middleware, derive market from the stored account, and return private/no-store formatted INR/USD prices; query/client currency never chooses authoritative terms. Its callback asks the server to verify and then refreshes canonical membership; it never sets a local Premium flag. Retries reuse the same account/duration order key until successful verification. The existing subscription dashboard refreshes on entry and shows prepaid expiry/start dates, renewal links, payment issues, and scheduled access. Shared account state refreshes at date boundaries and on tab focus/visibility. Browser state is presentation only. Existing Admin plan/configuration and read-only reconciliation routes retain Admin authorization; no new manual grant/support control is introduced.

### Schema/index/migration and remaining provider validation

Optional membership period/success/issue fields and optional Payment attribution dates are lazy-compatible with old rows. Invoice membership association can be populated during capture recovery. Existing membership/user/provider uniqueness, Payment owner/provider indexes, Invoice payment uniqueness, and BillingEvent replay indexes cover the operations. No new migration/index is necessary, and migration 013 is unchanged. Persistent lifecycle behavior requires a real Mongo replica set/sharded topology.

Real Razorpay test-account checkout/API connectivity, captured/paid verification, dashboard webhook delivery/retries/rotation, failed-attempt recovery, full/partial refund delivery and reconciliation still require staging evidence. Recurring provider cancellation is unavailable rather than simulated. No real-money transaction or live-mode validation occurred. Local real-Mongo/stub-provider checks are structural evidence; browser checkout/account QA remains required. See [Razorpay webhook delivery semantics](https://razorpay.com/docs/webhooks/faqs/) and [refund API scope](https://razorpay.com/docs/api/refunds/).

Standalone Course purchases and Creator economics/payouts are not implemented. Statutory invoice/tax fields, billing-record retention/anonymization, GST treatment, and commercial/legal text still require CA/legal/privacy review before production activation.
