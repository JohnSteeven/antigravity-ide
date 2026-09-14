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

## Phase 11 and Phase 12

The audited starting point includes `ReaderMembership`, a minimal `BillingEvent`, an unavailable `PaymentProviderService`, authenticated membership routes, CSRF middleware, and explicit Mongo migrations. Phase 11 will extend this architecture with Payment, Invoice, Refund, billing-event audit data, transition rules, atomic idempotency, and reconciliation-ready monetary components. Phase 12 will add the official Razorpay test-mode adapter, signature-verified raw-body webhook route, refund boundary, authorization, and reconciliation tooling. Detailed decisions and indexes will be recorded here as those phases are completed.
