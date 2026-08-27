# Production readiness

This document distinguishes repository behavior from deployed-environment evidence. Passing tests/builds does not certify production readiness.

## Current evidence

- Verified runtime: Node 22.16.0 and npm 10.5.2; declared minimums are Node 20/npm 10.
- MongoDB is mandatory for API startup and persistent multiplayer behavior.
- Health is process liveness; readiness returns 503 without MongoDB.
- Admin launch audits are read-only and block on missing critical configuration, pending migrations, SMTP, billing, protected media, distributed cache, durable queue, or shared storage.
- One legacy auto-generated launch fixture (`MyJourney Enterprise Edition`, version `6.0.0`) remains in the local database. The release API quarantines that exact record so it cannot appear as production evidence. It is retained for an operator-led, backed-up data cleanup; this hardening pass does not delete stored data.
- `npm audit --omit=dev` reported zero vulnerabilities after the targeted React Router 7.18.2 migration.
- Production Parcel build passes. Entry JavaScript moved from approximately 1.73 MB to 605.95 kB through route lazy loading (about 65% smaller).

## Production blockers

These are not configured/proven by this repository and block a real launch until addressed:

- approved production Mongo topology, credentials, TLS/network policy, capacity, and migrations;
- production SMTP/SMS OTP delivery and deliverability/abuse testing;
- real Premium checkout, webhook verification, reconciliation, refunds, and provider price mapping;
- signed protected media delivery, direct upload, malware scanning, adaptive streaming, and download controls;
- distributed cache/rate limits, durable queue workers, and shared object storage adapters;
- encrypted off-host backups plus regularly tested restore and disaster-recovery procedures;
- external monitoring, alerting, centralized log retention, and error reporting;
- browser/device/accessibility QA and visual regression baselines;
- non-destructive staging load tests and capacity/error-budget targets;
- production secret-vault/rotation procedure, incident response, privacy policy, terms, consent/retention review, and regional legal review;
- payout provider, KYC/tax/compliance only if Creator earnings/payouts are later activated.

## Scale classification

| Boundary | Current behavior | Classification | Required evolution |
| --- | --- | --- | --- |
| API processes | Mostly stateless; auth/session data is Mongo-backed | Horizontal-capable after shared dependencies | Load balancer, graceful draining, shared rate limits/metrics |
| MongoDB | Required persistence and indexes | Core distributed dependency | Managed replica set, backups, capacity/index monitoring |
| Global rate limit | Process-memory `express-rate-limit` | Single instance | Redis-backed distributed limiter |
| Agent rate/concurrency | Bounded local Maps | Single instance | Distributed token bucket/lease with expiry |
| Cache | Memory/null only; Redis selection fails closed because no adapter exists | Single instance | Implement/test Redis adapter and invalidation policy |
| Queue | In-process memory queue only; other selections fail closed | Single instance/non-durable | Durable queue, retries, DLQ, idempotent workers |
| Schedulers | Timers run inside each API process | Single instance | Leader election or dedicated idempotent worker service |
| Multiplayer persistence | Mongo-required; disconnects return unavailable | Durable authority preserved | Replica set plus reconnect/timeout metrics |
| Socket fanout | Local adapter or optional Redis adapter | Single node without Redis | Redis fanout, sticky/drain strategy, multi-node load test |
| Presence/timers | Process-local coordination | Single node | Distributed presence/leases or partitioned workers |
| Metrics | Agent/Life/multiplayer counters are in process | Single instance | Prometheus/OpenTelemetry aggregation and dashboards |
| Uploads | Local public filesystem | Single node | Object storage, CDN, immutable keys, scanning |
| Backups | Admin JSON snapshot is local and restore is destructive | Development/operator foundation only | Native encrypted Mongo backups and isolated restore drills |
| Email campaigns | Application-loop delivery with per-recipient persistence | Limited throughput | Durable queue, provider events, idempotency, backpressure |

## Performance evidence and next targets

Route-only pages are lazy-loaded with Suspense. The final checkpoint build reports 605.95 kB for entry JavaScript, 615.58 kB for the Admin chunk, and 476.59 kB for global CSS; two game images are approximately 1.92 MB and 2.38 MB. Public Article lists use bounded server pagination (12 default, 48 maximum) with server-side filtering/search/sort and metadata-only serialization.

Next measured work should split Admin modules, scope/extract feature CSS, generate AVIF/WebP responsive game artwork with explicit dimensions, inspect font loading/CLS, profile Life/Creator/Course aggregations, and add response/cache metrics. Changes require real visual/performance regression checks.

## Backup and disaster recovery plan

1. Select managed Mongo backups with encryption, retention, point-in-time recovery, and an isolated backup account.
2. Back up object storage/media versions and configuration/secret metadata separately; never place raw secrets in application backups.
3. Capture migration status and an approved pre-migration backup before each production migration.
4. Restore into an isolated environment on a schedule, validate counts/indexes/auth/content/media, and record achieved RPO/RTO.
5. Maintain content export and account/Life export separately from infrastructure disaster recovery.
6. Document incident roles, DNS/provider failover, secret rotation, customer communication, and evidence retention.

The local JSON backup console is not an adequate production backup system.

## Non-destructive load-test plan

Use a staging database and generated, recognizable, self-cleaning fixtures. Never target production. Establish baselines, then ramp gradually while monitoring latency percentiles, throughput, event-loop lag, Mongo pool/query/index metrics, memory, queue depth, Socket connections, provider limits, and error rates.

Representative scenarios: Home and Article reads; login/refresh and throttled OTP; Learn catalog/topic filters/course detail/progress; Creator directory/profile/follow; Life Today aggregation; Agent conversation with provider/tool timeouts; multiplayer room/socket churn. Test read-heavy, authenticated mixed, burst, soak, and dependency-degradation cases. Define pass budgets only after a baseline and product SLO review.

## Browser QA matrix

No real browser backend was available. Source contracts, APIs, tests, and builds do not prove visual behavior.

| Route/page | Browser status |
| --- | --- |
| Home | NOT TESTED |
| Articles | NOT TESTED |
| Article | NOT TESTED |
| Stories | NOT TESTED |
| Story | NOT TESTED |
| Learn | NOT TESTED |
| Courses | NOT TESTED |
| Course | NOT TESTED |
| Lesson | NOT TESTED |
| Creators | NOT TESTED |
| Creator profile | NOT TESTED |
| Creator Studio | NOT TESTED |
| Life | NOT TESTED |
| Premium | NOT TESTED |
| Agent | NOT TESTED |
| About | NOT TESTED |
| Contact | NOT TESTED |
| Login | NOT TESTED |
| CMS | NOT TESTED |
| Story CMS | NOT TESTED |
| Theme CMS | NOT TESTED |

Required viewports are 390, 430, 768, 1024, 1440, 1920, plus 2560 for important pages, in Light, Dark, and a representative custom theme.

> STRUCTURALLY VERIFIED — MANUAL BROWSER QA REQUIRED

## UX and information architecture roadmap

### NOW

Complete browser/device QA; preserve the staged top navigation; improve consistent offline/server/provider-unavailable states; surface session/security controls; keep search, saved content, history, notification, privacy/export, theme, and accessibility preferences discoverable without adding future empty navigation items.

### NEXT

Unify global search across published Read/Learn/Creator content with access-aware serialization; strengthen Continue Reading/Learning; add user-controlled recommendations; add visual regression baselines; implement shared operational infrastructure and measured performance budgets.

### LATER

Evolve navigation into READ, LEARN, LIFE, WORK, CREATE, PLAY, and AGENT only as real domains launch. Add language preferences, richer onboarding, verified external opportunity feeds, Practice/Assessments, and additional meaningful Play experiences after policy/domain review.

### AVOID

Fake jobs, affiliations, earnings, checkout, provider success, or credentials; guaranteed referrals/employment; scraping without legal review; raw executable CMS themes; gambling, loot boxes, pay-to-win, compulsive streak pressure, and dark-pattern rewards.

## Future domain architecture

### Jobs and opportunities

Create a separate WORK domain only after source/legal review. A future `Opportunity` can include stable key, title, organization, description, location/work mode, experience level, skills, source/source URL, official application URL, publish/expiry/verification timestamps, and status. Initially curate and verify records, expire them automatically, disclose the external source, and redirect to the official application. Do not infer affiliation or scrape without authorization.

### Referrals

Model referral provider/Creator, organization, linked opportunity/role, external URL, expiration, eligibility notes, disclosure, verification, and privacy-safe click analytics. Require explicit provider authority and moderation. Never promise a referral, interview, or employment outcome.

### Assessments and Practice

Keep assessment attempts/results separate from Course content while allowing course checkpoints to reference an assessment definition. Support quizzes, practice sets, skill tests, exam preparation, coding/language challenges, scoring versions, attempt ownership, accommodations, and evidence provenance. Never issue fabricated credentials.

### Play and games

Extend the existing Play domain with daily knowledge, memory, logic, typing, coding, language, financial-literacy, career-scenario, reflection, and learning-trivia experiences. Keep deterministic server authority for competitive state, clear age/safety rules, accessible motion/input options, and non-exploitative rewards.
