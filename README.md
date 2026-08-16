# MyJourney

MyJourney is a full-stack publishing, learning, private life-management, and social play platform. It combines public Articles and Stories with account-level Premium access, private Life/LifeOS tools, Creator profiles and authoring, Courses and lessons, and a CMS/Admin surface.

The repository is a single npm application: Parcel serves the React client and Express serves the API. MongoDB is required for persistent application behavior, including authentication.

## Current product areas

| Area | Current repository state |
| --- | --- |
| Articles | Implemented public catalog/detail and CMS management, with Free/Premium body protection. |
| Stories | Implemented on the Article domain with dedicated structured sections and approved render layouts. |
| MyJourney Life | Implemented private Premium workspace for today, habits, routines, tasks, goals, health, money, journal, insights, search, notifications, export, and deletion. Optional AI, push, and external integrations require providers. |
| MyJourney Premium | Implemented global account-level entitlement model. Billing durations are billing choices, not separate feature tiers. Checkout/webhooks are unavailable until a billing provider is implemented. |
| Creators | Implemented application/review workflow, public directory/profile, follow state, ownership, and Creator Studio. Earnings/payout operations are foundation only. |
| Learn | Implemented Topics, Course catalog/detail, lesson previews and gates, enrollment/progress, Continue Learning, and Video/Podcast/Resource catalogs. Secure media delivery is not configured. Exams expose metadata only. |
| CMS/Admin | Implemented under `/cms/*`, backed by server-side Admin authorization. |
| Games/multiplayer | Play Life and Play With Friends are implemented; local realtime can run without Redis, while scaled production requires Redis. |
| MyJourney Agent | Implemented unified assistant platform (`/agent` and floating companion) with server-authoritative tool registry, voice press-to-talk, cryptographic single-use confirmation tokens, and deterministic zero-cost Mock provider. |

See [Features](docs/FEATURES.md) for the engineering status inventory and [Agent Reference](docs/AGENT.md) for full Agent specifications.


## Technology stack

- Frontend: React 19, React Router 6, Framer Motion, Socket.IO client, and plain CSS.
- Backend: Node.js, Express 4, Socket.IO, Mongoose 8, and optional Redis adapters.
- Database: MongoDB through Mongoose.
- Authentication: bcrypt passwords; JWT access/refresh tokens in HttpOnly cookies; persistent refresh-token/session records; optional CSRF enforcement.
- Build: Parcel 2 and `concurrently`.
- Tests: Jest 29 and Supertest, with Socket.IO integration tests.

## Prerequisites

- Node.js and npm. The repository does not currently declare an `engines` support range. The 2026-08-16 stabilization audit used Node `22.16.0` and npm `10.5.2`.
- A reachable MongoDB database for local development.
- A local `.env` created from `.env.example` and populated with development-only values.
- Redis only when testing Redis-backed or horizontally scaled multiplayer behavior.

Never commit `.env`, credentials, provider tokens, or production connection strings.

## Local development

```bash
npm ci
```

Copy `.env.example` to `.env`, set the development database and auth secrets, then start both services:

```bash
npm start
```

- Client: `http://localhost:1234`
- API: `http://localhost:5000`
- Health: `http://localhost:5000/api/health`

MongoDB must be reachable before startup. The server deliberately aborts instead of serving database-backed routes while disconnected. See [Development](docs/DEVELOPMENT.md) for setup and troubleshooting.

## Environment configuration

Core variables:

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Runtime environment; production enables stricter guards. |
| `PORT` / `SERVER_PORT` | Express API port; defaults to 5000. |
| `CLIENT_URL` | Allowed browser origin and email-link base. |
| `MONGO_URI` | MongoDB connection string. |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | JWT signing secrets. Required in production. |
| `ACCESS_TOKEN_TTL` / `REFRESH_TOKEN_TTL_DAYS` | Session token lifetimes. |
| `COOKIE_SECURE` | Enables Secure auth/CSRF cookies. |
| `CSRF_ENABLED` | Enables double-submit CSRF checks; defaults on outside development. |
| `PARCEL_AUTH_API_URL`, `PARCEL_API_URL`, `PARCEL_PROXY_TARGET` | Client API base or Parcel proxy target. |

Optional provider groups include SMTP, Twilio/SMS, VAPID web push, Redis/multiplayer, news providers, Life AI, secret-vault encryption, bootstrap Admin, cache, and storage drivers. The authoritative names and behavior are documented in [Development](docs/DEVELOPMENT.md). Do not put values in documentation.

## Main client routes

| Route | Area |
| --- | --- |
| `/` | Public home |
| `/articles`, `/articles/:slug` | Articles |
| `/stories`, `/stories/:slug` | Stories |
| `/premium` | Premium overview |
| `/profile`, `/profile/subscription` | Account and subscription |
| `/life/*` | Private Life workspace |
| `/creators`, `/creators/:slug`, `/creators/apply` | Creator directory, profiles, and applications |
| `/creator-studio/*` | Active Creator workspace |
| `/learn`, `/learn/courses`, `/learn/courses/:slug`, `/learn/courses/:slug/lessons/:lessonId` | Learn and Courses |
| `/learn/videos`, `/learn/podcasts`, `/learn/resources`, `/learn/exams` | Learn formats |
| `/cms/*` | CMS/Admin UI |
| `/play-life`, `/play-with-friends/*` | Games and multiplayer |

Authentication routes include `/login`, `/register`, OTP verification, password reset, profile editing, and logout through the account UI.

## Tests and build

```bash
npm run test:life
npm run test:premium
npm run test:creator
npm run test:learn
npm run test:multiplayer
npm test -- --runInBand
npm run check:server
npm run build
git diff --check
```

See [Testing](docs/TESTING.md) for focused suites, integration expectations, and manual browser QA rules.

## Development Creator/Learn fixtures

These commands are **development only**. Confirm `NODE_ENV=development` and a local/development `MONGO_URI` first.

```bash
npm run seed:creator-demo
npm run seed:creator-demo:reset
```

The seed is idempotent and the reset is scoped to recognized fixture identities. Fixture accounts have unusable password hashes and are not general login credentials.

## Migrations

Migrations are explicit; server startup does not apply them.

```bash
npm run migrate -- status
npm run migrate:validate
npm run migrate
```

The final command applies all pending migrations to the configured database. Never run it against staging or production without an approved change procedure and backup. See [Data and migrations](docs/DATA_AND_MIGRATIONS.md).

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Feature status](docs/FEATURES.md)
- [Development](docs/DEVELOPMENT.md)
- [Testing](docs/TESTING.md)
- [Data and migrations](docs/DATA_AND_MIGRATIONS.md)
- [Security engineering](docs/SECURITY.md)
- [Play With Friends](docs/PLAY_WITH_FRIENDS.md)
- [Life Auction](docs/LIFE_AUCTION.md)
