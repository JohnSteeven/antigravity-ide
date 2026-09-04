# MyJourney production master plan

Status: canonical working plan
Audit snapshot: 2026-09-03 (Asia/Calcutta)
Verification completed: 2026-09-04 (Asia/Calcutta)
Checked-out branch: `backup/myjourney-current-2026-09-03`
Checked-out commit: `2a53e8f356429290f1996d13f41744129d9c828f`

This is the canonical production plan for the repository state above. The earlier `MYJOURNEY_PRODUCTION_ROADMAP.md` remains useful historical evidence, but its completion claims are not inherited without verification against this checkout. In particular, the expected audit baseline `48fa519...` is not present in the local Git object database. The audit therefore records the actual branch, commit, and dirty tree instead of claiming comparison with an unavailable baseline.

## Executive decision

MyJourney has a credible modular monolith and several production-shaped domains, but it is not ready for a broad public launch. The safe path is a staged release: first close privacy and authorization risks, then make capability reporting truthful, then prove accessibility, reliability, observability, and operations with repeatable evidence. MongoDB remains required for persistent runtime behavior.

The first implementation slice in this plan is PRIV-03: the Life offline queue. It is structurally complete in this checkout and covered by focused tests, but manual multi-account browser QA remains required.

## Verified repository inventory

The inventory was derived from route registrations, route files, models, controllers, service-worker references, browser-storage references, provider adapters, and Jest suites—not from UI labels alone.

| Surface | Verified inventory | Source of truth |
| --- | ---: | --- |
| Top-level client routes | 49 | `src/App.js` and route configuration |
| Nested Life routes | 9 | `src/features/life/LifeApp.jsx` |
| Express mount registrations | 72 | `server/app.js` and server route registration |
| Server route modules | 58 | `server/routes/` and domain route folders |
| Express route definitions | 520 | `router.get/post/put/patch/delete` declarations |
| Mongoose model files | 146 | `server/models/` and domain model folders |
| Controller files | 55 | `server/controllers/` and domain controllers |
| Feature-flag references | 160 | client and server configuration/evaluation code |
| Browser-storage references | 45 | local/session storage and IndexedDB call sites |
| Service-worker references | 6 | Life PWA registration, capability, and worker files |
| Provider/integration-shaped files | 15 | email, SMS, push, billing, media, AI, analytics adapters |
| Jest suites at initial inventory | 72 | `server/tests/` |

The current stack includes React 19, React Router 7, Parcel 2, Express 4, Mongoose 8, Socket.IO 4, Jest 29, and Playwright 1. Persistent domains include accounts/sessions, Articles and Stories, comments and engagement, CMS settings/workflow, Premium entitlements, Creators, Learn, Life, Agent conversations, newsletters, media metadata, games, audit/operations, and supporting taxonomies.

### Browser and edge state

Browser state is not one uniform trust tier:

- HttpOnly access/refresh cookies are server-issued session credentials; client JavaScript cannot read them.
- Readable CSRF state exists only to support the double-submit flow.
- Life IndexedDB is a short-lived convenience buffer, not secure storage or a persistence authority.
- Play-with-friends session state and limited reader interaction state use session storage.
- Protected CMS state must not be persisted in browser storage.
- The Life service worker caches only the static shell and allowlisted same-origin navigation fallbacks. It does not cache authenticated API responses.

See [Privacy data map](./PRIVACY_DATA_MAP.md) and [Threat model](./THREAT_MODEL.md) for ownership, retention, trust boundaries, and residual risks.

## Product and launch decision matrix

| Capability | Product owner | Persistence/authority | Evidence status | Launch decision |
| --- | --- | --- | --- | --- |
| Public Articles and Stories | Editorial | Shared Article domain; server public serializers | Mature, with dirty-tree P0 work still under verification | Keep; launch only after regression/browser evidence |
| Reader profile and progress | Reader experience | MongoDB, user-scoped server APIs | Architecture and ownership tests exist | Keep |
| Comments and reactions | Community | MongoDB and server moderation | PRIV-01 independently accepted by source, focused, and regression evidence | Keep behind moderation; complete browser smoke |
| CMS/Admin | Editorial operations | MongoDB; exact Admin authorization | Broad surface, operational burden | Consolidate and restrict; no role shortcuts |
| Premium | Growth/account | Server-authoritative memberships and dates | Entitlement architecture exists; real checkout absent | Keep entitlement core; hide unavailable checkout |
| Creator directory/studio | Creator platform | CreatorProfile ownership; Admin review separate | Domain exists | Later staged launch |
| Learn | Learning | Server lesson serializers and learner ownership | Domain exists; protected media incomplete | Later; keep protected resources unavailable until real |
| MyJourney Life | Personal productivity | Private, user-scoped MongoDB; narrow browser queue | PRIV-03 structurally verified | Keep behind entitlement; complete browser privacy QA |
| MyJourney Agent | Assistance | Server tools, authorization, confirmation tokens | Provider-dependent | Hide unless provider/config/operations are real |
| Games/realtime | Engagement | MongoDB/Socket.IO/server sessions | Flags and operational maturity require audit | Later; default off for public launch |
| Newsletter/contact | Growth/support | Server/database plus configured delivery provider | Provider-dependent | Keep forms only where delivery is proven |
| Billing, payouts, protected streaming | Commercial/media | External providers plus server records | No production provider proof | Hide; never manufacture success |
| Legacy/dormant demos and duplicate UI | None assigned | Mixed | Maintenance and privacy risk | Remove after dependency/use review |

The north-star launch behavior is: public reading works anonymously; authenticated features remain server-scoped to the current account; Premium never changes authorization on server-side; unavailable integrations say they are unavailable; and private Life data never crosses an account boundary.

## Stable production-safety gates

| ID | Gate | Acceptance evidence | Status at this snapshot |
| --- | --- | --- | --- |
| PRIV-01 | Public Comment Privacy | Allowlisted DTOs; no account fields; validated writes and protected Admin transitions | **Independently accepted; browser smoke pending** |
| PRIV-02 | Protected CMS Browser State | No PII/protected collections in durable browser stores; identity/role-bound clearing and stale-response rejection | **Independently accepted; browser smoke pending** |
| PRIV-03 | Life Offline Queue Privacy | Strict operation allowlist; minimal payloads; owner binding; 24-hour expiry; bounded retries; account/logout/role/deletion purge; user inspection/retry/discard; no API caching; redirect-safe notifications | **Structurally complete; browser acceptance pending** |
| AUTH-01 | Account Identity Security | Reauthenticated, verified, atomic email/mobile replacement with exact normalized uniqueness and session rotation | Open; next implementation |
| SEC-01 | Feature Flags and Provider Truthfulness | Server evaluation for sensitive capabilities; production-safe defaults; Admin mutation routes protected; provider truthfulness | Open |
| LEGAL-01 | Legal and Privacy Surfaces | Accurate contact/consent/deletion/export copy matches implementation; India legal review complete | Open; qualified legal review required |

Each gate is accepted only when its code, focused tests, full regression, production build, required browser journeys, and current documentation are evidenced. A structural test is not a substitute for an actual browser, multi-tab, or device lifecycle test.

## PRIV-03 implementation record

The Life queue schema is version 2. Only task creation and non-sensitive habit/task/goal-action event logs can queue. Health, medication, routine, journal, money, notes, arbitrary paths, arbitrary headers, tokens, and unknown payload fields are rejected. Every accepted mutation receives an owner ID, creation/expiry time, operation type, client mutation ID, and idempotency key.

Legacy or unowned records, owner mismatches, expired data, corrupt records, duplicated idempotency keys, and unsupported operations are discarded before replay. Conflicts become visible `needs_attention` records. Unauthorized replay invalidates the browser session boundary and clears private browser data. The review dialog lets the current owner inspect safe summaries, retry, discard, or clear queued changes.

IndexedDB remains plaintext storage controlled by the browser profile. The queue minimizes exposure; it does not claim encryption. Deletion can be temporarily blocked by another open tab, so replay also rechecks the active authenticated owner immediately before each request. Server authorization and ownership checks remain the final control.

## Milestone sequence

| Milestone | Outcome | Exit criteria | Status |
| --- | --- | --- | --- |
| 0. Baseline and ownership | Reproducible inventory, dirty-tree provenance, owners, risks, metrics | Master plan, data map, threat model, command ledger | Complete for this checkout |
| 1. Privacy/security | PRIV-01 through LEGAL-01 closed | All stable safety gates evidenced | PRIV-01/PRIV-02 accepted structurally; PRIV-03 structural slice complete; browser evidence and later gates remain |
| 2. Accessibility system | WCAG 2.2 AA interaction and content contract | Keyboard, focus, zoom/reflow, semantics, contrast and AT evidence | Planned |
| 3. Reliability/data lifecycle | Migrations, rollback, retention, export/deletion and backup drills | Staging drills with artifacts | Planned |
| 4. Performance | Measured budgets and Core Web Vitals | Representative mobile/desktop traces | Planned |
| 5. Observability/operations | Logs, metrics, traces, alerts, runbooks | Alert drills and owner rotation | Planned |
| 6. Editorial/SEO | Publishing integrity and discoverability | Structured data, sitemap, canonical and search checks | Planned |
| 7. Monetization/providers | Honest checkout/media/payout integration | Sandbox then staging provider proof | Planned |
| 8. Creator/Learn staged launch | Controlled creator and learner cohorts | Authorization, moderation, support and capacity evidence | Planned |
| 9. Life staged launch | Private productivity with proven lifecycle | Cross-account/multi-device privacy, export/deletion and recovery proof | Planned |
| 10. General availability | Managed public release | Rollout/rollback, SLOs, support, incident and legal sign-off | Planned |

## Quality, accessibility, performance, and SEO gates

- Accessibility target: WCAG 2.2 AA, using native semantics first and the ARIA Authoring Practices for complex widgets. Validate keyboard-only operation, visible focus, focus restoration, dialog containment, status announcements, 200%/400% zoom, reflow, target size, error identification, reduced motion, and screen-reader journeys.
- Internationalization: declare language, keep strings externalizable, avoid concatenated user-facing fragments, test long/translated strings, Unicode input, local dates/numbers/time zones, bidirectional text, and logical CSS properties before claiming locale support.
- Performance: record LCP, INP, CLS, TTFB, route JavaScript/CSS, image bytes, and API latency at p50/p75/p95. Initial build evidence already flags multi-megabyte image assets and large entry/Admin bundles; set budgets after measuring representative devices, not from an arbitrary lab number.
- SEO/editorial: published-only server data, correct status codes, canonical metadata, sitemap integrity, Article/Breadcrumb structured data, sanitized bodies, useful people-first content, and no protected text in public search indexes.
- Security: use the current stable OWASP ASVS as the verification catalog and track OWASP Top 10 risks. Authentication assurance decisions should be reviewed against current NIST guidance rather than treated as satisfied by password/JWT presence.

Primary references, accessed 2026-09-03: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/), [W3C internationalization quick tips](https://www.w3.org/International/quicktips/), [Core Web Vitals](https://web.dev/articles/vitals), [Google Search Essentials](https://developers.google.com/search/docs/essentials), [people-first content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), [Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article), [Breadcrumb structured data](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb), [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/), [OWASP Top 10:2025](https://owasp.org/Top10/2025/), and [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html).

## Privacy and India regulatory review

Engineering must map actual data flows and prove consent, notice, purpose limitation, access/correction/erasure/grievance paths, retention, processors, and incident handling. Product copy and operational practices require qualified Indian legal review against the [Digital Personal Data Protection Act, 2023](https://www.meity.gov.in/digital-personal-data-protection-act-2023-4), the [Digital Personal Data Protection Rules, 2025](https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa), the current [Information Technology Rules materials](https://www.meity.gov.in/documents/act-and-policies/information-technology-intermediary-guidelines-and-digital-media-ethics-code-rules-2021-it-rules-2021-IjM5QjMtQWa), applicable online-gaming amendments, and the CCPA [Guidelines for Prevention and Regulation of Dark Patterns](https://consumeraffairs.nic.in/sites/default/files/file-uploads/latestnews/central-consumer-protection-authority-dark-patterns-guidelines-watermark-1565354.pdf). This plan is engineering evidence, not legal advice or compliance certification.

## Metrics plan

| Goal | Metric | Allowed properties | Explicit exclusions |
| --- | --- | --- | --- |
| Reading value | Published article starts/completions | content ID, content type, coarse locale, anonymous/authenticated class | body text, search text, email, phone |
| Reliability | API success/error/latency | route template, method, status class, duration, release | request/response bodies, cookies, tokens |
| Life queue health | queued/replayed/discarded/conflict counts and age bands | operation type, reason code, age band, online state | owner ID, titles, notes, health/finance/journal values |
| Accessibility | automated violation count plus manual journey pass rate | route template, rule ID, severity, release | user-entered content |
| Performance | LCP/INP/CLS/TTFB and bundle/resource bytes | route template, device class, connection class, release | full URL query, account identifiers |
| Commercial funnel | capability shown/start/success/unavailable | product, provider state, coarse country, release | payment instruments, protected content, free text |

Metrics require a documented purpose, owner, retention, access list, and deletion behavior before collection. Do not add analytics merely because an event is technically available.

## Current blockers and risk register

1. The requested historical commit is unavailable locally, so no honest regression delta can be asserted against it.
2. The checkout began with overlapping uncommitted and untracked PRIV-01/PRIV-02 work. The complete combined diff was independently inspected and accepted for the local checkpoint; its original pre-checkpoint authorship remains mixed.
3. Local MongoDB is reachable, but validation reports all 11 catalogued migrations as pending. No migration was applied. Production database/provider/secret evidence was not supplied, and email/SMS/push, billing, protected media, AI, and analytics still require environment-specific proof.
4. Feature-flag defaults and mutation authorization need a dedicated SEC-01 review; engagement/realtime capabilities must not silently launch because configuration is absent.
5. Browser deletion may be blocked by another tab, private browser stores are not encrypted, and service-worker lifecycle behavior still needs real-browser verification.
6. The initial production build contains approximately 2.38 MB and 1.92 MB PNG assets, a roughly 612 kB entry script, and a roughly 616 kB Admin chunk; these are uncompressed build outputs and performance risks, not measured user Core Web Vitals.
7. `npm audit --omit=dev` reports four moderate production vulnerabilities: two advisories in the Express/body-parser/`qs` chain and one `sanitize-html` advisory counted in npm's affected dependency total. Upgrade and regression work remains open; `npm audit fix` was not applied automatically.
8. The tracked tree is about 83.2 MB. Four exact-duplicate groups exist among tracked files of at least 100 kB, including many duplicated 2,052,052-byte uploads across both `uploads/` and `server/uploads/`. The ignored `dist/` also contained 927 accumulated files totaling about 1.43 GB after the build, so deployment must start from a clean artifact directory rather than publishing stale local output.
9. Package metadata still points to the legacy `STEEVENWRITES` repository and should be corrected in a dedicated metadata change.
10. Legal, accessibility, penetration, disaster-recovery, provider, and production-load sign-offs are external work and remain open.

## Verification ledger

Results must be appended with the exact command, checkout, date, and limitations.

| Command | Result at 2026-09-03 | Scope/limitation |
| --- | --- | --- |
| `npx jest --runInBand --runTestsByPath` (10 checkpoint suites listed in `docs/TESTING.md`) | PASS: 10 suites, 131 tests | Comment/CMS/Article/Life/privacy/accessibility structural acceptance; no real browser |
| `npm run test:life` | PASS: 12 suites, 126 tests | Life server/client structural coverage |
| `npm run check:server` | PASS | Server JavaScript syntax |
| `npm run build` | PASS in 15.89 s | Parcel production build; not runtime/browser proof |
| `node --check src\\features\\life\\offline\\offlineQueuePolicy.cjs` | PASS | Queue policy syntax |
| `git diff --check` | PASS with line-ending warnings | Patch whitespace only |
| `npm test -- --runInBand` | PASS: 73 suites, 738 tests | Full Jest regression; expected 503 logs assert unavailable providers |
| `node --version` / `npm --version` | v22.16.0 / 10.5.2 | Satisfies declared engines |
| `npm run doctor` | PASS | Local ports available, MongoDB reachable, current-environment variables present |
| `npm run migrate:validate` | Completed; 11 migrations reported pending | Read-only validation; no migration was applied; release blocker |
| `npm audit --omit=dev` | FAIL: 4 moderate vulnerabilities | Registry-backed production dependency audit; controlled upgrade required |
| `npm run audit:secrets` | PASS: no high-confidence signatures in 1,146 tracked/unignored files | Values suppressed; heuristic scan, not secret-management certification |
| `npm run audit:assets` | Completed: 1,133 tracked files, 83,197,328 bytes, 4 large duplicate groups | Read-only inventory; no uploads removed |
| `npm run test:e2e -- --reporter=line` | INCONCLUSIVE | Three Chromium cases reached execution after harness race fixes, but the Windows web-server runner did not exit or emit a final summary; do not count as a suite pass |

An initial focused Jest invocation used Windows path separators as positional patterns and reported “No tests found”; it was an invocation error. The corrected `--runTestsByPath` command above passed and is the evidence-bearing run.

The Chromium investigation found and corrected three test-harness races: the focused Article test now returns shared fixtures to baseline, the long journey waits for logout navigation, and smooth scrolling is disabled before asserting completion progress. Non-local media is stubbed with an empty response because this sandbox denies public network access; localhost UI/API/MongoDB traffic remains real. An Article action journey reported a pass, but the final aggregate Playwright process repeatedly hung during/after its last case, so this is limited diagnostic browser evidence—not acceptance of Life IndexedDB, service-worker, notification, multi-tab, or accessibility behavior.

## Next five implementation slices

1. Complete dedicated browser smoke for PRIV-01 and PRIV-02.
2. Complete dedicated browser acceptance for PRIV-03.
3. Implement AUTH-01 secure account identity changes and a PII-free dry-run legacy normalization report.
4. Close SEC-01 as a separately reviewed slice.
5. Close LEGAL-01 with qualified legal review as a separately reviewed slice.

One combined local PRIV-01/PRIV-02/PRIV-03 checkpoint is authorized by the continuation brief. Push, deployment, migration, provider calls, production-side changes, and an AUTH-01 commit remain unauthorized.
