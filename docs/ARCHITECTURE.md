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

Life's private workspace uses `life.css` with scoped `lifePolish.css` presentation tokens shared by `.life-app` and portalled `.life-dialog` elements. The Premium introduction is styled independently in `lifeIntro.css`. Non-coding Learn course/lesson presentation is scoped in `learnReading.css`; the existing course/lesson APIs remain authoritative. Non-coding Article experiences import `shared/articleReader.css` through `ExperienceResolver` and reuse `ArticleReadingTools` for responsive disclosure of their existing sidebars. The standard Article marker excludes Coding. `styles/publicPolish.css` contains targeted public-page presentation rules rather than a replacement global component system.

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

Phase 14 extends the same Payment/Invoice/Refund/BillingEvent and Razorpay verification pipeline for `STANDALONE_PAID` Courses. Course price and currency are stored on the Course and copied into an immutable course-targeted Payment at checkout; browser amounts are ignored. A verified full capture creates one unique `CoursePurchase` aggregate for `(buyerId, courseId)`. Learn access checks query only its active captured entitlement for that exact Course. Premium, including the QA Premium override, never satisfies standalone access. Creator ownership/Admin review are explicit preview authorities. A processed full refund revokes only the purchase tied to that Payment; partial, pending, or failed refunds do not.

## Creator domain

CreatorApplication is the private application/review workflow. CreatorProfile is the public/owner profile and Creator Studio capability. Topic is taxonomy. Article/Story/Course/Video/Podcast/Resource are content types; they are not Creator types or Topics.

The public directory exposes active profiles only. Follow records use a unique follower/type/target identity; self-follow is denied. Creator Studio scopes profile/content mutations to the active CreatorProfile loaded from the authenticated user.

Creator analytics aggregates and earnings/ledger models exist. Phase 15 adds a separate canonical learning-engagement report derived only from server-written `LearningEvent` and `CourseEnrollment` evidence for creator-owned, non-system Courses. Start-inclusive/end-exclusive UTC periods report unique enrolled and meaningful learners, qualified learning actions, lesson/quiz/exercise/course completions, and repeat meaningful learning days at Course and Creator levels. Semantic deduplication, unique learner/day sets, and creator-user exclusion prevent refresh/retry/self-activity inflation. Browser engagement totals and raw views are never inputs.

Phase 16 adds an Admin-only deterministic Creator pool calculator. An active versioned `CreatorEconomyPolicy` centrally defines integer basis points, the captured-less-refunds-and-chargebacks revenue basis, and non-negative integer Phase 15 metric weights. Calculations isolate INR/USD, consume Premium Payments only, use BigInt intermediates and largest-remainder distribution, and persist a uniquely identified `CreatorPoolCalculation` snapshot containing revenue exclusions, policy inputs, engagement units, allocations, reconciliation totals, and an input hash. A calculated snapshot can be finalized but never paid; finalized inputs/allocations are immutable and repeated calculation returns the same period/currency/policy snapshot.

Phase 17 turns only a finalized Phase 16 allocation into one `CreatorEarningPeriod` and one immutable `CreatorLedgerEntry` per Creator/source calculation. Source IDs and hashes, UTC period, policy version, integer amount/currency, qualified units, Course contribution context, finalization actor/time, and deterministic references provide the audit chain. Unique source and period/currency indexes make generation idempotent; an interrupted run is safe to retry. Creator Studio reads are scoped by the active Creator identity and expose per-currency finalized/available totals plus period context without learner data. Admin routes can generate from a calculation ID and filter the read-only report, but accept no amount/status inputs and offer no balance editor. New records remain `finalized`; payout availability is explicitly false because no payout provider, bank transfer, or paid-state transition is implemented.

## Learn, Courses, and lessons

```text
Creator -> Content -> Free/Premium/Standalone -> Entitlement -> Learner
```

Learn combines Topics and public catalog/search with Course, CourseModule, CourseLesson, CourseEnrollment, LearningEvent, CreatorVideo, PodcastSeries/Episode, LearningResource, and ExamDefinition.

Discovery pages (`/learn`, `/learn/courses`, `/learn/courses?topic=...`) share `LearnDiscoveryLayout`, providing a persistent left discovery rail on desktop and an accessible mobile drawer on viewport widths $\le$1023px. Topic filtering uses canonical topic slugs in query parameters, resolved server-side against the `Topic` collection to filter courses and media assets by `topicIds`.

Course detail exposes curriculum metadata in a focused container (`/learn/courses/:slug`). Preview lessons are public; non-preview Premium lessons require `premium_learn`, while standalone lessons require an active purchase for the exact Course. Enrollment and progress are private to the learner and power Continue Learning. Locked serializers remove lesson bodies, transcripts, asset identifiers, and resource URLs.

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

#### 5. System-Owned Coding Product Surface & Admin Learning Materials Management
- **Dedicated Developer Product Surface**: Coding is elevated from a generic Learn catalog into a first-class product surface at `/coding`, supported by dedicated sub-navigation (`/coding/playground`, `/coding/projects`, `/coding/practice`, `/coding/resources`), track overviews (`/coding/:track`), and dark navy developer workspaces (`/coding/:track/lesson/:lessonId`).
- **System Ownership vs. Creator Studio**: The 4 canonical tracks (`html-foundations`, `css-foundations`, `javascript-foundations`, `python-foundations`) are system-owned (`isSystemOwned: true`), authored by `MyJourney Coding`, and detached from creator profiles. Generic editorial cover images and creator links are removed in favor of clean language badges and developer typography.
- **Admin CMS Coding Module**: Canonical curricula, coding blocks, tests, and learning materials are managed via `/cms/coding` backed by Admin-protected routes (`/api/learn/admin/coding/*`). Creator Studio is not used for canonical track management.
- **Granular Learning Materials Architecture**: Extends `LearningResource` to support attachments at Course, Module, and Lesson levels across types (`code_file`, `zip`, `link`, `video_link`, `text_notes`, `pdf`, `image`, `worksheet`) and categories (`starter_files`, `solution_files`, `cheatsheet`, `documentation`, `slides`, `assignment`, `dataset`). Serializers enforce server-authoritative Free/Premium protection, masking external URLs, downloads, and text content when unentitled.
- **Legacy Route Compatibility**: Existing `/learn` catalog and lesson routes continue to function seamlessly without duplicate MongoDB schemas or parallel progress tables.

#### 6. Coding Lesson Workspace 3-Zone Architecture, Editor, & Streaks
- **3-Zone Desktop Workspace**: Modeled after modern developer IDEs:
  - **Left Sidebar** (260–290px): Course navigator displaying lesson count, percentage progress bar, module sections, and status checkmarks (`✓` completed, `●` active, `○` upcoming).
  - **Center Learning Panel** (360–430px): Structured concept reader featuring difficulty badges, duration estimates, language pills, tabbed views (`Concept`, `Example`, `Your Challenge`, `Expected Output`, `Quiz`, `Hints`), visible horizontal tab navigation, pedagogical tip callout cards, and sequential footer navigation (`Previous Lesson`, `X of Y`, `Next Lesson`). The quiz stays mounted while switching lesson sections so answers and grading feedback remain visible.
  - **Right IDE Workspace** (flex-1): Interactive code environment featuring action controls (`Reset`, `Hint`, `Solution`, `Run`, `Check`), file tabs, draft status indicator, line-gutter dark editor, and a bottom tabbed execution/validation panel (`Preview`, `Console`, `Tests`). Quiz grading and completion remain server-authoritative.
- **WorkspaceCodeEditor Component**: Custom textarea-based code editor providing line-numbered gutter synchronization on scroll, tab key indentation handling (2 spaces for HTML/CSS/JS, 4 spaces for Python), `Ctrl+Enter` shortcut execution, draft autosaving with debounce to `localStorage`, and cursor position metrics.
- **Automated Server Completion Gate**: Manual "Mark Complete" buttons are completely eliminated. Lessons transition to completed automatically through server-authoritative event hooks when exercises pass and server-graded quizzes satisfy minimum pass thresholds.
- **Idempotent Activity & Coding Streak Engine**: `streakService.js` queries `LearningEvent` log records (`exercise_passed`, `quiz_passed`, `lesson_completed`) with daily idempotency keys. Repeated submissions on already-passed exercises or quizzes do not inflate user streak days, weekly goals (target 5 active days), or lifetime exercise counts.
- **Progressive Hints & Solution Comparison**: Multi-step progressive hint modals allow incremental unlocks. The solution modal presents official reference code, learner code comparison tabs, an explanatory "Why this works?" breakdown, one-click clipboard copying, and a guarded "Replace My Code" action.
- **Language Adapters & Educational Previews**: `languageAdapters.js` formats execution payloads across HTML, CSS, JavaScript, and Python (Pyodide worker). For CSS styling lessons, an educational preview fixture (`previewFixture` or default HTML harness) is injected into the sandbox iframe so learners immediately see live visual styling updates without a blank canvas.

#### 7. Pass 3: Resizable Workspace Splitters, Submissions & Trust Model, Full Preview, and Playground
- **Draggable Resizable Workspace Splitters**: `WorkspaceSplitter.jsx` enables accessible split-pane resizing with pointer capture (`setPointerCapture`/`releasePointerCapture`), keyboard accessibility (`ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`, `Home`, `End`), double-click reset to default ratios (36% instructions, 58% editor height), and persistence in `localStorage` (`myjourney_coding_split_v`, `myjourney_coding_split_h`). Panels support maximize and minimize toggles.
- **Server-Authoritative Coding Submissions**: `CodingSubmission` Mongoose model (`server/models/CodingSubmission.js`) records learner code submissions with 64 KB limit, test counts, execution runtime, validation checks, and status enum (`accepted`, `partially_passed`, `failed`, `runtime_error`, `syntax_error`, `timeout`). Endpoints:
  - `POST /api/learn/courses/:slug/lessons/:lessonId/submissions`: authenticated submission creation.
  - `GET /api/learn/courses/:slug/lessons/:lessonId/submissions`: learner submission history.
  - `GET /api/learn/courses/:slug/lessons/:lessonId/submissions/:submissionId`: ownership-isolated submission detail.
- **Anti-Forgery Mastery Trust Model**: Server never uses client submission scores, statuses, runtimes, or validation summaries to mutate mastery. Submission endpoints store learner-owned history only; `exercisePassed`, lesson completion, and idempotent learning events remain isolated to the established progress path.
- **SubmissionsDrawer**: Slides out to present chronological submission history with status badges, test metrics, and runtime. Clicking an entry reveals the snapshot detail view with validation breakdown, copy-to-clipboard, and a guarded "Load into Editor" confirmation dialog.
- **Standalone Full Preview Page**: Routed at `/coding/preview/:sessionId`, reading isolated markup from `sessionStorage` (`coding_preview_${sessionId}`). Features a realistic browser address bar, refresh button, viewport device presets (Desktop 100%, Tablet 768px, Mobile 375px), and a responsive isolated preview frame.
- **Overhauled Code Playground**: Standalone developer sandbox at `/coding/playground` with dual modes:
  - **Workspace Layout**: Desktop and tablet widths place the resizable code editor on the left and output on the right. Compact widths stack the same panes vertically. The divider supports pointer, touch, keyboard resizing, double-click reset, and a persisted 50/50 default.
  - **WEB Mode**: Multi-file tab bar (`index.html`, `styles.css`, `script.js`) with live preview, real console output, clear console action, full preview navigation, and reset template dialog.
  - **PYTHON Mode**: In-browser client-side Python execution powered by Pyodide web worker (`defaultPythonManager`) with stdout/stderr capture and 10s timeout budget.
- **Clean SubNav**: Eliminated native horizontal scrollbars on `CodingSubNav` across all viewports.

#### 8. Coding CMS Authoring Platform & Administrative Architecture
- **Admin-Controlled Curriculum Management**: Dedicated CMS workspace at `/cms/coding` (mounted via `CodingManagementModule.jsx` within `AdminDashboard.js`) providing complete administrative control over tracks, modules, lessons, exercises, starter code, hints, expected output, solutions, validation criteria, quizzes, projects, and learning materials without editing source code.
- **Canonical API Namespace**: All administrative endpoints use the established `/api/learn/admin/coding/*` namespace:
  - Tracks: `GET /courses`, `POST /courses`, `PATCH /courses/:courseId`, `PATCH /courses/:courseId/publish`, `PATCH /courses/:courseId/archive`, `POST /bulk-access`
  - Modules: `POST /courses/:courseId/modules`, `PATCH /courses/:courseId/modules/:moduleId`, `DELETE /courses/:courseId/modules/:moduleId`, `POST /courses/:courseId/modules/reorder`
  - Lessons: `GET /lessons/:lessonId`, `POST /courses/:courseId/modules/:moduleId/lessons`, `PATCH /lessons/:lessonId`, `DELETE /lessons/:lessonId`, `POST /courses/:courseId/modules/:moduleId/lessons/reorder`, `POST /bulk-publish-lessons`
  - Materials: `GET /materials`, `POST /materials`, `PATCH /materials/:materialId`, `DELETE /materials/:materialId`
- **System Ownership & Creator Decoupling**: Admin-created tracks automatically enforce `isSystemOwned: true` and are attributed to a resolved system-owned creator profile (`resolveSystemCreator`), ensuring they remain completely detached from individual creator accounts and Creator Studio.
- **Hierarchical Reordering & Soft Deletes**: Module and lesson ordering is strictly monotonic (`orderedIds`). Deletions use soft-delete semantics (`deletedAt: new Date()`) on both modules and child lessons, preserving learner progress and submission history.
- **Server-Authoritative Validation Rule Sanitizer**: `sanitizeValidationRules` strictly whitelists supported rule types (`element_exists`, `element_attribute`, `text_content`, `selector_property`, `has_media_query`, `output_contains`, `stdout_contains`, `output_pattern`, `stdout_pattern`, `code_contains`, `syntax_contains`, `pattern`) and strips untrusted fields before persistence.
- **Execution Runtime Availability Guard**: `assertRuntimeAvailable` validates that any runnable Coding lesson being published requires an active execution runtime (`html`, `css`, `javascript`, `python`). Lessons for unsupported runtimes can be saved as drafts for future curriculum planning but are prevented from being published to learners.
- **Solution & Test Privacy**: Coding block `solutionCode`, test suites, and quiz `correctOptionIndex` are stripped from learner endpoints (`select: false`), but fully exposed and editable within `/cms/coding` for authorized Admins.
- **Granular Learning Materials Storage Boundary**: Materials retain external URL and inlined Markdown/text support (`LearningResource`). Track-linked materials also accept private binary file uploads through the Phase 18 local/R2 storage adapter; authenticated downloads recheck Course entitlement. The CMS no longer shows the deferred-storage advisory.

#### 9. Phase 8 Retention Foundation: Meaningful Streaks, Progress Metrics, Achievements, & Continue Learning
- **Server-Authoritative Retention Model (`LearnerRetention`)**: `server/models/LearnerRetention.js` provides a derived server-side retention cache (`userId`, `currentStreak`, `longestStreak`, `lastActiveDate`, `achievements`, `lastCalculatedAt`) indexed by `userId`. Ground truth is strictly derived from immutable `LearningEvent` and `CourseEnrollment` records; cache persistence failures are logged without blocking or corrupting authoritative data.
- **Meaningful Learning Activity Definition**: Streaks and daily progress strictly count qualifying events (`lesson_completed`, `quiz_passed`, `exercise_passed`, `course_completed`). Non-learning events (logins, page views, refreshes, opening a course without completing a task) are excluded by design and cannot increment streaks.
- **Calendar-Day Logic & Timezone Safety**: `retentionService.js` evaluates learner progress using the learner's specified IANA timezone (with a safe fallback to UTC). Qualifying events occurring on the same calendar day maintain the streak without duplicate increments. An event on the consecutive calendar day increments the streak. A missed day resets `currentStreak` to 0, while `longestStreak` is monotonically preserved.
- **Daily & Weekly Progress Tracking**:
  - Daily metrics: `lessonsCompletedToday`, `quizzesPassedToday`, `exercisesPassedToday`, `activitiesToday`.
  - Weekly metrics: Monday–Sunday sliding window, `activeDaysThisWeek` measured against a target of 5 days, `lessonsCompletedThisWeek`, `coursesProgressedThisWeek`, and an array of 7 day statuses (`YYYY-MM-DD`, `dayName`, `active`).
- **Initial Achievement Engine**: Deterministic, idempotent, server-awarded achievements evaluated from immutable historical records (`LearningEvent` and `CourseEnrollment`):
  - `first_lesson`: Awarded upon completing first lesson.
  - `first_quiz`: Awarded upon passing first quiz.
  - `first_exercise`: Awarded upon passing first coding exercise.
  - `first_course`: Awarded upon completing first course.
  - `streak_3`: Awarded upon achieving a 3-day learning streak.
  - `streak_7`: Awarded upon achieving a 7-day learning streak.
  - Awarded achievements record `unlockedAt` timestamps and cannot be unlocked twice or overwritten. Badges marketplace, points, XP, levels, and social leaderboards are strictly omitted.
- **Unified Learn & Coding Bridge**: `streakService.js` delegates to `retentionService.js`, harmonizing Coding workspace streaks with platform-wide Learn retention.
- **Continue Learning Improvements**: `courseService.js` filters out completed courses (`isCompleted !== true`), resolving the server-authoritative `nextLessonId`, `nextLessonTitle`, `nextLessonType`, `progressPercent`, and deep-link `resumeUrl` (`/coding/:track/lesson/:lessonId` or `/learn/courses/:slug/lessons/:lessonId`).
- **Anti-Forgery Guarantees**: Frontend requests cannot submit streaks, achievements, or daily/weekly progress totals. Endpoints `GET /api/learn/retention` and `GET /api/learn/home` derive state solely from authenticated server data.

#### 10. Phase 9 Internal Notification Foundation
- **Shared Persistence Domain**: Product notifications extend the established `Notification` model used by site and Life features. Each record is recipient-owned (`user`), typed, timestamped, read/unread, and may carry a safe same-origin action path plus a related entity type/ID/key. A recipient-scoped partial unique index on `(user, dedupeKey)` makes milestone delivery idempotent without affecting legacy notifications.
- **Server-Authored Product Events**: `NotificationService.createProductNotification` accepts only allowlisted product types and requires a bounded deduplication key. No API accepts client-authored notification bodies, recipients, financial state, or arbitrary URLs. Raw page views are not a supported product-notification type.
- **Learner Milestone Bridge**: The unified Phase 8 retention engine compares persisted achievement keys with newly qualified achievements. First lesson/quiz/exercise milestones, first course completion, and 3/7-day streaks create at most one notification per learner and achievement. Notification persistence failure never rewrites learning evidence or grants progress.
- **Recipient-Scoped APIs**: Authenticated routes list the current user's notifications, return unread count, mark one owned notification read, and mark all owned unread notifications read. Responses omit the stored recipient identifier and use `private, no-store` on reads.
- **Minimal Client Surface**: The existing public header adds an authenticated notification bell, unread badge, compact list panel, same-origin action navigation, and one/all read controls without changing global navigation structure. The client polls only unread count while visible; external push and email delivery remain unavailable in this phase.

## Media abstraction

ProtectedMediaAsset records metadata, owner, provider, server-generated storage key, Course association, checksum, and delivery lifecycle. `server/learn/storageService.js` is the private binary storage boundary: a local development filesystem adapter or Cloudflare R2 through the S3-compatible SDK. Creator Course resources and system-owned Coding materials use authenticated, backend-mediated multipart uploads; the server validates MIME/extension and file headers, stores outside public `/uploads`, then marks metadata ready. Private downloads are proxied through a published-resource/Course relation and the existing Premium or exact-Course purchase resolver. Unlinked objects can be explicitly removed by their Creator; linked files are retained when materials are soft-deleted pending deliberate cleanup.

Phase 19 extends the same ProtectedMediaAsset with Mux upload/asset/playback identities and lesson ownership. `mediaProviderService.js` remains the server-only media adapter. A Creator or Admin starts a lesson-scoped Mux direct upload with signed-only playback policy; the browser transfers to the returned short-lived Mux URL. Only Mux-signature-verified raw webhooks can mark an asset ready. Explicit attachment to a CourseLesson requires a ready asset for that exact lesson. The learner playback endpoint rechecks publication and the existing Free/Premium/exact-standalone Course policy before issuing a 15-minute playback JWT. A detached, deleted, processing, or mismatched asset cannot be played through the Lesson. Podcast delivery and malware scanning remain unavailable.

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
- **Provider & Zero-Cost Execution**: `AgentProviderRegistry` routes turns to Mock (development default), Local (OpenAI-compatible endpoint), or the opt-in server-only OpenAI Responses adapter. Unconfigured providers fail closed. The cloud adapter exposes only read tools; native function results remain lower-trust data and pass through the existing authorization pipeline.
- **Tool Registry**: Tools are validated via Zod schemas and bound by timeout budgets. `permissionService` verifies authentication, Premium entitlements, and write-tool feature flags before execution.
- **Confirmation Tokens**: `AgentConfirmationToken` persists only SHA-256 hashes (`tokenHash`), bound to user, conversation, tool, and argument hash with short TTL expiration and atomic single-use consumption.
- **Idempotency & Privacy**: Message delivery is deduplicated via unique index on `(userId, conversationId, clientRequestId)`. Audit records store counts rather than content; provider token counts are persisted on assistant messages. Migration 015 backfills retention deadlines and creates TTL indexes for conversations, messages, and tool audits.
- **Cancellation & Scale**: The existing UI uses non-streaming request/response, with Stop/retry and server disconnect cancellation of provider HTTP. Rate/concurrency guards and telemetry are process-local; distributed leases and centralized metrics are still required before horizontal scale.
- **Voice Pipeline**: Explicit press-to-talk speech-to-text transcribes in-browser and feeds into the standard `sendMessage` pipeline; assistant responses trigger text-to-speech without persistent or background recording.
- **Legacy AI Transition**: The legacy `/api/ai/*` route remains mounted temporarily for CMS compatibility. Only provider availability status is public; completion and management endpoints require Admin. Reader-facing assistant traffic uses `/api/agent/v1/*`.

## Background services

After a successful Mongo connection and HTTP startup, `server/cron.js` schedules:

- hourly notification work and due-account purge;
- hourly Life reminder replenishment/brief scheduling;
- minute-level Life notification delivery processing.

Every scheduler entry checks Mongoose readiness, so a later disconnect does not create uncontrolled database error loops. Production-required workers are not silently disabled; provider-dependent delivery reports failures/unavailability.

## Email and OTP Foundation (Phase 21)

```text
HTTP / Workflow -> emailService -> emailProvider (Smtp / Test / Development) -> Provider Network
HTTP / Auth -> otpService -> OTP Model (bcrypt hash, TTL index) -> emailService / smsService
```

The platform email and OTP architecture establishes a vendor-agnostic foundation for transactional authentication and account security:

- **Email Provider Abstraction**: `emailProvider.js` decouples domain code from specific vendors. It supports SMTP (`SmtpEmailProvider`) with explicit socket/connection timeout budgets (8s default) and sanitized error handling, an in-memory test provider (`TestEmailProvider`) for hermetic Jest suites, and a development fallback (`DevelopmentEmailProvider`). In production, missing credentials fail closed with 503 `OTP_DELIVERY_UNAVAILABLE` without exposing secrets to client callers.
- **Transactional Templates**: `emailTemplates.js` standardizes accessible, branded, high-contrast HTML and plain-text fallbacks for OTP codes, password resets, security alerts, and newsletter verification. Templates explicitly display expiry limits, request context metadata, and security advisories while omitting internal database IDs.
- **OTP Lifecycle & Security**: Generated via `crypto.randomInt(0, 1_000_000)` (6 zero-padded digits) and stored exclusively as bcrypt hashes (`otpHash`) with a MongoDB TTL expiration index (`expiresAt`). Plaintext codes are never persisted and never logged. Verification atomically consumes the document via `findOneAndDelete` with checks for attempt caps (max 5) and expiration, preventing replay attacks. Resend requests enforce a 60-second cooldown window.
- **Anti-Enumeration Protection**: For public password reset and OTP requests, non-existent accounts trigger a simulated bcrypt workload (`bcrypt.hash("dummy_timing_workload", 10)`) and return identical timing-resistant responses ("If an eligible account exists, an OTP will be sent").

## Redis and Background Jobs Foundation (Phase 22)

```text
HTTP / Event -> JobQueue -> [Payload Validation & Deduplication] -> Job Handler -> Execution / Bounded Retry
Domain Services -> RedisClientManager (MemoryAdapter / Node-Redis) -> Namespaced Keys (myjourney:*)
```

The Redis and Background Jobs Foundation introduces a production-oriented asynchronous execution layer:

- **Redis Client Abstraction**: `redisClient.js` provides a canonical connection manager for Redis v5 (`redisManager`). It enforces namespaced keys (`myjourney:*`), server-only credential isolation, and configurable socket timeouts. In local development or test environments without an external Redis instance, it transparently uses an in-memory simulation (`MemoryRedisAdapter`). In production when `REQUIRE_REDIS=true` or when Redis-dependent drivers are selected, missing connectivity fails closed with a 503 `REDIS_UNAVAILABLE` error.
- **Job Queue Architecture**: `jobQueue.js` implements a strictly allowlisted job system (`EMAIL_DISPATCH`, `NOTIFICATION_DISPATCH`, `MAINTENANCE_CLEANUP`, `MEDIA_SYNC`). Every job payload is strongly validated against Zod schemas before enqueueing. Arbitrary serialized functions or unsanctioned job names are rejected with 400/422.
- **Idempotency & Deduplication**: Jobs accept deterministic `deduplicationKey` attributes with TTL caching, ensuring retries and duplicate events cannot trigger duplicate transactional emails, duplicate milestone notifications, or redundant maintenance tasks.
- **Resilience & Bounded Retries**: Failed jobs undergo exponential backoff with a bounded retry limit (max 3). Terminal failures are logged and recorded via `activityLogRepository` without leaking sensitive credentials.
- **Health & Graceful Shutdown**: `readiness.js` incorporates Redis and Queue states into the `/readiness` check. On process termination (`SIGTERM`/`SIGINT`), the queue drains in-flight jobs gracefully within a shutdown timeout before closing connections.

## Play and Life-Adjacent Experiences (Phase 23)

```text
Play Life Engine -> Client-Side State & Reduced Motion -> No Mongo Writes / Private
Play With Friends -> /api/multiplayer -> Mongo-Authoritative Rooms -> Guest Tokens & Socket.IO
```

The Play and Life-Adjacent architecture maintains strict domain boundaries between personal reflective tools and interactive party games:

- **Play Life Engine**: Casual, reflective experience (`/play-life`) operating entirely as a deterministic, client-side state machine (`playLifeEngine.js`). It creates initial state with zero database mutations, adapts to reduced motion settings (`getMotionProfile`), and gracefully recovers from missing scenes or invalid inputs. Emotional transitions and interactive choices remain ephemeral and local to the user session, preserving personal privacy.
- **Play With Friends & Multiplayer Architecture**: Interactive party gaming (`/play-with-friends`) operates via `/api/multiplayer/*` routes and Socket.IO. Game manifests are restricted to an allowlist (`who-knows-me-better`, `life-auction`). Room state is server-authoritative and persisted in MongoDB (`MongoRoomRepository`), protected by optimistic locking with version checks.
- **Guest Tokens & Isolation**: Room participants receive HMAC/JWT-signed guest tokens containing room code and player ID. Tokens issued for one room cannot access or resume another. Player perspectives are serialized per-player to prevent cheating (e.g. hiding pending questions or secrets). Duplicate nicknames within a room return 409 conflict, and malformed codes or payloads are rejected via Zod/REST schema validation (422).
- **Life vs Play Separation**: The MyJourney Life domain (`server/life/`, `/life`) is private to the authenticated user and protected by server-side authorization. Play Life and Play With Friends do not read, write, or leak Life goals, journals, habits, or private financial records.

## Multiplayer Games and Play Hub (Phases 24, 25, 26)

```text
Play Hub (/play) -> Catalog Registry (Solo & Multiplayer) -> Navigation / Room Join
Party Host -> /api/multiplayer/rooms -> Socket.IO (party:switch-game) -> Who Knows Me Better / Life Auction
```

The multi-game multiplayer platform expands party entertainment while enforcing strict server authority, zero client trust, and complete privacy from user Life records:

- **Who Knows Me Better? (Phase 24)**: Live social guessing game (`server/multiplayer/games/whoKnowsMeBetter/`). The host configures personal question prompts during the setup phase; server-side state projection conceals host answers from other players until all have submitted or the deadline expires. Server calculates speed-weighted scoring (100–1000 pts) based on elapsed time within each round window. Real-time standings break ties deterministically, and host transfer/disconnection grace periods preserve party stability without accessing any user Life history.
- **Life Auction (Phase 25)**: Strategic bidding game (`server/multiplayer/games/lifeAuction/`). All players start with an equal virtual budget (default 100 Life Coins). Bids are validated atomically by the server against current balances and minimum increments. Outbid reservations are refunded immediately. Features open ascending and sealed-bid auction rounds, mystery lots, and server-determined tie breaks. Zero persistent currency is stored, and zero private Life workspace or financial records are touched.
- **Play Hub and Multi-Game Catalog (Phase 26)**: Centralized gaming surface (`/play`) backed by a unified catalog registry (`src/features/play/playCatalog.js` and `server/multiplayer/games/registry.js`). Exposes both solo experiences (`/play-life`, `/play/this-or-that`, `/play/rapid-reflections`) and live multiplayer experiences (`/play/who-knows-me-better`, `/play/life-auction`). In-party game switching (`party:switch-game`) permits the host of a finished party room to transition all connected guests into another game without disbanding the lobby. Solo games run client-side with complete accessibility and zero database mutation.

### About, Projects, and Platform Architecture (Phase 27)

- **The Five Pillars**: MyJourney is organized around five distinct pillars: READ (`/articles`), LEARN (`/learn`, `/coding`), LIFE (`/life`), CREATE (`/creator-studio`), and PLAY (`/play`, `/play-life`, `/play-with-friends`).
- **Pillar Connectivity & Cross-Surface Synergy**: Public reading surfaces inspire learning; coding and learning tracks build technical skills; reflection in Play dilemmas builds self-awareness; the private Life OS supports personal growth and habits; and the Creator Studio empowers users to author and publish for the community.
- **Strict Privacy Guarantees**: The Life OS domain (`/life`) remains strictly zero-knowledge and isolated to the authenticated user. Public pages, showcase engines, and search indexing never read, index, or expose private Life data.
- **Honest Journey AI Boundaries**: Platform AI services assist with learning comprehension, code debugging, and editorial drafting. They operate under explicit boundaries and never claim authoritative medical, clinical, legal, or financial guarantees.
- **Projects & Flagship Showcase**: The dedicated `/projects` route presents the core platform engines alongside interactive flagship games (Play Life, Play With Friends). Dynamic CMS-authored portfolio items supplement the platform showcase without overwriting canonical interactive games.

### Global Search, Discovery & Home Personalization Architecture (Phase 28)

- **Universal Search Engine (`/api/search`)**: Aggregates multi-domain discovery across published public Articles, Stories, Learn Courses, Coding Tracks, Creator Profiles, and Play Catalog games.
- **Strict Privacy Isolation**: The Life OS domain (`server/life/`, `/life`) is completely excluded from search and discovery. Search never queries, indexes, or returns private Life journals, habits, finances, or moods.
- **Sanitized Authority & Immutability**: Protected bodies and server solutions are never returned in search result projections. Draft, archived, or soft-deleted content is filtered at the database level.
- **Home Discovery & Personalization (`/api/search/discovery/home`)**: Serves authenticated learners with Continue Learning cards (populated with course title, progress percentage, next lesson, and direct resume route). For anonymous or new users, it provides deterministic recommendations and flagship engine quick-starts without third-party tracking.
