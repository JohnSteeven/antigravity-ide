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
- Repeated failed password logins trigger an account lock window.

The client does not create browser-only fallback users or sessions when the API/database is unavailable. Social login is unavailable until a real provider flow exists.

## CSRF and browser origins

When `CSRF_ENABLED=true`, mutations require a CSRF token that matches the readable SameSite cookie. The client obtains it from `/api/auth/csrf-token` and sends `x-csrf-token`.

CORS allows the configured `CLIENT_URL` with credentials. Production should use explicit HTTPS origins, Secure cookies, and CSRF enforcement.

## Authorization and RBAC

- `authenticate` validates JWTs, active User status, and token version.
- `requireAdmin` protects CMS/Admin management and review routes.
- `requireActiveCreator` protects Creator Studio.
- Creator Studio and CMS/Admin remain separate roles/surfaces.
- Object ownership is resolved from authenticated server state; client owner flags are informational only.

## Premium enforcement

Premium is resolved server-side from ReaderMembership and access dates/status. Database lookup failures fail closed.

- Anonymous/Free Article and Story responses do not contain Premium bodies/structured sections.
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


## Account deletion and audit

Account deletion requires password confirmation, has a seven-day recovery period, revokes sessions, and later removes private account data while preserving published Creator content in deactivated form.

AuditLogger maps events into the ActivityLog schema with action, description, resource, user, request context, module, status, and optional diff. Audit write failure is logged and must not silently alter authorization outcomes.

## Operational requirements

- Keep `.env`, JWT secrets, Mongo credentials, provider tokens, VAPID private keys, and secret-vault keys out of Git and documentation.
- Use a strong 32-byte `SECRET_VAULT_KEY` only when the vault is explicitly enabled.
- Require Redis for horizontally scaled realtime nodes.
- Apply migrations 005–007 before launch under an approved migration process so privacy, entitlement, Creator/Learn, and uniqueness indexes are present.
- Review rate limits, cookie lifetime alignment, provider credentials, CORS, CSRF, backups, TLS, and log handling for each deployed environment.
