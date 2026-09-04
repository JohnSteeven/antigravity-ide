# MyJourney threat model

Status: repository-level engineering threat model for the 2026-09-03 checkout. Revisit it for each architecture, provider, data-category, privilege, or deployment change.

## Assets and trust boundaries

Critical assets are account/session credentials, roles and entitlements, unpublished/protected content, Life private data, creator/learner ownership, moderation state, provider secrets, uploads, audit evidence, and deletion/export records.

Trust boundaries are:

1. public browser to Express API;
2. authenticated browser to user-scoped services;
3. Creator Studio to creator-owned resources;
4. CMS/Admin to privileged management APIs;
5. Express/services to MongoDB;
6. server to email/SMS/push/billing/media/AI/observability providers;
7. page JavaScript to IndexedDB/session storage/service worker;
8. service worker/notifications to navigation;
9. application deployment to operators, CI/CD, backups, logs, and support tooling;
10. one browser account/tab/profile to another account/tab/profile.

The server—not route visibility, React state, browser storage, flags, model output, or provider callbacks—is the authorization authority.

## Threat register

| Threat | Example attack/failure | Required control/evidence | State/residual risk |
| --- | --- | --- | --- |
| Session theft/replay | Cookie, refresh token, reset/OTP or session reused | HttpOnly/Secure/SameSite cookies, separate secrets, hashed rotating refresh records, revocation, token version, CSP/XSS defenses, rate limits, log redaction | Core controls exist; deployment headers, secret operations, session UX and penetration test remain |
| CSRF/origin abuse | Cross-site mutation with ambient cookies | Explicit production origins, CSRF double submit on mutations, SameSite and Secure cookies | Configuration and complete route coverage need staging proof |
| Broken object-level authorization | User/creator/learner reads or mutates another owner's record | Derive identity from `req.user`; user-scoped queries; object ownership and negative tests | Domain tests exist; broad 520-route authorization matrix remains |
| Privilege escalation | Creator gains Admin or Editor is treated as Admin | Exact `requireAdmin`; separate `requireActiveCreator`; server role checks; purge privileged client state | Core boundary documented; feature-flag/Admin route audit is SEC-01 |
| Premium bypass | Client unhides protected body/resource | Server entitlement resolution, fail closed, locked serializers omit fields | Core architecture exists; cache/media/search and provider journeys need proof |
| Cross-account offline replay | Account B replays Account A's queued Life mutation | Queue owner binding, active owner epoch, immediate pre-send check, logout/session/account/role purge, 24-hour expiry, server ownership | PRIV-03 structural tests pass; multi-tab/real-browser deletion remains |
| Sensitive local disclosure | Health/journal/money/medication persists in IndexedDB | Do not queue sensitive domains; minimize fields; inspect/clear UI; expiry; CSP/XSS prevention | IndexedDB is plaintext; a compromised browser profile or XSS can read queued data |
| Legacy/corrupt queue injection | Old/unowned/arbitrary path/header/token record is replayed | Schema v2 wipe, exact top-level shape, strict templates/payloads, no arbitrary headers, unsupported discard | Structural tests pass; browser upgrade lifecycle remains |
| Duplicate/offline mutation | Retry produces duplicate task/event | Client mutation/idempotency key, replay de-duplication, bounded retry, visible conflict | Client prevention exists; server-wide idempotency persistence should be assessed |
| Service-worker cache leakage | Authenticated API data returned offline or after logout | Cache public shell only; exclude `/api`; versioned cache cleanup | Source verified; browser cache inspection remains |
| Notification open redirect | Push data opens external/protocol-relative/credential URL | Exact same-origin Life path allowlist; reject query/hash/control characters; safe fallback | Structural VM tests pass; real notification QA remains |
| Stored/reflected XSS | Rich content/comment/upload or translated string executes script | Server sanitization, allowlisted embeds/uploads, CSP, safe React rendering, output encoding, security tests | Comment DTO/moderation and CMS browser-state work is structurally accepted; broader rich-content/CSP browser proof remains open |
| Mass assignment/injection | Extra request fields alter owner/status/role or query operators | Validators/allowlists, server-owned fields, Mongoose validators, query construction review | Inconsistent risk across a large route surface; continue endpoint inventory tests |
| Unsafe upload/media delivery | Executable public upload or protected asset exposed via public path | MIME/extension/magic-byte validation; separate protected metadata/delivery; scanning/provider truthfulness | General controls documented; real scanning/protected delivery unavailable |
| Feature/provider deception | UI claims checkout, AI, notification, upload or PWA success without real service | Capability state from actual server/client/provider evidence; fail honestly; production-safe flags | PWA truthfulness improved in PRIV-03; broader SEC-01 open |
| Prompt/tool injection | Retrieved/model text triggers unauthorized Agent tool/action | Model has no authority; schema validation; server authorization; confirmation token bound to action/user/conversation | Architecture documented; real provider red-team and data-processing review open |
| Realtime abuse | Impersonation, room enumeration, flood, harmful user content | Authenticated socket identity, room authorization, rate limits, moderation, safe defaults | Dedicated game/realtime launch review open |
| Data overcollection/leakage | Logs/analytics contain PII, bodies, tokens or Life values | Data map, property allowlists, redaction, access control, retention, sampled review | Metrics contract defined; production sink/config proof open |
| Incomplete erasure | Primary delete leaves browser queue, backup, upload or provider copy | Coordinated deletion jobs, browser purge, processor deletion, retry/audit, backup expiry and restore safeguards | Life browser purge added; end-to-end account/provider/backup proof open |
| Denial of service/cost abuse | Login/OTP/search/AI/upload/socket floods | Per-source and per-account limits, quotas, timeouts, size caps, concurrency, circuit breakers, alerts | Some controls exist; capacity/load/abuse tests and provider budgets open |
| Supply-chain/secret compromise | Malicious package, exposed `.env`, CI or signing token | Lockfile, dependency/secret scanning, least-privilege CI, rotation, protected branches, build provenance | Baseline scan/audit evidence must be kept current; no production secret inspection here |
| Operational data loss | Bad migration/deploy or backup cannot restore | Migration validation, backups, restore drills, rollback/runbook, environment separation | Mongo-dependent staging evidence and recovery drills open |

## PRIV-03 abuse cases and invariants

- A queue record without the current authenticated owner never reaches `fetch`.
- A user ID supplied in a payload never determines ownership.
- Health, medication, routine, journal, money, notes, unknown fields, arbitrary endpoints, methods, origins, headers, and tokens cannot enter the queue.
- Boolean `false`, numeric `0`, empty arrays, and supported partial mutations retain their intended values rather than being dropped by truthiness checks.
- Replay revalidates the owner immediately before network transmission so an account change during an asynchronous IndexedDB read is safe.
- Expired records and duplicate idempotency keys are deleted; validation conflicts remain visible for user action; authentication failures invalidate and purge private browser state.
- Logout, session expiry/invalidation, account change, role/status change, and successful Life deletion initiate browser-private-data removal.
- Another tab can temporarily block physical IndexedDB deletion, but it cannot authorize replay for the next account.
- A notification cannot navigate outside exact allowlisted same-origin Life routes.

## Security verification strategy

Use [OWASP ASVS 5.0](https://owasp.org/www-project-application-security-verification-standard/) as the control catalog and [OWASP Top 10:2025](https://owasp.org/Top10/2025/) as a risk communication aid. Maintain unit/contract tests for validators/serializers/authorization, integration tests with real MongoDB, cross-role and cross-owner negative tests, browser tests for storage/session/service-worker behavior, dependency and safe secret scans, upload/content fuzzing, provider callback tests, rate/abuse tests, and an independent penetration test before general availability.

Do not record a control as complete from source inspection alone when its security depends on browser lifecycle, proxy configuration, database indexes, deployment secrets, provider behavior, backups, or operator action.
