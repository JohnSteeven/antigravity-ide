# MyJourney architecture

## Runtime shape

`npm start` first runs a non-mutating startup preflight that rejects duplicate Parcel/API listeners and verifies Mongo reachability. It then launches two processes with `concurrently`:

1. `node server/index.js` starts the Express/Socket.IO API on port 5000.
2. `parcel index.html --port 1234 --no-cache` serves the React client.

The API connects to MongoDB before opening the HTTP listener. A failed initial connection aborts server startup. After a successful connection, the idempotent CMS role/permission seeder runs, Socket.IO attaches, the listener opens, and background schedulers start.

`npm run start:ui` is the explicit frontend-only workflow. Its preflight checks only the Parcel port; it does not connect to MongoDB, start the backend, run migrations, or initialize schedulers. `/health` and `/api/health` are process-liveness endpoints. `/readiness` and `/api/readiness` return 503 whenever Mongoose is not connected. Scheduler timers expose a close boundary used during graceful API shutdown.

## Frontend organization

- `src/App.js` owns `createBrowserRouter`, global providers, public/protected route composition, and route-level lazy loading across public, account, CMS, Life, Creator, Learn, Agent, and game pages.
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

`AuthContext` hydrates through `/api/auth/me`; an expired access cookie can rotate through `/api/auth/refresh-token`. Refresh rotation atomically consumes the persisted token hash before creating a replacement, so replay is rejected. Logout revokes the persisted refresh token/session and clears cookies. Session rows have explicit expiry/TTL state. Optional CSRF middleware uses a readable CSRF cookie plus `x-csrf-token` header for mutations.

Account email and mobile are canonical security identities, not ordinary profile or Admin-editable fields. Profile/Admin update routes reject direct identity and verification writes. The authenticated `/api/users/me/identity-changes` start/resend/verify/cancel flow is CSRF-protected and account-rate-limited; it requires password or available TOTP reauthentication and an OTP delivered to the proposed identity. Owner-bound `IdentityChangeChallenge` records store only bcrypt code hashes, expire after five minutes, cap attempts/resends, and allow one challenge per identity type. Verification conditionally replaces the unchanged current identity, marks the replacement verified, increments the token version, revokes existing refresh/session rows, creates the current session, and records only masked identifiers in the activity log. Email is lowercase-normalized and mobile is full E.164.

## Authorization

- `authenticate` validates the access JWT, loads the active User, and checks token version.
- `requireAdmin` protects CMS/Admin review and management operations.
- `requireActiveCreator` loads a CreatorProfile by authenticated user and requires `status=active`.
- `requireEntitlement` resolves server-side subscription state and fails closed on storage errors.
- Domain services scope ownership queries to user/creator identifiers rather than trusting client flags.

## Article domain

`Article` stores both standard Articles and Story records. Public lists force `status=published`, use a bounded server-paginated metadata-only representation (12 by default, 48 maximum per request), and execute category/tag/search/sort filters on the server. Public detail serialization goes through `server/premium/contentPreview.js`, which removes protected body fields from anonymous/Free responses, strips internal ownership/workflow fields, and sanitizes legacy stored rich HTML. Search indexing also excludes Premium bodies.

MongoDB/API responses are the runtime authority for persistent Article and taxonomy data. Bundled CMS fixtures and browser local storage are not public Article-body fallbacks. The public detail route fetches its body by slug and engagement counters are reconciled from successful mutation responses. Article and Story details apply their validated SEO title, description, canonical URL, robots directive, and social metadata without accepting executable markup or non-HTTP canonical/image schemes.

Admin writes remain on existing Article/CMS routes and require Admin middleware.

## Reader profile and Article progress

Reader data is split by authority: `User` owns account identity/basic profile and account notification delivery settings; `ReaderProfile` owns interests, goals, theme/language preference, Article library relations, streak aggregates, and issued achievements; `ReadingProgress` owns one authenticated user/Article progress row. The client consumes this through global `ReaderContext`, while `AuthContext` remains an authentication/account boundary.

Authenticated Article Like, Bookmark, and Save requests flow through the existing Article routes/service into atomic ReaderProfile toggles. Their responses carry the authoritative active state, denormalized Article count, and allowlisted library card. `ContentCmsContext` applies the returned count and `ReaderContext` applies the returned library state, keeping detail/category controls and Profile lists synchronized without copying Reader data back into AuthContext. Share remains public and uses native browser sharing with a canonical copy-link fallback.

`ReaderContext` is auth-readiness and identity aware. It clears exposed Reader data immediately when the account changes, versions profile fetches against intervening mutations, and refuses to apply a mutation result whose captured owner is no longer the active authenticated user. This prevents stale fetch overwrites and cross-account library flashes during logout/login transitions.

Global contexts respect their authorization boundaries before loading protected data. Content, Access, Engagement, Site, and Media CMS collections are memory-only; protected variants load only for the exact authenticated Admin role, are tagged to the active Admin identity/scope, and are synchronously hidden while identity or authorization changes are reconciled. Both fetch and mutation responses are rejected if their captured identity scope is stale. Obsolete protected browser-storage keys are removed rather than restored. The Agent may load public capabilities anonymously, but private conversations are fetched only after an authenticated user exists.

Public Article comments use `GET /api/articles/:id/comments`, independently of administrator CMS state. The query is limited to approved, non-deleted comments on a published Article and passes through an explicit public serializer. The public author shape contains only the display name required by the UI; moderation records and account identifiers remain on the Admin-only `/api/comments` surface.

Article and Story routes enforce their shared-domain discriminator at the controller boundary. `/api/articles` and its Admin listing force `contentType=article`, while `/api/stories` forces `contentType=story`; a Story slug cannot be rendered through `ArticleDetail`, and Article Admin mutations refuse Story records. Legacy untyped records use the established `Stories` category as the compatibility discriminator rather than appearing through both route families. This keeps Article-only Reader library actions and counters from being applied to Story records.

Progress persistence validates a published `contentType=article`, applies monotonic progress/position with `$max`, accumulates active seconds with `$inc`, and uses a compare-and-set completion transition. Continue Reading and Completed are server-filtered from real progress; Stories, saved/liked inference, estimated reading time, and sample activity are excluded. See `docs/READER_DATA.md` for the exact field matrix and API DTO.

## Story domain and renderers

Stories use `contentType=story` in the Article domain. `storyController` normalizes `storyLayout` and `storySections`, calculates reading time, validates publishability, and preserves legacy body compatibility.
Stories use `contentType=story` in the Article domain. `storyController` normalizes `storyLayout` and `storySections`, calculates reading time at 200 wpm from readable section text, validates publishability, and preserves legacy body compatibility.
In MyJourney, Articles, Learn, and Stories are strictly separated:
- **Articles**: information, explanation, guides, learning, knowledge. Phase 5 establishes the canonical 5-category public article catalog (Life, Reflections, Experiences, Lessons, Travel) with configured byline `MyJourney Editorial`.
- **Learn**: structured teaching, coding, lessons, quizzes, courses.
- **Stories**: characters, life, events, relationships, choices, consequences, and emotion. Fictional narratives grounded in real human experience.

### Phase 5 Article Catalog Architecture
Phase 5 establishes the platform article foundation, safe legacy catalog reset, and canonical taxonomy:
- **Canonical Categories**: Five public Article categories:
  1. *Life* (`slug: "life"`): Habits, relationships, personal growth, ordinary living.
  2. *Reflections* (`slug: "reflections"`): Essays on meaning, change, and self-awareness.
  3. *Experiences* (`slug: "experiences"`): Real encounters, turning points, and pivotal moments (replaces legacy "Incidents").
  4. *Lessons* (`slug: "lessons"`): Actionable insights shaped into reusable knowledge.
  5. *Travel* (`slug: "travel"`): Destinations, verified logistics, budgets, and cultural encounters.
  *Note*: News is retained as an external feed and excluded from reset; Coding belongs to Phase 6 and remains intact.
Phase 5 establishes the canonical platform article catalog, safe legacy catalog reconciliation, and editorial architecture:
- **Canonical Categories & Structure**: Exactly 74 canonical articles across five public Article categories:
  1. *Life* (`slug: "life"`, 10 articles): Habits, relationships, emotional regulation, routines, and life architecture (2 Pillars at 9,000+ words, 8 Longforms at 6,000+ words).
  2. *Reflections* (`slug: "reflections"`, 10 articles): Philosophical inquiry, interiority, time, grief, resilience, and contemplation (2 Pillars at 9,000+ words, 8 Longforms at 6,000+ words).
  3. *Lessons* (`slug: "lessons"`, 10 articles): Deep, actionable synthesis across cognitive heuristics, negotiation, learning systems, leadership, and craft (~1,400–1,600 words each).
  4. *Experiences* (`slug: "experiences"`, 9 articles): Concrete real-world workplace, medical, artistic, wilderness, and institutional turning points (~1,050–1,300 words each) requiring verifiable `reported_case_study` editorial provenance. Replaces legacy "Incidents".
  5. *Travel* (`slug: "travel"`, 35 articles: 20 India + 15 International): Grounded itineraries, practical logistics, verified transit routes, realistic seasonal budgets, and cultural guidelines (~1,050–1,300 words each) with structured `travelVerification` schemas.
  *Note*: News is retained as an external feed and excluded from reset; Coding curriculum/courses in Learn remain intact while standalone legacy coding articles are archived (0 active legacy coding articles).
- **Structural Block Richness**: Every canonical article incorporates all 8 structured block types (`heading`, `paragraph`, `callout`, `quote`, `image`, `list`, `table`, `divider`), includes at least 2 inline images with descriptive `alt` and `caption` metadata, specifies at least 4 tags, and cites at least 2 authoritative sources/references.
- **Backwards Compatibility**: Legacy bookmarks to `/categories/incidents`, `/category/incidents`, and `/articles?category=incidents` seamlessly normalize and redirect to `/category/experiences` and `/articles?category=experiences`.
- **Archived Article Tombstone Behavior**: Direct requests for archived articles return HTTP 200 tombstone responses with empty body prose (`body: ""`, `structuredBlocks: []`, `storySections: []`), `status: "archived"`, `isArchived: true`, and `seo: { metaRobots: "noindex,follow" }`. The frontend renders a clean tombstone notice with canonical navigation and sets `noindex` via the existing `DocumentMetadata` component.
- **Experiences Editorial Provenance**: Experiences pieces forbid fabricated accounts and require typed provenance:
  - `first_person_authorized`: requires authorization reference or subject identity and consent confirmation.
  - `reported_case_study`: requires verifiable case study sources and source documentation.
  - Confidential editorial notes (`confidentialNotes`) are strictly stripped by public serializers.
- **Travel Verification Metadata**: Travel articles carry structured verification timestamps (`lastVerifiedAt`, `budgetVerifiedAt`), currency codes, budget/transport assumptions, official source references, visa guidance, and opening/ticket fee verification. Invented current facts are prohibited.
- **Authorship**: Platform articles use the configured editorial byline: `MyJourney Editorial`.
- **Catalog Reconciliation & Safety**: Legacy prototype and test articles are soft-archived (`status: "archived"`, `isArchived: true`, `archivedAt: timestamp`) without data loss (`deleteMany` is prohibited). All 84 Story records (Batches 1–4 and legacy archived stories) and News feed records are strictly ring-fenced and untouched. Active legacy coding article count is reduced to 0.

The client selects established Story renderers/presets such as `book-spread`, `chapter-journey`, `magazine-feature`, `minimal-longform`, and `classic-reader`. New Story work should extend this system, not replace it with a second renderer architecture.
The canonical production story library is server-persisted in MongoDB via `server/scripts/seedArticles.js`, sourced from `server/data/launchStories/` (8 original stories across batches A, B, and C, totaling 35,718 words and 121 sections). Stories are never bundled in bulk into client Parcel JavaScript; the client loads story data dynamically through `/api/stories`.
Stories use `contentType=story` in the Article domain. `storyController` normalizes `storyLayout` and `storySections`, calculates reading time at ~200 wpm from readable section text, validates publishability, and preserves legacy body compatibility. When an archived story slug is requested, `storyController.getStoryBySlug` returns a graceful HTTP 200 tombstone (`{ article: null, archived: true, slug, title }`) to ensure bookmarked records do not break user navigation.

All 30 stable presets map to the six approved engines (PROSE, SPLIT RIGHT, SPLIT LEFT, SIDE RAIL, BOOK COLUMNS, and CHAPTER FLOW). CMS preview reuses the public `StoryEngine` or explicit `LegacyStoryReader`. Structured quote sections carry text, attribution, source, and a validated style preset; media carries alt/caption metadata. The verification matrix is maintained in `docs/STORY_PRESET_VERIFICATION.md`.
Structured section types include `paragraph`, `heading`, `image`, `quote`, `dialogue` (speaker, dialogue, avatar), and `callout` (note, tip, warning, info). Premium stories (such as `The Glass Ledger`) enforce server-authoritative body gating via `contentPreview.redactArticle`, returning empty sections and excerpt-only bodies to unauthenticated or non-premium readers.
### Story reading progress isolation
Story reading progress is server-authoritative and completely ring-fenced from Article reading progress via `server/services/storyProgressService.js`. Endpoints (`/api/reader/story-progress`, `/api/reader/story-continue-reading`, `/api/reader/story-completed`) strictly require `contentType: 'story'`. Story reading progress never calls `onArticleCompleted`, never increments `ReaderProfile.totalArticlesRead`, never triggers Article streak increments, and never affects creator economics or Reader achievements.

The client selects established Story renderers/presets such as `book-spread`, `chapter-journey`, `scene-by-scene`, `alternating-editorial`, `editorial-sidebar`, `book-page`, and `minimal-longform`. All 20 assigned launch layouts map to the repository's registered layout IDs in `src/stories/storyLayoutIds.json`.

The canonical production story library is server-persisted in MongoDB via `server/scripts/seedArticles.js`, organized into four batch modules under `server/data/launchStories/` (Batch 1: Stories 1–5; 26,343 words across 61 sections). Legacy stories are safely transitioned to `status: 'archived'` via `server/data/launchStories/archived.json`. Character Bibles and Story Bibles are maintained as non-public editorial artifacts in `server/data/storyBibles/` and are never exposed via public APIs.

Structured section types include `chapter`, `text`, `image`, `quote`, `dialogue` (speaker, dialogue, avatar), and `callout` (note, tip, warning, info). Premium stories (such as `The House with Two Expectations`) enforce server-authoritative body gating via `contentPreview.redactArticle`, returning empty sections and excerpt-only bodies to unauthenticated or non-premium readers.

The client reader experience provides:
- 30 stable presets over six approved engines (`PROSE`, `SPLIT RIGHT`, `SPLIT LEFT`, `SIDE RAIL`, `BOOK COLUMNS`, and `CHAPTER FLOW`).
- Accessible reading progress tracking via a native progress bar element with `role="progressbar"`, `aria-label`, and `aria-valuenow`.
- Accessible reading progress tracking via a native progress bar element with `role="progressbar"`, `aria-label`, and `aria-valuenow`, hooked via `useStoryReadingProgress`.
- Sequential next/previous story navigation within the curated catalog.
- Reflection questions cards embedded in the reader footer to prompt reader contemplation.
- Dynamic category filters on `/stories` derived from published stories in the database.
- Timeless story-focused messaging (no false daily publishing claims; "A Story to Slow Down With" shelf).
- Dynamic category filter chips derived strictly from published story categories.
- Editorial quality and deduplication validation via `server/scripts/storyEditorialAudit.js`.
- The structural preset verification matrix is maintained in `docs/STORY_PRESET_VERIFICATION.md`.

## Theme and dark-mode contract

The public theme endpoint returns only a sanitized token contract and generated CSS variables. Theme token values are server-allowlisted before persistence and revalidated before CSS generation; legacy raw CSS/JavaScript fields are dormant and are neither accepted nor emitted. Normal and muted text are WCAG 4.5:1 checked against page, card, and panel surfaces before activation. The client applies CSS with `textContent`, synchronizes document color scheme, supports personal Light/Dark preference, and restores the active theme after CMS preview cancellation. Dark generated tokens are scoped to `body.theme-dark` so mode removal reveals the Light root tokens without stale values. Fixed Light/Dark surfaces use explicit local `text-on-*` contracts; feature-owned surfaces such as Learn, Article cards, Article Experience-detail canvases, Story readers, and the Categories mega-menu own scoped semantic hierarchies rather than inheriting an unrelated page foreground. Every non-Coding Article Experience opts into `article-detail-theme--standard`, which maps page, card, text, border, input, placeholder, and action roles to the active semantic tokens. Incidents, Life, and Travel map their local variables through that standard contract; Default covers News and unknown categories; Lessons delegates to Life. Coding declares `article-detail-theme--coding` and remains outside every standard selector. Intentional fixed-Light Article modules opt in with `detail-card--light` and bind to `text-on-light*`.

Article list cards use one common Dark surface and foreground hierarchy across every category. Category identity remains in accents, badges, tags, and actions; Coding keeps its approved blue Light treatment and uses blue accents only on the shared Dark card foundation.

## MyJourney Life / LifeOS

Life is a private authenticated API under `/api/life`. Except for authenticated export/delete privacy routes, the API also requires the global `life_access` Premium entitlement.

Life models and services cover profile/onboarding, today aggregation, habits and events, tasks, routines, medications, goals, health, finance entries/plans/import, journal, insights, reports, search, planning, notification jobs/deliveries, push subscriptions, and privacy export/deletion. Every record is scoped to the authenticated user.

AI review, web push, calendar, and health-provider adapters are capability-gated. Deterministic reports remain the authoritative fallback; unavailable providers return explicit states/errors.

Life's browser offline queue is a narrow, non-authoritative convenience boundary. Schema version 2 accepts only type- and length-validated minimal task creation and non-sensitive habit/task/goal-action event logs, binds each record to the authenticated Mongo user ID, expires it within 24 hours, and revalidates the active owner immediately before replay. Health, medication, routine, journal, money, notes, arbitrary URLs, and arbitrary headers are online-only. Logout, session invalidation, account/role changes, and Life-data deletion initiate private IndexedDB removal. The queue is not encrypted; server authentication, entitlement, validation, and ownership remain the final controls. The Life service worker caches only the public app shell scripts/styles/fonts and Life navigation fallback; it never intercepts authenticated API, private image, or non-Life navigation responses.

## Premium subscription and entitlement architecture

```text
Billing provider -> Subscription Service -> Entitlement Service -> Protected feature
```

`ReaderMembership` is the canonical account-level Premium authority. It stores one of four billing durations, provider state, priced-term audit fields, and access windows. Phase 13 paid memberships keep purchase-attributed `paidPeriods` on this same aggregate; absent arrays retain legacy window semantics, while an empty array grants no paid access. `subscriptionService` evaluates start/end boundaries on every check, and `entitlementService` maps valid access to the global entitlement catalog. User fields and browser state never grant access.

Duration affects billing time only. It never changes the feature set. `server/billing` owns immutable integer-minor-unit money and fixed INR/USD catalog rules. Payment, Invoice, Refund, and BillingEvent surround the existing Subscription aggregate with database idempotency and auditable state. Verified Razorpay capture invokes `premiumLifecycleService` to atomically attribute the Payment, extend ReaderMembership, associate the Invoice, and write a BillingEvent. Renewals stack after remaining paid time; expired purchases begin at verification. Full refunds remove only their attributed window, preserving other purchases and denying access in any resulting gap. Cancellation preserves paid dates; failed attempts never change paid access or create grace. The adapter still refuses live keys and unsupported recurring subscription operations. See `docs/BILLING_ARCHITECTURE.md`.

## Creator domain

CreatorApplication is the private application/review workflow. CreatorProfile is the public/owner profile and Creator Studio capability. Topic is taxonomy. Article/Story/Course/Video/Podcast/Resource are content types; they are not Creator types or Topics.

The public directory exposes active profiles only. Follow records use a unique follower/type/target identity; self-follow is denied. Creator Studio scopes profile/content mutations to the active CreatorProfile loaded from the authenticated user.

Creator analytics aggregates and earnings/ledger models exist. Real revenue attribution and payouts are not active.

## Learn, Courses, and lessons

```text
Creator -> Content -> Free/Premium -> Entitlement -> Learner
```

Learn combines Topics and public catalog/search with Course, CourseModule, CourseLesson, CourseEnrollment, LearningEvent, CreatorVideo, PodcastSeries/Episode, LearningResource, and ExamDefinition.

Discovery pages (`/learn`, `/learn/courses`, `/learn/courses?topic=...`) share `LearnDiscoveryLayout`, providing a persistent left discovery rail on desktop and an accessible mobile drawer on viewport widths $\le$1023px. Topic filtering uses canonical topic slugs in query parameters, resolved server-side against the `Topic` collection to filter courses and media assets by `topicIds`.

Course detail exposes curriculum metadata in a focused container (`/learn/courses/:slug`). Preview lessons are public; non-preview Premium lessons require `premium_learn`. Enrollment and progress are private to the learner and power Continue Learning. Locked serializers remove lesson bodies, transcripts, asset identifiers, and resource URLs.

### Interactive Coding Curriculum Architecture (Phase 6)

Phase 6 introduces a safe, fully client-side interactive coding curriculum with four canonical tracks (HTML Foundations, CSS Foundations, JavaScript Foundations, and Python Foundations) comprising 55 total lessons authored by the system identity `MyJourney Learning` (`myjourney-learning`).

#### 1. Pedagogical Flow
Every coding lesson enforces a 12-step sequential pedagogical arc:
`EXPLANATION → EXAMPLE → EDITABLE CODE → RUN → OUTPUT → EXPLANATION OF RESULT → TRY YOURSELF → HINT → CHECK → SOLUTION → QUIZ → NEXT LESSON → PROJECT`

Learners read clear concept explanations, inspect runnable examples, edit code in the interactive editor, run and view real output, work on an active practice task, optionally request hints or revealed solutions, test their knowledge with an embedded quiz, and advance through the curriculum towards milestone capstone projects.

#### 2. Zero Server-Side Code Execution Policy
The backend server **never** executes, compiles, spawns, or evaluates learner-submitted code under any circumstance. Native child process modules (`child_process`, `exec`, `execSync`, `spawn`) and JavaScript runtime evaluators (`eval`, `new Function`) are strictly forbidden on the server for learner code. All execution occurs in isolated browser environments on the client device.

#### 3. Client-Side Execution Sandboxes
Execution is partitioned by technology stack:
- **HTML, CSS, and JavaScript**: Executed inside an isolated sandboxed iframe (`htmlSandboxHarness.js`) using `sandbox="allow-scripts"` strictly without `allow-same-origin`.
  - **Opaque Origin**: With `srcdoc` and absent `allow-same-origin`, the iframe executes in an opaque origin (`"null"`). Parent-to-iframe communication does not rely on `event.origin === window.location.origin`. Instead, every postMessage is strictly validated against `event.source === expectedIframe.contentWindow`, a cryptographically random per-run `channelNonce`, a rigid message-type enum (`MJ_CONSOLE_LOG`, `MJ_CONSOLE_ERROR`, `MJ_SANDBOX_READY`), and validated payload schemas with a 64 KB maximum output buffer.
  - **Content Security Policy**: An inline CSP meta tag is injected into the sandbox document head: `default-src 'none'; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; form-action 'none';` ensuring zero network egress and no top-frame navigation.
  - **Navigation Neutralization**: Form submissions are intercepted with `e.preventDefault()` to prevent accidental or malicious top-frame redirection.
- **Python**: Executed client-side via Pyodide v0.26.4 inside an isolated Web Worker (`pythonWorkerManager.js`).
  - **Network Neutralization**: Python-accessible network globals (`fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`) are neutralized inside the worker prior to executing user code.
  - **Hard Execution Timeout**: A strict 10-second timeout budget is enforced. If learner code loops infinitely or stalls, `worker.terminate()` immediately kills the thread and re-instantiates a clean worker.
  - **Safe Streams**: Standard output (`sys.stdout`) and standard error (`sys.stderr`) are redirected to an in-memory buffer truncated at 64 KB.

#### 4. Progress Authority & Solution Security
- **Educational Evidence vs. Anti-Cheat**: Client-side validation (`ValidationRunner`) provides instant pedagogical feedback and test execution. However, the server remains the authoritative record of progress.
- **Answer Protection**: Public serializers (`serializeLesson`) unconditionally redact `solutionCode`, test suites, and quiz `correctOptionIndex`. Learner clients cannot extract solutions from API payloads.
- **Server Quiz Grading**: Quiz answers are evaluated strictly on the server (`POST /api/learn/courses/:courseId/lessons/:lessonId/quiz/evaluate`), which checks the submitted option against the protected lesson definition and updates `CourseEnrollment.quizPassed` and `quizScore`.
- **Solution Reveal Auditing**: When a learner reveals a solution (`POST /api/learn/courses/:courseId/lessons/:lessonId/solution/reveal`), the server records `solutionViewed = true` on the enrollment row. Revealing the solution never grants `exercisePassed` or `completed`.
- **Progress Gates**: Marking a lesson complete (`POST /api/learn/courses/:courseId/lessons/:lessonId/progress`) server-enforces all lesson requirements: lessons with coding blocks require `exercisePassed: true`, and lessons with quizzes require `quizPassed: true`.

## Media abstraction

ProtectedMediaAsset records metadata and ownership. `server/learn/mediaProviderService.js` is an explicit provider boundary. The repository currently supports metadata/catalog workflows but not direct uploads, adaptive streaming, malware scanning, or signed delivery. Calls requiring real delivery return an unavailable error.

## CMS/Admin

The client CMS lives under `/cms/*`; there is no separate `/admin` client route. The API exposes Admin-protected content, Story, Creator review, Topic, Premium reporting, settings/content modeling, layouts/components, workflow/versioning, dashboard/analytics, operational tooling, and legacy CMS AI routes. Creator Studio is not an Admin surface.

Public runtime delivery is deliberately separated from management reads: active theme, evaluated feature status, published page-by-slug, published navigation, public form schemas/submission, SEO metadata, and generated design-token CSS remain public. Draft collections, setting definitions, audit history, builder manifests, and management details do not.

Some enterprise/provider-oriented modules are foundations and return 503 when the required provider or capability is absent.

### Launch and SEO evidence

The Admin launch console is a read-only view over live configuration/database evidence and separately recorded release, deployment, and test history. A GET audit never persists a report or seeds sample success records. Mongo connectivity, production security configuration, migration state, SMTP, billing checkout, and protected media delivery are critical checks; any missing critical dependency produces `status=blocked`. Provider configuration is described as configuration only and is not presented as a successful external connectivity test.

The SEO dashboard derives its score and issue counts from published, public Article/Page records. With no qualifying records it returns `null` for scores and coverage rather than a sample number. Public JSON-LD and sitemap queries apply the same published/public/non-deleted content boundary, so draft, private, deleted, or missing documents are not serialized through SEO endpoints.

## Games and realtime

Play Life is a client-side game engine. Play With Friends uses Express room APIs plus Socket.IO realtime. Room persistence is always Mongo-authoritative and fails closed after a disconnect; in-memory repositories are test/load-harness dependencies only. A single node can use the in-process Socket.IO adapter. Redis fanout is the scaling boundary and is required when `MULTIPLAYER_REQUIRE_REDIS=true`.

## Observability and scaling boundaries

The top-level request-context middleware assigns or validates a UUID request ID, returns it in `X-Request-Id`, and emits completion events with method, route template, status, duration, and a salted user hash. It does not log raw URLs, query values, request bodies, cookies, IP addresses, or raw user IDs. The error boundary emits classified metadata without message/stack/database values; persistent audit diffs recursively redact credential, token, body, journal, health, and financial fields.

Process-memory rate limits, Agent concurrency, caches, queues, schedulers, presence, and metrics are single-instance boundaries. Provider names without implemented adapters fail closed. Horizontal production requires distributed rate limiting/cache, durable workers, shared object storage/CDN, centralized metrics/logs, a managed Mongo replica set, and Redis Socket.IO fanout. The staged plan is in `PRODUCTION_READINESS.md`.

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
- **Legacy AI Transition**: The legacy `/api/ai/*` route remains mounted temporarily for CMS compatibility. Only provider availability status is public; completion and management endpoints require Admin. Reader-facing assistant traffic uses `/api/agent/v1/*`.

## Background services

After a successful Mongo connection and HTTP startup, `server/cron.js` schedules:

- hourly notification work and due-account purge;
- hourly Life reminder replenishment/brief scheduling;
- minute-level Life notification delivery processing.

Every scheduler entry checks Mongoose readiness, so a later disconnect does not create uncontrolled database error loops. Production-required workers are not silently disabled; provider-dependent delivery reports failures/unavailability.
