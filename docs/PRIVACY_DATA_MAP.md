# Privacy data map

Status: engineering working document for the 2026-09-03 checkout. It describes repository behavior and gaps; it is not legal advice or a certification.

## Data-flow principles

- MongoDB is the persistent application authority. Browser state is temporary UI/session state and never grants ownership or entitlement.
- Authentication, Creator ownership, learner ownership, Premium access, CMS/Admin authorization, and Life ownership are enforced by the server.
- Life data is private to its authenticated user. Creator or Admin product roles do not imply access to another user's Life records.
- Protected bodies, lessons, media, and resources are filtered or denied by server serializers/controllers.
- Provider-dependent behavior must remain unavailable when the provider is not configured and operational.
- Telemetry must exclude credentials, tokens, private bodies, free-text Life content, health details, financial values, journal text, and direct identifiers.

## System data map

| Data category | Subjects/source | Server authority and use | Browser/edge copies | Recipients/providers | Lifecycle and open work |
| --- | --- | --- | --- | --- | --- |
| Account identity and profile | Registered user; verification/login input | User/session models; authenticate and render account profile | HttpOnly cookies; minimal verification challenge metadata | Email/SMS only when configured | Session revocation and account deletion exist; validate statutory notices, recovery window, backups, and processor deletion |
| Credentials and security events | User and server | Bcrypt password hashes; hashed refresh tokens; OTP hashes; lockouts; audit records | Access/refresh cookies are HttpOnly; never local storage | Delivery provider receives necessary destination/message when configured | Secret/log redaction required; document security-log retention and access |
| Public editorial content | Editors/creators | Article domain, including Stories; publish/render/search | Public response/cache and page rendering | Public readers, crawlers; optional media/CDN | Published-only indexing; define revision, unpublish, legal-hold, and deletion policy |
| Comments and engagement | Reader input and server state | Moderation and aggregate engagement | Ephemeral form/UI state | Public readers receive allowlisted approved DTOs | PRIV-01 source/focused/regression acceptance complete; browser smoke remains |
| CMS/Admin operational data | Staff/Admin | Draft/full Content, users, roles, workflow, settings, logs, backups, media administration | In-memory only for protected client contexts; legacy durable keys removed; stale fetch/mutation results rejected by identity scope | Authorized operators and configured infrastructure | Complete browser acceptance for logout, expiry, account/role change and define operational record retention |
| Membership and entitlement | User and commercial operations | ReaderMembership and server entitlement resolution | Minimal capability/display state | Billing provider only after real integration | Checkout is unavailable without provider; define invoices, refunds, retention, reconciliation, and processor contracts |
| Creator and Learn | Creator/learner activity | CreatorProfile, content ownership, enrollments/progress, protected lesson resources | Ephemeral UI state | Public creator profile fields; authorized learners; media provider if real | Separate Creator Studio from Admin; prove protected-media lifecycle and learner deletion/export |
| Life tasks, habits, goals, events | Authenticated Life user | User-scoped MongoDB models for personal planning | Narrow queue may hold minimal task creation or habit/task/goal-action event data for at most 24 hours | No third party by default | Server export/delete exists; complete real-browser, backup, recovery, and multi-device tests |
| Life health, medication, routine, journal, money | Authenticated Life user | User-scoped MongoDB models | **Never queued by the PRIV-03 offline policy**; changes require a connection | No third party by default | Treat as highly sensitive; define field-level retention/export/deletion and support-access controls |
| Agent conversations and tool actions | Authenticated user | Conversation state, redacted tool execution summaries, hashed confirmation tokens | Ephemeral UI state; browser speech recognition is press-to-talk | AI provider only when configured and disclosed | No raw sensitive tool output in audit; complete provider DPIA/contract/retention review before launch |
| Newsletter/contact | Subscriber or correspondent | Subscription/preferences/contact handling | Form state | Email/support provider when configured | Document consent evidence, suppression, unsubscribe, grievance and deletion handling |
| Games/realtime | Players | Sessions/game state through server and Socket.IO | Session storage may retain limited play-with-friends state | Other players receive game-required state | Audit identifiers, chat/content, moderation, youth/gaming rules, flags, retention and abuse response before launch |
| Logs, metrics, readiness evidence | System/user interactions | Diagnostics, audit, aggregates | Browser may emit minimal events | Operators and configured observability provider | Use route templates/reason codes; prohibit bodies, query text, cookies, tokens, Life content and direct identifiers; set retention/access |
| Uploads/media metadata | Admin/creator/user upload | Public CMS uploads or protected asset metadata | Browser upload buffer/preview | Public asset consumers or protected provider when implemented | Public and protected pipelines must remain separate; malware/scanning/retention/provider deletion need proof |

## Life offline queue: field-level map

| Field | Purpose | Sensitivity/control |
| --- | --- | --- |
| `ownerId` | Bind record to the authenticated Mongo user ID | Required; mismatch discards; never display or emit to analytics |
| `operationType` | Select an allowlisted replay policy | Only `task.create` and `event.log` |
| `path` and `method` | Exact same-origin API target | Built/validated from strict templates; no arbitrary URL or headers |
| `payload` | Minimal replay data | Unknown fields removed/rejected; notes and sensitive Life domains excluded |
| `createdAt` / `expiresAt` | Bound exposure and show age | Maximum retention 24 hours |
| `clientMutationId` / `idempotencyKey` | Avoid duplicate replay | Random technical identifiers; duplicates discarded |
| `retryCount` / `status` / conflict metadata | Recovery UX | Retry bounded to five; conflict shows safe status, not server body |

The IndexedDB database is `myjourney-life-private`, schema version 2. Version 1 entries are unowned and are cleared during upgrade. The store is cleared on logout, invalid session, account change, role/status change, and Life-data deletion. If deletion is blocked by another open tab, the active-owner check still prevents cross-account replay; users must close other tabs to complete physical browser deletion. Browser storage is not encrypted and can be visible to someone with access to the browser profile or an active XSS foothold.

The Life service worker caches a versioned public shell only. It does not cache `/api` responses. Notification navigation accepts only a small set of exact same-origin Life paths; external, protocol-relative, credential-bearing, query/hash-bearing, control-character, and unknown targets fall back to `/life/today`.

## Data-subject and operator workflows

| Workflow | Current evidence | Required production evidence |
| --- | --- | --- |
| Access/export | Life export route; account/profile APIs | End-to-end export completeness, secure delivery, audit and response SLA |
| Correction | Profile and domain mutation routes | Document which records are correctable versus immutable audit evidence |
| Erasure | Life deletion plus account deletion/recovery flow | Backups, queues, derived data, providers, legal holds, retry/failure operations |
| Consent/notice | Product forms and settings vary by domain | Versioned notice, purpose, lawful basis, withdrawal effect, minors/guardians where applicable |
| Grievance/support | Contact/legal surfaces require LEGAL-01 review | Named operational owner, escalation, response evidence and India-specific review |
| Incident response | Security controls documented | Breach classification, processor notification, user/regulator workflows, exercises |

## Retention decisions still required

The 24-hour Life offline limit is implemented. Other categories need approved schedules covering primary records, logs, caches, backups, replicas, exports, uploads, provider copies, de-identified aggregates, legal holds, deletion failures, and restoration after a deletion request. “Deleted from the primary collection” must not be used as a claim of complete erasure until those systems are evidenced.

Review the map against the [Digital Personal Data Protection Act, 2023](https://www.meity.gov.in/digital-personal-data-protection-act-2023-4), the [Digital Personal Data Protection Rules, 2025](https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa), applicable IT/intermediary rules, consumer protection and dark-pattern requirements, contractual obligations, and the actual deployment/providers. Qualified legal and privacy review remains mandatory.
