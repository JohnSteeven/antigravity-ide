# Billing architecture

This document is the durable source of truth for MyJourney billing work. It covers the production billing foundation introduced in V1 Phases 10–12. Premium lifecycle UI, standalone Course purchases, Creator revenue sharing, payouts, and background-worker infrastructure remain outside this scope.

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
| `invoice_number_unique` / `invoice_provider_unique` | Internal and provider invoice identity correctness. |
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

## Phase 12

Phase 12 will add the official Razorpay test-mode adapter, signature-verified raw-body webhook route, refund boundary, authorization, and reconciliation tooling. Detailed provider decisions will be recorded here when that phase is completed.
