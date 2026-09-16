# MyJourney V1 master plan

Started 2026-09-09 against the local workspace. This is the execution plan for the user's commercial V1 request; `V1_PROGRESS.md` records actual changes and evidence. Earlier production plans remain historical context. **Launch decision: NO-GO.** Source inspection is not proof of deployed behavior, real delivery, financial correctness, accessibility, or capacity.

## Scope and preservation

Preserve the modular monolith, React/Parcel client, Express API, Mongo authority, Article/Story persistence, approved Story engines, global Premium entitlement service, Creator Studio/Admin separation, private Life ownership, Agent tool permissions, and multiplayer authority. No clone, reset, branch change, commit, push, deployment, production migration, production load test, or real-money transaction is part of this execution.

The opening working tree contained 28 modified tracked files and 10 untracked files, primarily account-identity security, profile UI, privacy browser tests, and documentation. Those are existing user work, not changes attributable to this task. They remain part of the validation baseline.

## Current-state audit

Read `AGENTS.md`, README, architecture, features, production readiness, interaction inventory, security, testing, development, migration, CMS, Reader, Agent, Life Auction, multiplayer and styling documentation. Inspected domain implementation and tests in parallel, including existing dirty changes. Runtime/provider/browser assertions below require their own evidence.

| Domain | Existing implementation to retain | Confirmed gaps / next action |
| --- | --- | --- |
| Runtime / repository | Mongo-gated startup, explicit migrations, health/readiness, diagnostic and secret/asset scripts | Old package identity/repository URL; migration CLI treats unknown commands as `up`; deployment/index evidence pending |
| Auth / OTP | HttpOnly cookie sessions, rotation/revocation, hashed OTP, CSRF, recovery, identity-change work in current tree | Real deliverability unavailable without credentials; review concurrent identity challenge consumption and isolated DB tests |
| Articles | Bounded Article discovery, protected-body serializer, Reader library/progress, public moderated comments | Published fixture seeder lacks production guard; launch-content provenance and actual published inventory need review |
| Stories | Shared Article storage, structured sections, 30 presets / 6 engines, legacy reader | Local-only Save; Admin Story list disconnected; public listing uses broader service defaults; incomplete authoring fields |
| Reader / Profile | Owner-scoped ReaderProfile, atomic Article toggles/progress, real library and progress cards | Add saved Story relation without mixing Article progress; migration 011 retry/rollback risks; stale response protections need runtime checks |
| CMS / About | Admin authorization, safe theme tokens, Article/Story editor, Pages/settings/navigation/SEO and operational services | Some About/site/project saves only update React state; Story library cannot reopen saved Stories; no claim of all buttons verified |
| Learn / coding | Course/Module/Lesson/Enrollment/LearningEvent, previews, Premium gates, Continue Learning | Cross-Creator draft preview disclosure; stale lesson UI; missing interactive blocks/curriculum/quizzes/mastery; concurrent progress/curriculum risks |
| Creators | Application/review, active directory, Studio ownership, follows, economy model foundations | Public serializer includes internal fields; structured Story editor mismatch; financial engagement evidence insufficient |
| Premium / billing | One account Premium model, duration choices, lifecycle/access checks, fail-closed provider boundary | Requested INR/USD catalog, verified payments, invoices/refunds/reconciliation and standalone purchases not implemented |
| Creator economy | Aggregate/ledger models and honestly inactive UI | Qualified allocation, auditable settlement, ANR, KYC/payout/referral flows absent; raw client engagement is not payable evidence |
| Life | Private Premium API and ownership, Today/habits/routines/goals/tasks/health/money/journal, export/delete, restricted offline queue | Notification scheduling/preferences/dedupe issues; mobile Money/Journal discovery; Dark theme coverage and browser privacy checks |
| Agent | Persistent conversations, validated tools, permissions, hashed confirmation service, mock/local provider | Successful local call crashes at usage return; duplicate messages can execute again; confirmation service disconnected from orchestration; cloud budget accounting absent |
| Notifications | Persisted Notification plus Life jobs/delivery models and provider boundaries | Generic service reports success without delivery and lacks `sendInApp` used by live callers; scalable digests/retries/events need work |
| Storage / video / email | Local upload validation, ProtectedMediaAsset, provider boundary, SMTP/SMS services | Object storage, scanning, signed media, Mux and durable transactional delivery require implementation/configuration |
| Play Life | Existing deterministic client engine/content/persistence | Local journey retained across account changes; dialog focus and privacy reset controls incomplete |
| Multiplayer / Life Auction | Mongo CAS authority, role-specific projections, reconnect/expiry, Redis fanout boundary, sealed-bid secrecy | Tied standings rank defect; multi-node coordination/load evidence, richer packs/replay/moderation/accessibility pending |
| Search / SEO | SearchIndex, Learn discovery, public metadata/sitemap services | Stale public search documents can expose unpublished/newly Premium bodies; raw regex/unbounded options; incorrect Article/Story/Page URLs |
| Performance / assets | Route lazy loading and asset inventory tooling | Large CSS/Admin chunk/game PNGs; many duplicate uploads may still be DB-referenced and must be preserved |
| Operations / legal | Structured request logs, privacy redaction, fail-closed launch console | Durable jobs/distributed limits, alerts, restore drills, capacity evidence, approved commercial policies and CA/legal review absent |

### Source and content evidence

Opening asset inventory: 1,146 tracked files, 83,314,379 bytes, four duplicate groups of files at least 100 kB. Main game PNGs are 2,709,942 and 2,198,070 bytes. Duplicate upload files cannot be declared unused from source imports alone. No cleanup is authorized on the assumption that duplicate bytes mean unused data.

Bundled Article material already exists: 32 fixtures across Life, Travel, Incidents, Reflections, Lessons, Coding, all with seeded view counts. Many are short (roughly 38–294 words; Incidents roughly 576–831). Six Story fixtures include longer text; combined legacy/section counts must not be mistaken for unique reading length. Verify provenance, originality, sources and publication suitability before importing launch content. Do not manufacture public activity or silently replace database content.

## Issue matrix

| ID | Severity | Evidence / reproduction | Required resolution |
| --- | --- | --- | --- |
| V1-001 | P0 security | `server/learn/courseService.js#getLesson`: any creatorId removes publication filter; another Creator receives a free draft lesson | Require owner scope before reading lesson; behavioral regression |
| V1-002 | P0 security | `server/services/enterpriseSearchService.js`: trusts stale index body without current Article authorization | Revalidate publication/deletion/access, return bounded safe DTO, escape literal queries |
| V1-003 | P1 correctness | `src/stories/StoryDetail.js`: Save only toggles component state | Idempotent authenticated persistence, Profile library, reload/account isolation/error/browser coverage |
| V1-004 | P1 correctness | `StoryCmsPanel` filters `data.articles`, but Admin Article listing excludes Stories | Separate Admin Story listing within existing content context; reopen/update/delete through Story routes |
| V1-005 | P1 correctness | `LocalAgentProvider`: block-scoped response referenced outside loop | Accumulate returned usage safely; successful-turn regression |
| V1-006 | P1 correctness | NotificationService has no sendInApp despite form/workflow/automation calls | Persist real in-app delivery via existing model; unavailable channels fail honestly |
| V1-007 | P1 privacy | Play Life global localStorage record survives account switches | Owner binding, purge/recovery UX, privacy tests |
| V1-008 | P1 integrity | Migration 011 sums winner plus duplicates before deleting duplicates | Re-entry-safe merge; isolated DB validation; explicit lossy rollback/backup warning |
| V1-009 | P1 correctness | Multiplayer standings reads rank from unranked previous source row | Deterministic shared ranks and regression |
| V1-010 | P1 integrity | Agent duplicate user message still invokes provider/tools; confirmation result ignored | Durable execution claim/replay state; confirmation-before-write enforcement |
| V1-011 | P1 honesty | seedArticles can write fake published counts in production; some CMS saves only setState | Guard fixtures; use existing persisted domain and accurate UI outcomes |
| V1-012 | P1 routing | Sitemap emits `/article` and `/p`; game About link uses nonexistent `#games` | Match canonical router paths and noindex/publication rules |
| V1-013 | P1 learning | Lesson fetch failure can retain previous body; Continue ignores last lesson | Clear state, cancel stale results, authoritative continuation |
| V1-014 | P1 launch | No real billing, protected media, payouts, AI budgets or restore evidence | Implement/test adapters; block activation until configured and independently verified |

## Architecture decisions

1. Stories remain Article records. Add a ReaderProfile Story-save relation and Story endpoint; keep Article-only reading progress, counters, and history contracts intact. Missing new arrays mean empty; no destructive backfill for component-only save state that never existed in Mongo.
2. Financial values are integer minor units plus ISO currency, immutable priced transactions and auditable ledger entries. Fixed catalogs: INR 39900/109900/199900/349900 and USD 999/2799/4999/8999 for 1/3/6/12 months. Duration never changes Premium features.
3. Existing ReaderMembership and entitlement resolution remain the account authority. Verified provider events, reconciliation and purchase records control access; client checkout callbacks never grant it. Razorpay official documentation must be checked at implementation time, sandbox first.
4. Creator ANR excludes indirect customer taxes, processor fees/tax, refunds/chargebacks, FX/cross-border and future store commissions; it does not subtract salaries/hosting/marketing. Premium allocation is 25% ANR, with 90% qualified user-centric consumption / 10% quality. Referral acquisition is separate marketing spend. Standalone Course sale shares are 70/30 or verified referral 80/20. Tax treatment requires human review.
5. Add coding blocks to existing CourseLesson and progression to existing Learn models. Learner HTML uses an opaque-origin sandbox with restrictive CSP; Python uses a stoppable worker/WASM runtime. No server shell execution, main-DOM learner HTML or executable CMS code.
6. Reuse provider registries and cost/log foundations. Mock execution is development-only. Every unavailable provider has an explicit unavailable state; configurable costs and hard spend limits must precede paid API activation.
7. Use durable workers and distributed limits/coordination within the modular monolith deployment. Preserve Mongo multiplayer authority; Redis fanout alone does not prove distributed game timing or multi-node safety.

## Phases and exit criteria

| Phase | Work | Exit evidence / dependency |
| --- | --- | --- |
| 0 | Audit, preserve tree, durable plan/progress, baseline | Domain/source/route matrix, issues, measured tests/build and honest gaps |
| 1 | Correctness/security/Story Save/migration/metadata/fixtures | Focused behavioral tests + regression/build, no fake persistence |
| 2 | Existing design consistency/accessibility | Keyboard/theme/mobile checks, shared component reuse |
| 3 | CMS/content upgrades | Persist/reopen/version/publish exact approved content; Admin-only controls |
| 4 | Original Story library and reading UX | Editorial provenance, CMS imports, actual word/time calculations, rendered presets |
| 5 | Article library and long-form UX | Sourced factual content, coherent TOC/continue/save, no artificial padding |
| 6 | HTML/CSS/Python interactive learning | Worker/sandbox security, timeout/reset/output, editable CMS blocks, beginner curricula |
| 7 | Learn quizzes/projects/mastery | Owned attempts, versioned answers/scoring, continuation/concurrency tests |
| 8 | Meaningful retention | Verified activity, humane grace, accurate empty/progress states |
| 9 | Notifications/preferences/digests | Consent, timezone/quiet hours, dedupe/retries/unsubscribe/provider events |
| 10 | Money utilities / price catalog | Integer arithmetic and exact INR/USD catalog tests |
| 11 | Payment/subscription/invoice/refund/event foundation | Auditable immutable records, idempotency, access reconciliation |
| 12 | Razorpay sandbox / verified webhooks | Official API verification, signature/replay/currency/event tests; test credentials |
| 13 | Premium lifecycle / billing UI | Renewal/failure/cancel/refund reconciliation and browser sandbox journeys |
| 14 | Standalone Course commerce | Explicit purchase gating; Premium alone never grants paid Course access |
| 15 | Qualified Creator engagement | Server time/session budgets, anti-farming, refund/self-consumption exclusion |
| 16 | 25% Creator pool | Deterministic per-user allocation, currency-safe rounding, audit/reversals |
| 17 | Creator ledger/KYC/payout | Hold/finalize/reverse/reconcile, agreement/versioning, minimum payout; legal/provider gates |
| 18 | Object storage | Signed immutable uploads/private delivery, validation/scanning/lifecycle integration |
| 19 | Protected video | Direct upload/webhook/processing/signed playback/entitlement and verified watch evidence |
| 20 | Production Journey AI | Provider/model routing, user/platform day/month budgets, tokens/cost, kill switch |
| 21 | Transactional email/OTP | Real provider sandbox, delivery/retry/event/redaction tests |
| 22 | Redis/durable jobs | Distributed limits/leases, idempotent jobs, retries/dead-letter/recovery evidence |
| 23 | Play Life upgrade | Private owner-bound persistence, usable keyboard/touch dialogs and honest game copy |
| 24 | Who Knows Me Better | Packs/ready/timers/reveal/rematch/privacy/moderation, server authority and reconnect |
| 25 | Life Auction | Consequential deterministic scenarios/reflection, sealed privacy, no real wagering |
| 26 | Play hub / selected new games | Add only after core commercial gates; quality/accessibility/registry contracts |
| 27 | About/projects | CMS persistence, accurate statuses/links/assets, no invented metrics |
| 28 | Search/discovery/personalization | Current published/access-aware results, owned continuation, no public Life data |
| 29 | Monitoring/backups/security operations | Dashboards/alerts, encrypted off-host backups and isolated restore drill |
| 30 | Browser/accessibility/visual/load QA | Real browser matrix and non-production load percentiles; no inferred passes |
| 31 | Measured performance | Before/after assets/bundles/API/Mongo metrics and visual regression |
| 32 | Legal/configuration readiness | Reviewed policies, consent/retention/tax config, credential/environment audit |
| 33 | Final launch report | Evidence-backed 31-area report and GO/CONDITIONAL GO/NO-GO decision |

P0 disclosures and integrity defects take precedence over visual or feature expansion. A phase can have useful implementation complete while activation remains explicitly blocked; the tracker must distinguish those states.

## Provider and human requirements

| Requirement | Needed evidence |
| --- | --- |
| Managed MongoDB | Isolated environments, TLS/network policy, replica set, indexes/migration status, encrypted backups/PITR/restore |
| Razorpay | Test keys/webhook secret/plan mapping; supported INR/USD flow verified from official docs; production account activation separately |
| Creator payouts | Approved provider, KYC/bank custody, agreement, refund/fraud holds, tax/withholding review and settlement reconciliation |
| R2/equivalent | Private bucket/credentials/domain/CORS, signed access/lifecycle/scanning and object recovery policy |
| Mux/equivalent | Sandbox credentials/webhook/signing keys, processing states and entitlement-bound playback |
| AI API | Explicit API credentials, configurable models/prices/allowances, daily/monthly platform spend limits; ChatGPT subscription is not an API credential |
| Email/SMS/push | Verified sender/domain, sandbox/delivery events, abuse limits, VAPID and SMS credentials where selected |
| Redis/worker | Connection/TLS, shared limiter/coordination, retry/dead-letter observability and failover test |
| Monitoring | Error/log/metrics collection, privacy retention, uptime/latency/queue/payment/AI/media/game alert ownership |
| CA/legal | Indian tax/payment/export/Creator review; approved Terms, Privacy, refunds/cancellation, seller/Creator earnings agreements, community/copyright, AI and consent policies |

Do not put secret values in these files. External credential absence blocks activation, not useful local adapter/test implementation.

## QA and launch checklist

- [ ] Focused behavior/security/migration/Socket.IO tests and full Jest regression with isolated test Mongo.
- [ ] Server syntax, production build, whitespace check and secret scan.
- [ ] Register/OTP/login/logout/refresh/recovery/identity and profile browser journeys.
- [ ] Story Save reload/account isolation, Story presets, comments, Article controls, Learn/course/coding/progress journeys.
- [ ] Free/Premium and ownership negative tests, Admin CMS authoring, Creator lifecycle and billing sandbox journeys.
- [ ] Life private/offline/multi-tab behavior, Agent permissions/idempotency, notifications, solo/multiplayer/reconnect/rematch.
- [ ] Chromium, Firefox, WebKit at 390/430/768/1024/1440/1920; 2560 for key pages; Light/Dark/custom theme.
- [ ] Keyboard/focus/labels/live regions/contrast/reduced motion/touch checks, automated accessibility plus manual review.
- [ ] Staging-only load p50/p95/p99/error/throughput/Mongo/event-loop/memory/queue/socket measurements.
- [ ] Reviewed migration backup/rollback, index validation, production content inventory, no dummy public metrics.
- [ ] Provider sandbox evidence, financial reconciliation, cost limits, alerts, backup restore and policy review.
- [ ] Final explicit recommendation tied to recorded evidence. Missing critical commercial/security/operational gates mean NO-GO.
