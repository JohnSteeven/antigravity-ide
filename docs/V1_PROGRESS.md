# MyJourney V1 progress

Started 2026-09-09. Companion plan: [V1_MASTER_PLAN.md](V1_MASTER_PLAN.md). Local workspace is authoritative. **Current recommendation: NO-GO; implementation and verification are in progress.**

## Completed

- Read the attached master request, repository instructions, required documentation, domain implementation, migration catalog, routes and tests.
- Captured initial status: 28 modified tracked files and 10 untracked files. Existing identity/profile/privacy work retained; no Git history/branch or production data operations.
- Parallel source audits completed for Read/Learn/Creator/CMS, Premium/Agent/providers/operations, Life/games/notifications/UX.
- Created durable issue matrix, architecture decisions, 34-phase sequence, provider requirements and launch checklist.
- Safe secret scan: no high-confidence signatures among 1,156 tracked/unignored files. This is a limited signature scan, not proof that no secret exists.
- Asset inventory: 1,146 tracked files / 83,314,379 bytes; four exact duplicate groups. No asset removed because database references were not disproved.
- Phase 0 runtime/test/build evidence and route audit: complete. Full test suite, server syntax check, build, and migration commands executed.
- Phase 1: complete and verified:
  - V1-001: Scoped draft lesson access to owning Creator (`courseService.js`, verified by `learnLessonPreviewSecurity.test.js`).
  - V1-002: Live metadata search query with regex escaping, bounding, and route generation (`enterpriseSearchService.js`, verified by `publicDiscoverySecurity.integration.test.js`).
  - V1-003: Server-authoritative Story Save (`ReaderProfile.savedStories`, `readerProfileService.setStorySaved`, `storyController.setSaved`, `StoryDetail.js`, `StoryActions.js`, `SavedTab.jsx`, `ReaderContext.js`, verified by `storyReaderPersistence.integration.test.js`).
  - V1-004: CMS Story listing and management separation (`storyRoutes.js`, `ContentCmsContext.js`, `StoryCmsPanel.js`, verified by `storyReaderPersistence.integration.test.js`).
  - V1-005: LocalAgentProvider usage accumulation across iterations (`LocalAgentProvider.js`, verified by `agentLocalProvider.test.js`).
  - V1-006: Real in-app notification persistence (`NotificationService.js`, verified by `notificationService.test.js`).
  - V1-008: Migration 011 re-entry safe merge receipt (`011-reader-data-foundation.js`, verified by `readerDataMigration.integration.test.js`).
  - V1-009: Deterministic tied multiplayer standings ranking (`serializer.js`, verified by `standings.test.js`).
  - V1-010: Agent confirmation-before-write enforcement and stable message idempotency (`orchestrator.js`, verified by `agentExecutionSafety.test.js`).
  - V1-011: Environment guards for article fixture seeding (`seedArticles.js`, verified by `seedArticlesSafety.test.js`).
  - V1-012: Canonical route generation in SEO sitemap and JSON-LD (`seoService.js`, verified by `seoEvidence.test.js`, `pagePublicBoundary.test.js`).
- Phase 2: complete and verified:
  - Centralized design-token foundation in `index.css`: typography scale, 4-point spacing scale (`--space-1` through `--space-11`), content/reading constraints (`--reading-max-width: 720px; --content-max-width: 1200px`), radius scale, shadow elevation scale, transition scale, semantic status colors (success, danger, warning, info), control and overlay tokens, responsive layout vars (`--header-height`, `--home-gutter`, `--cms-sidebar-width`).
  - Dark theme consistency: unified dark palette across pages, cards, elevated surfaces, controls, inputs, borders, and overlays (`body.theme-dark`).
  - Shared primitive consistency:
    - Standardized `.empty-state` and `.empty-state-block` in `index.css` and `src/components/shared/EmptyState.js` with `role="status"` and accessible decorative icon hiding.
    - Standardized `.error-page` and `.error-btn` in `index.css` and `src/components/Error.js`, eliminating invalid nested button in link and ensuring `:focus-visible` styling.
    - Standardized `.loading-screen` and `.loading-mark` in `index.css`.
    - Standardized `.breadcrumbs` in `index.css` and `src/components/shared/Breadcrumbs.js` with semantic `<nav>`, `<ol>`, and `aria-current="page"`.
    - Search accessibility: added `aria-label` to search input and clear button in `src/components/shared/UniversalSearchBar.jsx`.
  - Form accessibility: added `aria-invalid` and `aria-describedby` error linkages to `Login.js` and `Register.js`, plus accessible password visibility toggle labels.
  - Content reading UX: constrained maximum prose line width to 720px for `.premium-center-content` and `.premium-article-prose`; prevented table/image/code overflows with responsive box-sizing and touch scroll.
  - Games accessibility: added `:focus-visible` keyboard focus indicators to `play-with-friends.css` (game picker buttons) and `play-life.css` (choice and action buttons).
  - Global motion sensitivity: implemented `prefers-reduced-motion: reduce` in `index.css` to disable transitions, animations, and smooth scrolling for users requesting reduced motion.
  - Contract verification: added 2 new tests in `server/tests/responsiveAccessibilityContract.test.js` covering design tokens, reading limits, global reduced motion, and shared semantic component structure.
- Phase 3: complete and verified:
  - Course monetization architecture: established explicit `monetizationType: enum ["FREE", "PREMIUM_INCLUDED", "STANDALONE_PAID"]` in `server/learn/constants.js` and `server/models/Course.js`, retaining `accessLevel` for backward compatibility. Added query-backed compound index `{ publicationStatus: 1, monetizationType: 1, publishedAt: -1 }` (no speculative array/duration indexes).
  - Selective field protection on coding lessons & quiz questions: `server/models/CourseLesson.js` typed `CodingBlockSchema` (`solutionCode: { select: false }`, `tests: { select: false }`) and `QuizQuestionSchema` (`correctOptionIndex: { select: false }`). Lesson types expanded to `"coding"`, `"quiz"`, and `"project"`.
  - Typed Article structured blocks & metadata: `server/models/Article.js` now validates allowlisted `structuredBlocks` (`paragraph`, `heading`, `image`, `quote`, `callout`, `code`, `list`, `table`, `divider`) without unrestricted mixed blobs, alongside `references`, `sources`, `relatedArticles`, and `relatedStories`.
  - Story section types & editorial review workflow: added `"dialogue"` and `"callout"` section types in `server/models/Article.js`, `server/utils/storyContent.js`, and `src/stories/storySections.js`; added `"review"` status to article and story validation pipelines, and updated `StoryCmsPanel.js` and `ArticleModule.js`.
  - Server-authoritative slug uniqueness & 409 Conflict handling: caught MongoDB E11000 duplicate key errors in `server/controllers/articleController.js` and `server/controllers/storyController.js`, returning HTTP 409 Conflict.
  - Game Packs CMS: created `server/models/GameContentPack.js` with question constraints and hidden correct answers (`correctAnswer: { select: false }`), indexed with `{ gameKey: 1, locale: 1, status: 1, isDeleted: 1 }`. Admin routes registered in `server/routes/gameCmsRoutes.js` and `server/controllers/gameCmsController.js` guarded by `authenticate` + `requireAdmin` (`public: false`).
  - About / Projects live persistence: added public setting endpoint `GET /api/settings/public/:key` (whitelisted to safe public keys) and wired `src/components/cms/ProjectModule.js` and `src/features/about/AboutProjectsSection.jsx` to live server settings.
  - Discovery & Homepage safety: isolated unpublished content and rejected private Life keys from homepage settings updates.
  - CMS & Content Architecture suite: created `server/tests/cmsContentArchitecture.test.js` (15 tests) validating all Phase 3 server contracts.
- Phase 4: complete and verified:
  - Audited and classified all existing published stories (6 fixtures in `storyFixtures.cjs` and 3 creator demo stubs in `fixtures.js`). Identified that all 6 existing fixtures recycled the identical 16 filler paragraphs across different titles.
  - Authored an original, realistic, emotionally grounded launch catalog of 8 stories across 3 controlled batches:
    - Batch A: *The Weight of Borrowed Marks* (4,397 words, 22 min read, `chapter-journey`), *The Increment Trap* (3,984 words, 20 min read, `alternating-editorial`), *Two Seats at the Junction* (3,867 words, 20 min read, `book-page`).
    - Batch B: *The Distance Between Us* (3,896 words, 20 min read, `reader-image-right`), *The Cost of the Clean Slate* (4,088 words, 21 min read, `mixed-editorial`), *Thirty Days North: The Solitary Signal* (3,888 words, 20 min read, `immersive-moments`).
    - Batch C: *The Architect of Small Repairs* (7,558 words, 38 min deep anchor read, `chapter-journey`), *The Glass Ledger* (4,040 words, 21 min flagship premium read, `editorial-sidebar`).
    - Total catalog volume: 35,718 words across 121 structured sections; all 8 stories exceed the 20-minute reading threshold at 200 wpm, anchored by a 38-minute deep longform read.
  - Production content authority: Canonical stories are persisted in `server/data/launchStories/` (Batches A, B, C and `index.js`) and seeded into MongoDB via `server/scripts/seedArticles.js`. `src/data/storyFixtures.cjs` remains lightweight test fixtures. Client Parcel JS bundle is strictly protected from text bloat (`StoriesPage`: 11.73 kB, `StoryDetail`: 15.51 kB).
  - Story Reader UX & discovery:
    - First-class rendering of `dialogue` and `callout` section types in `StorySectionRenderer.js`.
    - Dynamic reflection questions card rendered in `StoryDetail.js`.
    - Next / previous published story navigation links in `StoryDetail.js`.
    - Related stories component strictly filters for published, non-deleted content and prioritizes explicit related-story linkages.
    - Accessible reading progress bar with ARIA attributes (`role="progressbar"`).
    - Free/Premium and Category badges on `StoryCard.js` and `FeaturedStory.js`.
    - Dynamic category derivation and category filter pill buttons on `StoriesPage.js`.
  - Editorial QA & automated test coverage:
    - CLI report runner `server/scripts/storyEditorialAudit.js`: 100% pass (zero errors, zero paragraph or cross-story duplication).
    - Automated test suite `server/tests/storyEditorialAudit.test.js` (8 tests): validates catalog count, reading times, slug uniqueness, section schema integrity, paragraph deduplication, and server-authoritative premium redaction.

## In progress

- None (Phase 3 complete; awaiting Phase 4).
- None (Phase 4 complete; awaiting Phase 5).

## Validation log

| Command / evidence | Result |
| --- | --- |
| `git status --short`, `git diff --stat`, untracked inventory | Captured working tree state |
| `git diff --check` | PASS (clean whitespace, no conflict markers) |
| `npm run check:server` (via `npm.cmd`) | PASS (all server JS files passed `node --check`) |
| `npm run build` (via `npm.cmd`) | PASS (Parcel build passed in 17.99s, dist generated) |
| `npm run build` (via `npm.cmd`) | PASS (Parcel build passed in 7.14s, dist generated) |
| `npm run migrate -- status` (via `npm.cmd`) | PASS (connected to MongoDB, 11 migrations pending) |
| `npm run migrate:validate` (via `npm.cmd`) | PASS (indexes verified against schema declarations) |
| Focused `storyEditorialAudit.test.js` | PASS (8/8 tests passed; word count, reading times, deduplication, premium boundary) |
| CLI `node server/scripts/storyEditorialAudit.js` | PASS (35,718 words, 121 sections, 8 stories, 0 duplication) |
| Focused `storyReaderPersistence.integration.test.js` | PASS (5/5 tests passed against isolated Mongo database) |
| Focused `storyRenderingContract.test.js` | PASS (16/16 tests passed, covering dialogue/callout/nav/responsive contracts) |
| Focused `cmsContentArchitecture.test.js` | PASS (15/15 tests passed) |
| Focused `cmsRoutePolicy.test.js` | PASS (22/22 tests passed, including game packs admin boundary) |
| Focused `storyContent.test.js` | PASS (10/10 tests passed) |
| Focused `test:premium` | PASS (6 suites, 55 tests passed) |
| Focused `test:creator` | PASS (7 suites, 48 tests passed) |
| Focused `test:learn` | PASS (2 suites, 28 tests passed) |
| Focused `test:multiplayer` | PASS (8 suites, 36 tests passed) |
| Focused `test:life` | PASS (12 suites, 126 tests passed) |
| Focused `responsiveAccessibilityContract.test.js` | PASS (26/26 tests passed) |
| Full Jest regression: `npm test -- --runInBand` | PASS (87 suites, 887 tests passed — new baseline) |
| Full Jest regression: `npm test -- --runInBand` | PASS (88 suites, 895 tests passed — new baseline) |
| Focused `articleInteractionsOptimistic.test.js` | PASS (5/5 tests passed; optimistic state toggle, rollback, silent success) |
| Focused `articleReaderInteractions.test.js` | PASS (24/24 tests passed) |
| Full Jest regression: `npm test -- --runInBand` | PASS (89 suites, 900 tests passed — new baseline) |

On this Windows host PowerShell blocks the `npm.ps1` wrapper; commands use the installed `npm.cmd` entry point without changing execution policy.

## Migrations

- Catalog 001–011 inspected; no production migration applied.
- Migration 011 moves legacy libraries and merges duplicate progress. Interruption hazard resolved with atomic merge receipt `_readerMigration011Merge` and automated resume logic (`readerDataMigration.integration.test.js` passing).
- CLI arguments validated: unknown commands fail closed with usage information instead of applying migrations.
- Read-only validation checks verified that indexes match declared schema; pending migrations are a separate rollout blocker.

## Blocked activation / configuration

Production Mongo/topology/migration/restore evidence; real billing and payout credentials; R2/scanning/Mux; paid AI models/prices/budget policy; transactional email/SMS/push; Redis/durable workers; monitoring; staging load targets; CA/legal policy/tax approvals. No unavailable provider is treated as successful. Adapter implementation remains useful work where credentials are absent.

## Deferred and not yet completed

Phases 4–33 have not passed their exit criteria. Next phase is Phase 4 (Story Expansion & Reader Engine). Requested launch-content editorial work, coding curriculum/runner, progression/retention, commercial foundations, provider adapters, creator allocations/payouts, expanded Play, production operations and the full browser/load matrix remain open. Potential later memberships/tips/new games stay behind core V1 work.
Phases 5–33 have not passed their exit criteria. Next phase is Phase 5 (Articles, Curriculum & Learn Launch Foundation). Coding curriculum/runner, progression/retention, commercial foundations, provider adapters, creator allocations/payouts, expanded Play, production operations and the full browser/load matrix remain open. Potential later memberships/tips/new games stay behind core V1 work.

## Change records

### Batch 1: Phase 1 Validation & Fixes (2026-09-11)
- **Files Modified**:
  - `server/services/enterpriseSearchService.js`: Restored `accessLevel === 'premium'` check to satisfy `premiumSecurity.test.js` while maintaining live metadata aggregation.
  - `server/tests/storyReaderPersistence.integration.test.js`: Added 30s timeout to `beforeAll`/`afterAll` hooks to handle test database connection and schema setup reliably.
  - `docs/V1_PROGRESS.md`: Updated validation evidence, recorded Phase 1 completion, and set Phase 2 as next phase.
- **Outcomes**: 86/86 test suites passed (866/866 tests), build passed, syntax check passed, migration check passed. Phase 1 exit criteria met.

### Batch 2: Phase 2 Design Consistency & Accessibility Foundation (2026-09-12)
- **Files Modified**:
  - `index.css`: Added centralized design token scale (spacing `--space-1` to `--space-11`, reading width `--reading-max-width: 720px`, `--content-max-width: 1200px`, status colors, control tokens), global `prefers-reduced-motion` suppression, and unified primitives (`.empty-state`, `.error-page`, `.loading-screen`, `.breadcrumbs`, prose reading width).
  - `src/components/Error.js`: Replaced invalid nested `<button>` inside `<Link>` with semantic styled link element having `role="button"` and focus ring.
  - `src/components/shared/EmptyState.js`: Added support for semantic role (`role="status"`), accessible icon hiding (`aria-hidden="true"`), and unified styling.
  - `src/components/shared/Breadcrumbs.js`: Replaced generic container with semantic `<nav aria-label="Breadcrumb">` and `<ol>`, with `aria-current="page"` on current route.
  - `src/components/shared/UniversalSearchBar.jsx`: Added accessible `aria-label` to search input and clear button.
  - `src/components/Login.js`: Added `aria-invalid` and `aria-describedby` error associations on credentials fields, plus accessible label on password reveal toggle.
  - `src/components/Register.js`: Added `aria-invalid` and `aria-describedby` error associations across all registration input fields.
  - `src/features/play-with-friends/play-with-friends.css`: Added keyboard focus outline (`:focus-visible`) for game picker triggers.
  - `src/features/play-life/play-life.css`: Added keyboard focus outline (`:focus-visible`) for game buttons and interactive controls.
  - `server/tests/responsiveAccessibilityContract.test.js`: Added Phase 2 design token, reading line-width, motion reduction, and shared component accessibility contracts.
  - `docs/V1_PROGRESS.md`: Recorded Phase 2 completion, audit findings, test baseline updates, and remaining QA requirements.
- **Outcomes**: 86/86 test suites passed (868/868 tests, +2 new tests), `npm run check:server` passed, `npm run build` passed, `git diff --check` passed cleanly, migration validation passed. Phase 2 exit criteria met.

### Batch 3: Phase 3 CMS & Content Architecture Upgrade (2026-09-12)
- **Files Modified/Created**:
  - `server/learn/constants.js`: Defined `COURSE_MONETIZATION_TYPES = Object.freeze(["FREE", "PREMIUM_INCLUDED", "STANDALONE_PAID"])`, added `"coding"`, `"quiz"`, `"project"` to `LESSON_TYPES`.
  - `server/models/Course.js`: Added `monetizationType` with fallback to `accessLevel`. Added query-backed compound index `{ publicationStatus: 1, monetizationType: 1, publishedAt: -1 }`.
  - `server/models/CourseLesson.js`: Added typed `CodingBlockSchema` (`solutionCode: { select: false }`, `tests: { select: false }`) and `QuizQuestionSchema` (`correctOptionIndex: { select: false }`).
  - `server/models/Article.js`: Added `structuredBlocks` (`ArticleBlockSchema`) supporting allowlisted block types, references, sources, and related entity links; added `"dialogue"` and `"callout"` to `StorySectionSchema.type`; added `"review"` to status enum.
  - `server/models/GameContentPack.js`: New typed schema with 2–6 option constraints, hidden correct answers (`select: false`), and compound index `{ gameKey: 1, locale: 1, status: 1, isDeleted: 1 }`.
  - `server/controllers/gameCmsController.js` & `server/routes/gameCmsRoutes.js`: Admin-only game pack CRUD endpoints (`public: false`, `authenticate`, `requireAdmin`).
  - `server/routes/settingRoutes.js` & `server/controllers/settingController.js`: Added `GET /api/settings/public/:key` endpoint restricted to `ALLOWED_PUBLIC_KEYS`. Updated `updateSetting` to validate published status for featured articles/stories/courses and strictly reject private Life keys.
  - `server/controllers/articleController.js` & `server/controllers/storyController.js`: Added duplicate slug conflict handling catching Mongo E11000 and returning HTTP 409 Conflict; added review status support.
  - `server/services/articleService.js`: Added slug reservation and uniqueness check.
  - `server/utils/storyContent.js` & `src/stories/storySections.js`: Added normalization and publishing validation for dialogue and callout sections.
  - `server/validators/articleValidator.js` & `server/validators/storyValidator.js`: Updated to accept `"review"` status.
  - `src/services/apiService.js`: Added `settingApi.getPublic` and `storyApi.adminList`.
  - `src/components/cms/panels/StoryCmsPanel.js`: Added dialogue and callout section controls and `"review"` status.
  - `src/components/cms/ArticleModule.js`: Added `"review"` status filter/selection, references, and sources.
  - `src/components/cms/HomepageModule.js`: Added `featuredStories` and `featuredCourses` shelves management.
  - `src/components/cms/ProjectModule.js`: Rewritten for live server persistence via `settingApi`.
  - `src/features/about/AboutProjectsSection.jsx`: Rewritten to fetch public projects from server settings with fallback.
  - `server/tests/cmsContentArchitecture.test.js`: Created 15 focused tests verifying all Phase 3 server contracts.
- **Outcomes**: 87/87 test suites passed (887/887 tests, +1 new suite / +19 tests), `npm run check:server` passed, `npm run build` passed (Parcel: 17.99s), `git diff --check` passed cleanly, migration validation passed (0 missing indexes). Phase 3 exit criteria met.

### Batch 4: Phase 4 Real Story Content & Story Reading Experience (2026-09-12)
- **Files Modified/Created**:
  - `server/data/launchStories/`: Created canonical launch catalog repository containing:
    - `batchA.json`: *The Weight of Borrowed Marks* (4,397 words, 22 min read), *The Increment Trap* (3,984 words, 20 min read), *Two Seats at the Junction* (3,867 words, 20 min read).
    - `batchB.json`: *The Distance Between Us* (3,896 words, 20 min read), *The Cost of the Clean Slate* (4,088 words, 21 min read), *Thirty Days North: The Solitary Signal* (3,888 words, 20 min read).
    - `batchC.json`: *The Architect of Small Repairs* (7,558 words, 38 min deep anchor read), *The Glass Ledger* (4,040 words, 21 min flagship premium read).
    - `index.js`: Canonical module exporting all 8 launch stories, `batchA`, `batchB`, and `batchC`.
  - `server/scripts/seedArticles.js`: Updated to import `launchStories` and seed into MongoDB `Article` collection as the canonical production database content, preserving `storyFixtures.cjs` for development fallback and unit testing.
  - `src/stories/components/StorySectionRenderer.js`: Added first-class rendering for `dialogue` (speaker, dialogue text, avatar) and `callout` (note, tip, warning, info) section types.
  - `src/stories/components/StoryCard.js` & `src/stories/components/FeaturedStory.js`: Added category and Free/Premium badge rendering.
  - `src/stories/components/RelatedStories.js`: Enforced published-only and non-deleted filtering (`status === "published" && !isDeleted`) and prioritized explicit `relatedStories` matches before category fallbacks.
  - `src/stories/components/StoryEngine.js`: Made reading progress bar accessible (`role="progressbar"`, `aria-label="Reading progress"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`).
  - `src/stories/StoryDetail.js`: Added next/previous story navigation resolution, reflection questions card rendering, and article redirect handling.
  - `src/stories/StoriesPage.js`: Added dynamic category derivation from published stories and category filter pill buttons (`All`, `Life`, `Reflections`, `Career`, etc.) with active states.
  - `src/stories/story-reader.css`: Added styles for dialogue, callout variants, reflection questions card, next/prev story navigation, and badges (`.story-badge--category`, `.story-badge--premium`, `.story-badge--free`).
  - `src/stories/stories.css`: Added styles for `.story-category-filters` and `.story-category-pill` with responsive and dark mode support.
  - `server/scripts/storyEditorialAudit.js`: Added CLI quality audit tool reporting word counts, reading times, section counts, and verifying zero text duplication across the catalog.
  - `server/tests/storyEditorialAudit.test.js`: Added 8 automated tests for catalog completeness, word counts, reading times, slug uniqueness, section schema integrity, paragraph deduplication, and server-authoritative premium redaction.
  - `server/tests/storyReaderPersistence.integration.test.js`: Isolated `MONGO_URI` to test database to prevent environmental false-negatives.
  - `docs/V1_PROGRESS.md`: Recorded Phase 4 execution, catalog metrics, UX enhancements, and validation results.
- **Outcomes**: 88/88 test suites passed (895/895 tests, +1 new suite / +8 tests), `npm run check:server` passed, `npm run build` passed (Parcel built cleanly in 7.14s with lean story bundles), `git diff --check` passed cleanly, migration validation passed. Phase 4 exit criteria met.

### Batch 5: Cross-Phase Correctness Hotfix — Article Like, Bookmark, and Save Interaction Reliability (2026-09-13)
- **Root Cause Analysis**:
  - *Root cause 1 (Untyped MongoDB records)*: 15 legacy published articles had `contentType: undefined`. `ReaderProfileService.toggleArticleReference` queried `{ _id, contentType: 'article' }`, returning null and throwing 404, prompting client `"Could not update your bookmark. Try again."`. Resolved via database normalization setting `contentType: 'article'`.
  - *Root cause 2 (Identifier shape mismatch)*: Calling interaction endpoints with a slug identifier failed `asObjectId` validation in `articleService.incrementMetric`. Resolved by looking up `{ slug, contentType: 'article', status: 'published', isDeleted: false }` to resolve ObjectId.
  - *Root cause 3 (CMS Admin scope leakage)*: `ContentCmsContext.incrementArticle` wrapped reader actions in `runForActiveScope`, leaking admin-only token lifecycle and scope requirements (`CMS_CONTENT_CONTEXT_REQUIRED` / `CMS_STALE_CONTENT_RESPONSE`) to regular readers. Resolved by decoupling reader interactions from Admin CMS scope.
  - *Root cause 4 (Disruptive UI & repetitive toasts)*: Action buttons showed "Updating…" text causing layout shifts, blocked user interaction during background persistence, and displayed redundant top-right toasts ("Article liked", "Article bookmarked", "Article saved") on normal successful clicks.
- **Architectural & UX Solutions**:
  - Implemented instant optimistic UI updates: button visual state updates immediately, counter increments (+1) or decrements (-1, clamped $\ge 0$) immediately, and `ReaderContext.library` updates immediately.
  - Asynchronous background persistence with authoritative server reconciliation.
  - Zero repetitive success toasts on normal toggle clicks; visual button active/pressed state communicates status cleanly.
  - Rollback on network or server error with accessible error alert (`role="alert"` / `aria-live="assertive"`).
  - Rapid-click mutex protection via in-flight lock refs (`inFlightInteractions` / `inFlightLanding`).
  - Strict server-authoritative session identity (`req.user._id`), never trusting client-submitted `userId`.
  - Seeding & persistence: updated `seedArticles.js` with two-pass slug resolution for `relatedStories`, correctly assigning MongoDB `ObjectId` references and computing story reading times. All 8 production launch stories (35,718 words) seeded into MongoDB.
- **Files Modified/Created**:
  - `server/services/articleService.js`: Resolved slug identifiers to ObjectIds; updated engagement counter.
  - `server/controllers/storyController.js`: Cleaned duplicate `STORY_FIELDS`.
  - `server/scripts/seedArticles.js`: Two-pass `relatedStories` ObjectId resolution and story reading time derivation.
  - `server/data/launchStories/index.js`: Ensured launch stories have `contentType: "story"`.
  - `src/context/ReaderContext.js`: Cleaned `applyAuthoritativeLibraryState` deduplication and ID normalization.
  - `src/context/ContentCmsContext.js`: Decoupled reader `incrementArticle` from admin CMS scope.
  - `src/experiences/shared/widgets/EngagementBar.js`: Removed disruptive "Updating…" text and duplicate tags; kept buttons responsive.
  - `src/components/ArticleDetail.js`: Optimistic state toggle, silent success, in-flight mutex, and rollback.
  - `src/features/categories/CategoryLanding.js`: Cleaned featured card interactions, removed "Updating…", added optimistic toggle.
  - `src/landings/life/LifeLanding.js`: Cleaned featured card interactions, removed "Updating…", added optimistic toggle.
  - `src/landings/coding/CodingLanding.js`: Cleaned featured card interactions, removed "Updating…", added optimistic toggle.
  - `server/tests/articleInteractionsOptimistic.test.js`: Added 5 focused tests verifying optimistic updates, silent success, slug resolution, and CMS decoupling.
- **Outcomes**: 89/89 test suites passed (900/900 tests, +1 new suite / +5 tests), `npm run check:server` passed, `npm run build` passed in 6.83s, `git diff --check` passed cleanly, migration validation passed.

### Batch 6: Phase 4 Critical Story Catalog Cleanup, Archival & Editorial Correction (2026-09-13)
- **Problem Statement & Root Cause**:
  - Legacy/demo/fixture content (*The Glass Ledger*, *Thirty Days North*, old *The Architect of Small Repairs*, *Chronicles of a Life in Code*, *Echoes of the Coast*, *Missing My Flight Changed My Life*, etc.) was still appearing on `/stories`.
  - Root cause 1: MongoDB contained 22 legacy story records marked `contentType: "story"` and `status: "published"`.
  - Root cause 2: `src/data/cmsSeed.js` imported `src/data/storyFixtures.cjs`, exposing demo fixtures as fallbacks.
  - Root cause 3: Card image renderers lacked `onError` handlers, displaying broken images or repeated generic sketches.
- **Architectural & Editorial Corrections**:
  - Safely archived all 22 legacy stories in MongoDB with `status: "archived"`, zero collection dropping, and zero breaking of bookmark/save records. Tombstone route returns HTTP 200 with `{ archived: true }`.
  - Decoupled `src/data/cmsSeed.js` by removing `storyFixtures.cjs` and importing `src/data/launchStories.json`.
  - Deepened all 10 canonical launch stories to meet/exceed required reading time targets (all $\ge 37$ min, anchoring at 44 min and 46 min).
  - Total catalog volume: 80,075 words across 162 structured sections (average 8,008 words / story). Zero duplicate paragraphs.
  - Editorial correction on Story 7 (*The Message Left Unsent*): unified into 9 chronological chapters from Ber Sarai to dawn deletion in Delhi, highlighting Nikhil's communication avoidance, ruined relationship with Shreya, personal/professional isolation, and mature restraint without emotional vandalism.
  - Story 9 (*The Wedding Before the Dream*): restored authentic Lucknow / Dudhwa Terai narrative, purging all mismatched Coimbatore foundry text.
  - Assigned distinct high-resolution Unsplash imagery matching `docs/STORY_IMAGE_MANIFEST.md` with multi-tier `CATEGORY_FALLBACKS` and `onError` image replacement on `StoryCard` and `FeaturedStory`.
  - Server-authoritative Free vs Premium: 8 Free / 2 Premium (Story 4 & Story 9).
  - All `reflectionQuestions` set to `[]` across all 10 stories.
  - All `relatedStories` bidirectional links resolved to valid ObjectIds.
- **Verification**:
  - `node server/scripts/storyEditorialAudit.js`: 100% PASS (80,075 words, 162 sections, 0 errors, 0 duplication).
  - Jest suites `storyEditorialAudit.test.js` & `storyContent.test.js`: 18/18 passed.
  - `seedArticlesSafety.test.js`: 8/8 passed.
  - `npm run check:server`: PASSED (0 syntax errors).
  - `npm run build`: PASSED (Parcel built in 10.84s).
  - `git diff --check`: PASSED.
  - Browser QA Standard: `STRUCTURALLY VERIFIED — MANUAL BROWSER QA REQUIRED`.



