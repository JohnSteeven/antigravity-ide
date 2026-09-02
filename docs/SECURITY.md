# Security engineering notes

This document describes verified repository behavior. It is not a formal security certification or penetration-test report.

## Authentication

- Passwords are hashed with bcrypt; registration uses cost 12.
- Access and refresh JWTs use separate secrets.
- Refresh JWTs include a random `jti`; only hashed refresh tokens are persisted.
- Access/refresh tokens are delivered in HttpOnly, SameSite=Lax cookies and are not stored by the client in local storage.
- `COOKIE_SECURE=true` is required for HTTPS production cookies.
- Refresh rotation revokes the old token and deactivates its sessions before issuing a new session.
- Logout revokes the persisted refresh token/session and clears cookies.
- Password reset/change revokes active sessions.
- Repeated failed password logins trigger a temporary account lock window; an expired lock starts a fresh failure window.
- Unknown-account password logins perform a dummy bcrypt comparison, and password-reset request responses use one enumeration-resistant message.

OTP challenges are created and verified only by the server. They use cryptographically generated six-digit codes, bcrypt hashes at rest, five-minute expiry, single-use atomic consumption, a five-attempt cap, and a one-minute resend cooldown. OTP request routes are limited by both request source and a hashed account key. The retired browser OTP service and its local code/user challenge store have been removed; local storage retains only non-secret server-issued challenge metadata needed to resume the verification screen and has no verification authority. Codes and destinations are not logged. Development may return `devCode` only when `NODE_ENV` is not `production`; production requires a real email/SMS provider and fails honestly when delivery is unavailable.

The client does not create browser-only fallback users or sessions when the API/database is unavailable. Social login is unavailable until a real provider flow exists.

## CSRF and browser origins

When `CSRF_ENABLED=true`, mutations require a CSRF token that matches the readable SameSite cookie. The client obtains it from `/api/auth/csrf-token` and sends `x-csrf-token`.

Client auth cleanup expires only the HttpOnly access/refresh cookie names; it does not enumerate and delete the readable CSRF cookie. This keeps the cached header token and double-submit cookie aligned across anonymous `/me`/refresh failures and the next login or mutation.

CORS allows the configured `CLIENT_URL` with credentials. Production should use explicit HTTPS origins, Secure cookies, and CSRF enforcement.

## Authorization and RBAC

- `authenticate` validates JWTs, active User status, and token version.
- `requireAdmin` protects CMS/Admin management and review routes and accepts only the exact `Admin` role; `Editor` is not treated as Admin.
- `requireActiveCreator` protects Creator Studio.
- Creator Studio and CMS/Admin remain separate roles/surfaces.
- Object ownership is resolved from authenticated server state; client owner flags are informational only.
- Settings registries, content modeling, layouts, component manifests, workflow/version state, dashboards, operational tooling, and legacy CMS AI completions are Admin-only. Their public runtime contracts are separate and minimal (for example active theme, evaluated feature status, published page-by-slug, navigation tree, and generated design-token CSS).
- Reader profile, progress, Continue Reading, and Completed endpoints require authentication and scope every query to `req.user`; arbitrary client user/session IDs are not ownership credentials. The profile DTO allowlists basic account fields and does not expose email/mobile verification, authentication/security fields, notification history, or another user's private preferences/history. Progress/library writes verify `contentType=article`, so Stories cannot enter Article Reader history.
- The Reader client binds response application to the current authenticated identity, clears library data on identity loss/change, and rejects late mutation results from a prior account. Reading-progress cleanup also rechecks current auth enablement before sending.
- Global Admin media state is neither fetched nor restored for anonymous/Reader sessions and is cleared when Admin authority is lost. Anonymous Agent capability discovery does not fetch private conversation history.

## Premium enforcement

Premium is resolved server-side from ReaderMembership and access dates/status. Database lookup failures fail closed.

- Anonymous/Free Article and Story responses do not contain Premium bodies/structured sections.
- Public Article/Story listings omit full bodies and internal ownership/workflow fields. Public detail serialization sanitizes legacy stored rich HTML before it reaches React raw-HTML renderers.
- Non-preview Premium lessons return 403 without entitlement.
- Locked Learn serializers omit bodies, transcripts, protected asset IDs, and URLs.
- Premium search/indexing excludes protected full text.
- Billing duration does not grant a different tier.
- Subscription upgrades cannot be manufactured by the client; provider checkout is unavailable until implemented.

## Creator and learner boundaries

- Public Creator directory queries require active profiles.
- Creator ownership is derived from CreatorProfile.userId.
- Follow identities are unique and self-follow is denied.
- Creator A cannot mutate Creator B's content through Studio services.
- Learner enrollments/progress are scoped to authenticated user IDs.
- Admin Creator/Topic/report review requires Admin middleware.

## Life privacy

- Life routes require authentication and, except for export/delete privacy routes, `life_access` entitlement.
- Life queries and mutations scope data to the authenticated user.
- Creator access does not grant Life access or visibility.
- Life export/deletion operates only on the requesting user's Life-owned models.
- Losing Premium access does not erase Life data.

## Protected media and resources

ProtectedMediaAsset stores metadata/ownership, not a claim of secure streaming. The default provider reports upload, scanning, adaptive streaming, and signed delivery unavailable. Do not expose external URLs as a substitute for protected Premium delivery.

General CMS uploads are public assets under `/uploads` and accept only allowlisted MIME/extension pairs with magic-byte checks; executable formats such as HTML, SVG, and JavaScript are rejected. ProtectedMediaAsset delivery never falls back to this public mount.

## Rich content and CMS theme safety

Rich Article/Story HTML is sanitized on write and again on public serialization. Inline styles, scripts, event handlers, data-image URLs, and untrusted iframes are removed. Video embeds are limited to the configured YouTube/Vimeo host allowlist, and new-tab links receive `noopener noreferrer`.

Theme writes accept only allowlisted design-token keys and safe values. Raw CSS and JavaScript are rejected and legacy stored raw-code fields are dormant: they are not selected for normal reads, emitted publicly, previewed, or compiled. Public callers receive only the active sanitized theme contract; theme lists, drafts, and ownership metadata are not public. Activation fails when critical text/surface contrast pairs do not meet the WCAG threshold.

Persistent Article/Story bodies are never initialized from bundled fixtures or restored from browser local storage. On Admin privilege loss or an API failure, the shared content context clears server-backed content instead of retaining a privileged/stale body. Public Article detail always resolves through the server serializer; engagement UI reconciles only from successful server responses.

## MyJourney Agent security and privacy

- **Server-Authoritative Identity**: Conversations require authenticated sessions; identity is never accepted from client payloads. Requests to `/api/agent/v1/conversations*` return 401 for anonymous callers.
- **Model Isolation**: Models never have direct database access. All data access occurs through registered tools with strict Zod validation schemas.
- **Defense Against Prompt Injection**: Retrieved RAG document text or model outputs have zero authority over tool permissions or authorization. Tool execution passes through server-side `authorizeTool` which enforces authentication, role, and Premium entitlements independently of model prompt contents.
- **Tool Execution Privacy**: `AgentToolExecution.outputSummary` is strictly redacted by the orchestrator before storage (e.g. storing item counts or high-level status). Raw health data, journal text, financial figures, private lessons, and full RAG chunks are never stored in audit records or logs.
- **Cryptographic Confirmation Tokens**: `AgentConfirmationToken` persists only the SHA-256 hash (`tokenHash`). The raw token is returned to the client once. Tokens are short-lived, single-use (consumed atomically via `findOneAndUpdate`), and bound to `(userId, conversationId, toolKey, argsHash)`. Replay or cross-action use is impossible.
- **Rate & Concurrency Limiting**: User-level token-bucket rate limiting and concurrency locking prevent denial-of-service or runaway model execution.
- **Voice Privacy**: Voice input uses an explicit press-to-talk action. Speech recognition runs in the user's browser; audio is neither streamed continuously nor stored on the server.

## Fixtures and production guards

Creator/Learn fixture helpers throw in `NODE_ENV=production`, use unusable password hashes, avoid revenue/payout claims, and scope reset to recognized fixture identities. Operators must also verify the connected database is local/development.

Bootstrap Admin is disabled by default and requires explicit environment enablement plus supplied credentials. Disable it again after first-use bootstrap.

Legacy credential-bearing Admin bootstrap, password-reset, and phase/API verifier scripts are disabled. Administrator creation uses only the opt-in, non-destructive `BOOTSTRAP_ADMIN_*` seeder flow; password recovery uses the tokenized application flow. Verification and request logs must not print passwords, OTPs, CSRF/JWT/refresh tokens, cookies, private content bodies, or raw personal identifiers.

## Public metadata privacy

Public SEO JSON-LD and sitemap reads query only published, non-deleted Articles and published public Pages. Unsupported JSON-LD entity types are rejected, and non-qualifying or missing records return 404 instead of an empty or manufactured schema document.

Production-readiness audits are Admin-only, read-only, and fail closed. They report configured evidence without exposing secret values and do not claim that an external provider was exercised when only its configuration was inspected.


## Account deletion and audit

Account deletion requires password confirmation, has a seven-day recovery period, revokes sessions, and later removes private account data while preserving published Creator content in deactivated form.

AuditLogger maps events into the ActivityLog schema with action, description, resource, user, request context, module, status, and optional diff. Audit write failure is logged and must not silently alter authorization outcomes.

## Operational requirements

- Keep `.env`, JWT secrets, Mongo credentials, provider tokens, VAPID private keys, and secret-vault keys out of Git and documentation.
- Use a strong 32-byte `SECRET_VAULT_KEY` only when the vault is explicitly enabled.
- Require Redis for horizontally scaled realtime nodes.
- Review and apply every pending migration through the approved environment-specific migration process before launch; the current catalog is documented in `DATA_AND_MIGRATIONS.md`.
- Review rate limits, cookie lifetime alignment, provider credentials, CORS, CSRF, backups, TLS, and log handling for each deployed environment.
- Set a unique production `REQUEST_LOG_SALT`. Request logs contain only route templates, status/timing, request IDs, and salted user hashes; they exclude raw URL/query/body/cookie/header data. Error logs exclude messages, stack traces, cast values, and database documents.
- Audit change diffs are recursively redacted for passwords, tokens/secrets, cookies, payment identifiers, Article/private bodies, transcripts, journal, health, and financial fields before persistence.
