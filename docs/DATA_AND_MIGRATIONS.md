# Data and migrations

## Persistence

MyJourney uses MongoDB through Mongoose. Auth, CMS/content, Premium, Life, Creator, Learn, multiplayer persistence, notifications, and audit data all depend on the configured database. The HTTP server does not start when the initial Mongo connection fails.

Multiplayer runtime persistence never falls back to in-memory state after a disconnect. In-memory room repositories are limited to isolated tests/load harnesses. This prevents ephemeral room creation and split-brain state when Mongo is unavailable.

Never print or commit a full Mongo URI. Confirm the connected host and database name separately before destructive local operations.

## Migration mechanism

`server/migrations/MigrationRunner.js` discovers zero-padded migration files, orders them by filename, and records applied names in `__cms_migrations`.

Current ordered migrations:

1. `001-create-multiplayer-platform`
2. `002-multiplayer-party-game-instances`
3. `003-life-auction-content-packs`
4. `004-life-os-foundation`
5. `005-life-os-advanced`
6. `006-myjourney-premium-foundation`
7. `007-creator-learn-foundation`
8. `008-agent-foundation`
9. `009-auth-session-expiry`
10. `010-theme-safety-foundation`
11. `011-reader-data-foundation`

Server startup does not run these automatically.

Launch, deployment, and test-execution collections are historical evidence stores. Read endpoints never seed them. New release records default to non-production, deployment environment/status must be supplied explicitly, and absent test coverage remains `null`; these safe defaults do not rewrite existing records and require no data migration.


## Commands

Read status:

```bash
npm run migrate -- status
```

Validate indexes declared by applied migrations:

```bash
npm run migrate:validate
```

Apply all pending migrations:

```bash
npm run migrate
```

Rollback is supported by the runner, but should be used only with a reviewed recovery plan:

```bash
npm run migrate -- down 1
```

These commands connect without running application seeders. `status` and `validate` only inspect migration metadata/indexes; `up` and `down` mutate only through the explicitly selected migration operation.

## Environment separation

- Local: status/validation are safe read-oriented checks after connectivity is confirmed. Apply only when the local schema/index prerequisites are understood.
- Staging: use an approved migration window, backup, status capture, application, validation, and smoke test.
- Production: never migrate from an ad hoc developer session. Require explicit authorization, backup/restore readiness, review, observability, and rollback planning.

The 2026-08-23 local audit found migrations 001–010 all pending in the `myjourney` database. They were not applied automatically. Runtime and tests passed, but the unique/query/TTL indexes and normalization encoded by those migrations remain a local launch prerequisite. Migration 009 backfills legacy Session expiry from its linked RefreshToken and fails orphaned sessions closed. Migration 010 corrects only the known light surface/panel/muted defaults on the built-in Dark Pro theme; custom themes are untouched. Re-run status because this observation is environment-specific.

Migration 011 moves saved/liked/bookmarked Article relations from `User.profile` to `ReaderProfile`, removes deprecated parallel Reader/activity fields, normalizes authenticated ReadingProgress records, merges competing `(userId, articleId)` rows without losing maximum progress or accumulated time, and creates the partial unique authority index. It preserves anonymous legacy rows but the authenticated Reader API does not use them. Legacy completion rows without a real `completedAt` are not assigned an inferred timestamp. This migration was created for reviewed application and is not applied by this change.

Playwright browser smoke setup uses only a database whose name ends in `_e2e` or `_test` (default `myjourney_e2e`). It upserts deterministic test-owned users/content and resets only their Reader/session state. The smoke proves new ReaderProfile and ReadingProgress writes without depending on migration 011; it does not migrate legacy Reader data or apply any migration.

Migration index validation compares key order and security-relevant options (including unique, sparse, TTL, partial-filter, and collation settings); an index is not accepted merely because its name matches. Migration 008 uses a partial unique Agent-message idempotency index without the mutually exclusive `sparse` option.

## Creator/Learn demo seed

```bash
npm run seed:creator-demo
npm run seed:creator-demo:reset
```

Safety properties:

- fails closed when `NODE_ENV=production`;
- deterministic fixture emails, slugs, stable keys, and Creator keys;
- 12 public active demo Creators plus workflow-only non-public personas;
- upserts Topics, profiles, applications, content, lessons, follows, and analytics;
- no fixture login password, self-follow, duplicate follow, fabricated revenue, or payout state;
- reset targets only recognized fixture identities and their dependent data.

The environment guard does not prove that a non-production URI is safe. Operators must verify the actual connected database before running either command.

## Retention and lifecycle

Premium cancellation and Life data deletion are separate operations. Canceling or expiring Premium removes access; it does not delete Life records. Paid cancellation retains access through the current paid period.

Life offers authenticated JSON export and explicit Life-data deletion. `privacyService` scopes export/deletion to the requesting user across all Life-owned models and Life-source notifications.

Account deletion:

1. requires the password plus exact confirmation text;
2. schedules deletion seven days later;
3. increments token version and revokes sessions immediately;
4. can be canceled before the scheduled time;
5. is purged by the scheduled account-deletion worker.

Permanent deletion removes auth, ReaderProfile/ReadingProgress/ReadingCollection, subscription/billing, Life, Creator application/review, learner progress/events, follows, reports, and notifications. Owned Creator profiles are deactivated and detached; published Creator content is intentionally preserved.

### Agent data lifecycle

- **AgentConversation & AgentMessage**: Soft-deleted via `isDeleted: true` when a user requests account deletion, and excluded by default via pre-find query hooks. Purged during permanent account deletion.
- **AgentConfirmationToken**: Automatically expired and removed by MongoDB TTL background index on `expiresAt` (`expireAfterSeconds: 0`).
- **AgentToolExecution**: Persisted for audit and compliance with redacted operational summaries only; retained up to `AGENT_TOOL_AUDIT_RETENTION_DAYS` (default: 90 days).

## Fixture and test hygiene


- Test records must be named unambiguously and cleaned after the suite.
- Do not delete real user/content data to work around schema errors.
- Do not reuse production credentials or provider IDs in fixtures.
- Treat `uploads/`, `.env`, backups, and database exports as private operational data.
