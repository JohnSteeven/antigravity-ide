# MyJourney architecture

## Runtime shape

`npm start` launches two processes with `concurrently`:

1. `node server/index.js` starts the Express/Socket.IO API on port 5000.
2. `parcel index.html --port 1234 --no-cache` serves the React client.

The API connects to MongoDB before opening the HTTP listener. A failed initial connection aborts server startup. After a successful connection, the idempotent CMS role/permission seeder runs, Socket.IO attaches, the listener opens, and background schedulers start.

## Frontend organization

- `src/App.js` owns `createBrowserRouter`, global providers, public/protected route composition, and lazy loading for Life, Creator, Learn, and games.
- `src/components/` contains shared/public/account/CMS UI.
- `src/stories/` contains Story list/detail rendering.
- `src/features/` contains Premium, Life, Creator, Learn, Play Life, and multiplayer feature clients.
- `src/context/` owns authentication, CMS, theme, and feature contexts.
- `src/services/` and feature-local API modules call `/api/*` with credentials.

This is a client-rendered React application. Parcel returns the same SPA shell for client routes; React Router selects the page and error state.

## Backend organization

- `server/index.js`: Express composition, middleware ordering, route registration, Mongo-gated startup, Socket.IO, scheduler start, and shutdown.
- `server/routes/`: HTTP route boundaries.
- `server/controllers/`: general HTTP controllers.
- `server/services/`: auth, subscriptions, entitlements, CMS/platform services, notifications, and account deletion.
- `server/models/`: shared Mongoose models.
- `server/life/`, `server/creators/`, `server/learn/`, `server/premium/`, `server/multiplayer/`: domain modules.
- `server/migrations/`: ordered explicit Mongo migrations.
- `server/tests/`: Jest unit, contract, HTTP, Socket.IO, migration, and security tests.

The API is organized under `/api/auth`, `/api/users`, content/taxonomy/CMS routes, `/api/membership`, `/api/life`, `/api/creators`, `/api/creator-studio`, `/api/learn`, and `/api/multiplayer`.

## Authentication and sessions

Password registration and login use bcrypt. `tokenService` signs a short-lived access JWT and a refresh JWT with a unique `jti`, persists hashed refresh tokens and Session rows, and writes both tokens as HttpOnly, SameSite=Lax cookies. The client does not manufacture users or sessions when the API is unavailable and does not persist auth tokens in local storage.

`AuthContext` hydrates through `/api/auth/me`; an expired access cookie can rotate through `/api/auth/refresh-token`. Logout revokes the persisted refresh token/session and clears cookies. Optional CSRF middleware uses a readable CSRF cookie plus `x-csrf-token` header for mutations.

## Authorization

- `authenticate` validates the access JWT, loads the active User, and checks token version.
- `requireAdmin` protects CMS/Admin review and management operations.
- `requireActiveCreator` loads a CreatorProfile by authenticated user and requires `status=active`.
- `requireEntitlement` resolves server-side subscription state and fails closed on storage errors.
- Domain services scope ownership queries to user/creator identifiers rather than trusting client flags.

## Article domain

`Article` stores both standard Articles and Story records. Public lists force `status=published`. Premium serialization goes through `server/premium/contentPreview.js`, which removes protected body fields from anonymous/Free responses. Search indexing also excludes Premium bodies.

Admin writes remain on existing Article/CMS routes and require Admin middleware.

## Story domain and renderers

Stories use `contentType=story` in the Article domain. `storyController` normalizes `storyLayout` and `storySections`, calculates reading time, validates publishability, and preserves legacy body compatibility.

The client selects established Story renderers/presets such as `book-spread`, `chapter-journey`, `magazine-feature`, `minimal-longform`, and `classic-reader`. New Story work should extend this system, not replace it with a second renderer architecture.

## MyJourney Life / LifeOS

Life is a private authenticated API under `/api/life`. Except for authenticated export/delete privacy routes, the API also requires the global `life_access` Premium entitlement.

Life models and services cover profile/onboarding, today aggregation, habits and events, tasks, routines, medications, goals, health, finance entries/plans/import, journal, insights, reports, search, planning, notification jobs/deliveries, push subscriptions, and privacy export/deletion. Every record is scoped to the authenticated user.

AI review, web push, calendar, and health-provider adapters are capability-gated. Deterministic reports remain the authoritative fallback; unavailable providers return explicit states/errors.

## Premium subscription and entitlement architecture

```text
Billing provider -> Subscription Service -> Entitlement Service -> Protected feature
```

`ReaderMembership` stores the account-level `free` or `premium` plan, one of four billing durations, provider state, and access windows. `subscriptionService` evaluates active, trial, grace, cancellation, and expiration boundaries. `entitlementService` maps active Premium to the global entitlement catalog.

Duration affects billing time only. It never changes the feature set. The current payment provider adapter deliberately reports checkout, portal, webhooks, and synchronization unavailable.

## Creator domain

CreatorApplication is the private application/review workflow. CreatorProfile is the public/owner profile and Creator Studio capability. Topic is taxonomy. Article/Story/Course/Video/Podcast/Resource are content types; they are not Creator types or Topics.

The public directory exposes active profiles only. Follow records use a unique follower/type/target identity; self-follow is denied. Creator Studio scopes profile/content mutations to the active CreatorProfile loaded from the authenticated user.

Creator analytics aggregates and earnings/ledger models exist. Real revenue attribution and payouts are not active.

## Learn, Courses, and lessons

```text
Creator -> Content -> Free/Premium -> Entitlement -> Learner
```

Learn combines Topics and public catalog/search with Course, CourseModule, CourseLesson, CourseEnrollment, LearningEvent, CreatorVideo, PodcastSeries/Episode, LearningResource, and ExamDefinition.

Course detail exposes curriculum metadata. Preview lessons are public; non-preview Premium lessons require `premium_learn`. Enrollment and progress are private to the learner and power Continue Learning. Locked serializers remove lesson bodies, transcripts, asset identifiers, and resource URLs.

## Media abstraction

ProtectedMediaAsset records metadata and ownership. `server/learn/mediaProviderService.js` is an explicit provider boundary. The repository currently supports metadata/catalog workflows but not direct uploads, adaptive streaming, malware scanning, or signed delivery. Calls requiring real delivery return an unavailable error.

## CMS/Admin

The client CMS lives under `/cms/*`; there is no separate `/admin` client route. The API exposes Admin-protected content, Story, Creator review, Topic, Premium reporting, and broader CMS/platform management routes. Creator Studio is not an Admin surface.

Some enterprise/provider-oriented modules are foundations and return 503 when the required provider or capability is absent.

## Games and realtime

Play Life is a client-side game engine. Play With Friends uses Express room APIs plus Socket.IO realtime. Local single-instance mode can use the in-process adapter. Redis is the scaling boundary and is required when `MULTIPLAYER_REQUIRE_REDIS=true`.

## MyJourney Agent

```text
User / Voice -> AgentContext -> /api/agent/v1/conversations/:id/messages -> Rate / Concurrency -> Orchestrator -> Provider -> Permission -> ToolRegistry -> Domain Services
```

The MyJourney Agent is the canonical unified assistant across MyJourney. Both the floating `AskMyJourneyWidget` and the full-screen `/agent` page share the same `AgentContext`, persistent `AgentConversation` records, tool registry, and permission engine.

- **Identity & Authorization**: Identity is derived exclusively from the authenticated server context. Unauthenticated requests to conversation endpoints return 401.
- **Provider & Zero-Cost Execution**: `AgentProviderRegistry` routes turns to `MockAgentProvider` (development default, exercises real tool execution and permissions) or `LocalAgentProvider` (Ollama/OpenAI-compatible endpoints). Unconfigured providers fail closed without crashing server startup.
- **Tool Registry**: Tools are validated via Zod schemas and bound by timeout budgets. `permissionService` verifies authentication, Premium entitlements, and write-tool feature flags before execution.
- **Confirmation Tokens**: `AgentConfirmationToken` persists only SHA-256 hashes (`tokenHash`), bound to user, conversation, tool, and argument hash with short TTL expiration and atomic single-use consumption.
- **Idempotency & Privacy**: Message delivery is deduplicated via unique index on `(userId, conversationId, clientRequestId)`. Audit records in `AgentToolExecution` store redacted summaries only; raw personal records, health data, finances, and journal entries are never logged or persisted in audit records.
- **Voice Pipeline**: Explicit press-to-talk speech-to-text transcribes in-browser and feeds into the standard `sendMessage` pipeline; assistant responses trigger text-to-speech without persistent or background recording.
- **Legacy AI Transition**: The legacy `/api/ai/*` route remains mounted temporarily for backwards compatibility; all client surfaces have transitioned to `/api/agent/v1/*`.

## Background services

After a successful Mongo connection and HTTP startup, `server/cron.js` schedules:

- hourly notification work and due-account purge;
- hourly Life reminder replenishment/brief scheduling;
- minute-level Life notification delivery processing.

Every scheduler entry checks Mongoose readiness, so a later disconnect does not create uncontrolled database error loops. Production-required workers are not silently disabled; provider-dependent delivery reports failures/unavailability.
