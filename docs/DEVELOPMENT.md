# Local development

## Install and configure

On a clean checkout:

```bash
npm ci
```

Copy `.env.example` to `.env`. Use development-only values and keep `.env` untracked.

The repository declares Node `>=20` and npm `>=10`. The 2026-08-23 hardening audit ran with Node `22.16.0` and npm `10.5.2`; those exact versions are the verified baseline, while the declared ranges are the supported minimum contract.

## Database expectation

MongoDB is mandatory for the API. Set `MONGO_URI` to the intended local/development database, or rely on the code's localhost development default when no variable is present. `MONGODB_URI` is accepted as a lower-precedence alias. `MONGO_SERVER_SELECTION_TIMEOUT_MS` controls initial selection and defaults to 8000 ms. Do not copy connection credentials into documentation, logs, or commits.

Do not replace configured databases with hard-coded localhost values. Before seeding or applying migrations, confirm both `NODE_ENV` and the actual connected host/database.

## Start

```bash
npm run doctor
npm start
```

This starts:

- Express/Socket.IO on port 5000 by default;
- Parcel on port 1234;
- the Parcel `/api`, `/uploads`, and `/socket.io` proxy when a same-origin client base is used.

Useful single-process commands:

```bash
npm run server
npm run client
npm run start:ui
```

For the isolated core browser smoke, install Chromium once and run:

```bash
npx playwright install chromium
npm run test:e2e
```

Playwright owns ports 1235/5001 and defaults to the isolated `myjourney_e2e` Mongo database. `E2E_MONGO_URI` is accepted only when its database name ends in `_e2e` or `_test`. Do not point the smoke at development, staging, or production data. The setup creates deterministic Reader and published-Article fixtures, does not send OTP/email/SMS, and never applies migration 011.

`npm run doctor` checks the current Node declaration, standard ports, Mongo configuration/reachability, and required production variables without printing connection credentials or secret values.

`npm run start:ui` is the supported frontend-only mode. It starts Parcel only. It does not start Express, connect MongoDB, apply migrations, seed data, or initialize schedulers/jobs. API-dependent screens therefore show their honest unavailable states.

The expected healthy startup order is:

```text
[preflight] Full-stack startup checks passed
MongoDB connected
CMS permissions/roles seeded
multiplayer realtime started
MyJourney API running
scheduler initialized
Parcel server running
```

If MongoDB cannot be selected within the startup timeout, the API exits. That is intentional; there is no functioning in-memory replacement for Mongo-backed services.

## Environment variables

### Core runtime and auth

- `NODE_ENV`, `PORT`, `SERVER_PORT`, `CLIENT_URL`, `MONGO_URI`
- `MONGODB_URI` (lower-precedence alias), `MONGO_SERVER_SELECTION_TIMEOUT_MS`, `PARCEL_PORT`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL_DAYS`
- `COOKIE_SECURE`, `CSRF_ENABLED`
- `PASSWORD_MIN_LENGTH`, `PASSWORD_HISTORY_LIMIT`
- `FORGOT_PASSWORD_LIMIT`, `FORGOT_PASSWORD_WINDOW_MS`
- `CHANGE_PASSWORD_RATE_LIMIT`, `CHANGE_PASSWORD_WINDOW_MS`
- `VERIFICATION_TOKEN_TTL_HOURS`
- `PARCEL_AUTH_API_URL`, `PARCEL_API_URL`, `PARCEL_PROXY_TARGET`

Production validates required Mongo/JWT/multiplayer secrets. Development fallbacks are not production-safe.

### Email, SMS, and push

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `MAX_EMAIL_RETRIES`
- `SMS_PROVIDER`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
- `VAPID_SUBJECT`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`

Development OTP responses include a dev code and can log provider-unavailable delivery. Production does not return the code.

### Multiplayer and games

- `MULTIPLAYER_ENABLED`, `MULTIPLAYER_GUEST_SECRET`, `MULTIPLAYER_ANALYTICS_SALT`
- `REQUEST_LOG_SALT` (required in production; hashes request-log user identifiers)
- `MULTIPLAYER_ANALYTICS_RETENTION_DAYS`, `MULTIPLAYER_ROOM_TTL_HOURS`, `MULTIPLAYER_HOST_GRACE_SECONDS`
- `REDIS_URL`, `MULTIPLAYER_REQUIRE_REDIS`
- `LIFE_AUCTION_ENABLED`, `LIFE_AUCTION_SEALED_ENABLED`, `LIFE_AUCTION_EVENTS_ENABLED`, `LIFE_AUCTION_GROUP_EVENTS_ENABLED`

### MyJourney Agent & AI

- `AGENT_ENABLED`: Enable or disable the entire Agent subsystem (default: `true`).
- `AGENT_PROVIDER`: Active AI provider (`mock` for deterministic development, `local` for local model server, default: `mock` in development, `""` in production).
- `AGENT_LOCAL_ENDPOINT`: Base URL for OpenAI-compatible local model endpoint (e.g. `http://localhost:11434/v1`).
- `AGENT_LOCAL_HEALTH_ENDPOINT`: Health check URL for the local model endpoint (e.g. `http://localhost:11434/api/tags`).
- `AGENT_LOCAL_MODEL`: Local model identifier (e.g. `llama3`, `mistral`, default: `local-model`).
- `AGENT_LOCAL_API_KEY`: Optional API key for the local endpoint.
- `AGENT_PROVIDER_TIMEOUT_MS`: Provider HTTP timeout (default: `15000` ms).
- `AGENT_CONFIRMATION_TTL_SECONDS`: Expiration window for single-use confirmation tokens (default: `300` s / 5 min).
- `AGENT_TELEMETRY_SALT`: Server salt for hashing user identifiers in telemetry logs (default: `myjourney-agent`).
- `AGENT_MESSAGE_MAX_CHARS`: Hard cap on user message length (default: `4000` chars).
- `AGENT_ASSISTANT_MAX_CHARS`: Hard cap on assistant message length (default: `16000` chars).
- `AGENT_RATE_LIMIT_MAX`: Max requests per rate window per user (default: `120` dev / `30` prod).
- `AGENT_CONCURRENCY_PER_USER`: Max concurrent requests per user (default: `2`).

### Optional platforms/providers

- `LIFE_AI_ENABLED`
- `SECRET_VAULT_ENABLED`, `SECRET_VAULT_KEY`
- `NEWS_PROVIDER`, `NEWS_API_KEY`, `GNEWS_API_KEY`, `GUARDIAN_API_KEY`, `MEDIASTACK_API_KEY`
- `CACHE_DRIVER`, `STORAGE_DRIVER`
- `QUEUE_DRIVER` (the repository currently implements only a single-process memory queue; other selections fail closed)
- `WEBAUTHN_RP_ID`
- `BOOTSTRAP_ADMIN_ENABLED`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`
- `SEED_DEMO_DATA`

Load/preview scripts also use dedicated `LIFE_LOAD_*` and `PREVIEW_*` variables. Read the relevant script before using them.

## Common errors

### `MongooseError: Operation ... buffering timed out`

This usually means multiple routes/workers queried before Mongoose had a usable connection. Check the first startup error, not each timed-out model:

1. Confirm MongoDB is running and reachable.
2. Confirm `MONGO_URI` points to the intended development database.
3. Check authentication, DNS/network, Atlas IP allow-list, and TLS settings without printing the URI.
4. Confirm startup logs `MongoDB connected` before the API listener and scheduler.
5. Use `npm run migrate -- status` only after connectivity works.

Current startup fails fast on the initial connection, which prevents downstream buffering cascades. Scheduler entry points also skip work while Mongoose is disconnected.

### Login or signup unavailable

- Confirm `/api/health` and the database are available.
- Confirm the client API origin/proxy matches `CLIENT_URL` and cookies are allowed.
- For cross-origin local calls, both sides should use consistent `localhost` or `127.0.0.1` conventions.
- Check `COOKIE_SECURE=false` for plain-HTTP development.
- If CSRF is enabled, verify `/api/auth/csrf-token`, the CSRF cookie, and `x-csrf-token` header.
- Registration OTP requires the database User ID; development exposes `devCode` only outside production.
- Auth is server-authoritative. A network failure must not fall back to a browser-only account/session.

### Learn errors

Start with `/api/learn`. It queries Topic plus Creator/Learn content collections, so a shared Mongo failure can surface as a Learn page error. Then inspect individual `/api/learn/courses`, format endpoints, detail responses, entitlements, and fixture/migration state.

### `MongooseServerSelectionError: Server selection timed out`

This means the configured Mongo target was not selectable within the configured timeout; it does not prove a specific cause. Run `npm run doctor`, then verify the local Mongo service or remote DNS/network/allow-list/TLS configuration. Startup reports only the sanitized host/database target and never prints credentials. Do not apply migrations or replace persistence while connectivity is unresolved.

### Port already in use

The standard ports are 5000 (API) and 1234 (Parcel). Startup preflight fails with a clear message when either listener is already present. Use `npm run doctor` to distinguish a port conflict from Mongo unavailability. Stop the existing project process or configure the intended port; do not launch multiple `npm start` trees against the same worktree.

### Parcel ENOENT: no such file or directory, unlink (Windows)

Symptom:

```
Error: ENOENT: no such file or directory, unlink
  C:\...\AppData\Local\Temp\ide antigravity.abc123.css...
```

The error can be caused by overlapping Parcel processes or an external Windows temp-file race. First run `npm run doctor`; if port 1234 is occupied, stop that existing process. Normal startup never deletes temp files because deleting an active atomic-write file can create the same ENOENT race.

If no Parcel listener remains and the error persists, the explicit recovery command is:

```bash
npm run clean:parcel-temp
npm start
```

The cleanup command refuses to run while port 1234 is occupied and removes only regular project-prefixed temp files older than one hour. It does not touch source, `dist/`, or Parcel cache directories.

## Creator/Learn development fixtures

After confirming a local/development Mongo connection:

```bash
npm run seed:creator-demo
npm run seed:creator-demo
npm run seed:creator-demo:reset
```

The second seed should report identical entity totals. Reset removes only recognized fixture identities. Never run these commands with `NODE_ENV=production` or against an unverified database.

## Safe development practices

- Inspect `git status` and pre-existing diffs before editing.
- Do not log Mongo URIs, JWTs, OTPs outside development, provider credentials, or user private data.
- Do not auto-apply migrations as a workaround for connectivity.
- Use random, temporary, self-cleaning audit identities for local auth testing; never add shared universal passwords.
- Keep provider boundaries explicit and unavailable when not configured.
- `CACHE_DRIVER=redis`, non-memory `QUEUE_DRIVER`, and non-local `STORAGE_DRIVER` currently fail closed because distributed adapters are not implemented in this repository. Do not select them until the corresponding adapter and integration tests are added.
- Do not use the retired `bootstrapAdmin`, `resetAdminPassword`, `verifyApis`, `verifyPhase4A`, or `verifyPhase4B` scripts. They exit without connecting or mutating data. Use the opt-in bootstrap seeder, tokenized password recovery, and Jest/API test suites documented above.
