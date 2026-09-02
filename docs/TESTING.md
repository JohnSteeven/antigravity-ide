# Testing

## Test organization

Jest uses the Node environment and discovers `server/tests/**/*.test.js`. The suite includes:

- domain/service unit tests;
- client source contracts;
- Express/Supertest security and route tests;
- migration/index contracts;
- Story renderer/content contracts;
- Life, Premium, Creator, and Learn suites;
- Socket.IO and REST multiplayer integration tests;
- database-backed private-beta checks.

Tests that create database fixtures must use unmistakable test identities and clean them in `afterAll`/`afterEach`.

## Focused suites

```bash
npm run test:life
npm run test:premium
npm run test:creator
npm run test:learn
npm run test:multiplayer
```

Focused auth/startup checks:

```bash
npx jest --runInBand server/tests/authOtp.test.js server/tests/authClientContract.test.js server/tests/dbStartup.test.js server/tests/runtimeDiagnostics.test.js server/tests/schedulerLifecycle.test.js server/tests/auditLogger.test.js
```

Focused Reader/Profile checks:

```bash
npx jest --runInBand server/tests/articleReaderInteractions.test.js server/tests/readerDataFoundation.test.js server/tests/readerDataMigration.test.js server/tests/authorizationBoundaries.test.js
```

These cover User/ReaderProfile ownership, DTO privacy, atomic Article library toggles/counters, authenticated Like/Bookmark/Save boundaries and response contracts, ReaderContext/Profile synchronization, native Share and clipboard failure paths, atomic monotonic progress, completion compare-and-set, Article-only enforcement, unique-index migration behavior, editable account fields, notification time-slot consistency, and source contracts excluding fabricated Profile data.

Core reliability contract checks:

```bash
npx jest --runInBand server/tests/authClientContract.test.js server/tests/articleReaderInteractions.test.js server/tests/coreInteractionReliability.test.js server/tests/readerDataFoundation.test.js server/tests/readerDataMigration.test.js server/tests/authorizationBoundaries.test.js
```

## Browser smoke tests

Playwright runs a deterministic Chromium journey with an isolated UI on port 1235, API on port 5001, and Mongo database whose name must end in `_e2e` or `_test`:

```bash
npx playwright install chromium
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:report
```

The default database is `mongodb://127.0.0.1:27017/myjourney_e2e`. Override it only with `E2E_MONGO_URI` naming an unmistakable test database. Global setup upserts fixed Reader/Article fixtures and clears only their test-owned Reader/session state. It does not weaken production authentication, contact SMTP/SMS, use personal Admin records, or run migration 011.

The initial journey covers cookie/CSRF login, desktop Categories navigation, published Article open, Like/Unlike visual and reload state, Bookmark and Save persistence/Profile synchronization, canonical Share fallback feedback, reading progress, Light/Dark active-state CSS, logout/login account isolation, and the mobile drawer. See `docs/CORE_INTERACTION_INVENTORY.md` for browser-pending surfaces.

`runtimeDiagnostics.test.js` covers Mongo URI precedence/redaction, dual-stack port detection, UI-only no-Mongo preflight behavior, safe Parcel temp cleanup, and liveness/readiness state. `schedulerLifecycle.test.js` verifies that scheduler startup is idempotent and all timers can be closed.

Story/content/security examples:

```bash
npx jest --runInBand server/tests/storyContent.test.js server/tests/storyLayouts.test.js server/tests/storyMedia.test.js server/tests/storyRenderingContract.test.js
npx jest --runInBand server/tests/articleAuthorityContract.test.js server/tests/premiumControllers.test.js server/tests/themeSafety.test.js server/tests/themeMigration.test.js server/tests/darkModeThemeContract.test.js
npx jest --runInBand server/tests/responsiveAccessibilityContract.test.js
npx jest --runInBand server/tests/launchHonesty.test.js server/tests/seoEvidence.test.js server/tests/routes.test.js
npx jest --runInBand server/tests/observabilityPrivacy.test.js server/tests/multiplayer/mongoAuthority.test.js
npx jest --runInBand server/tests/security.test.js server/tests/routes.test.js server/tests/premiumSecurity.test.js server/tests/creatorSecurity.test.js
```

`launchHonesty.test.js` proves that missing critical evidence blocks readiness and that launch history endpoints contain no automatic sample creation or embedded Admin credentials. `seoEvidence.test.js` verifies database-derived metrics and the published/public/non-deleted boundary for public metadata.

`observabilityPrivacy.test.js` verifies request correlation, template-only logs, hashed identifiers, generic internal errors, validation-value omission, and persistent audit redaction. `mongoAuthority.test.js` proves multiplayer fails closed rather than switching to ephemeral persistence.

`docs/STORY_PRESET_VERIFICATION.md` records the structural matrix for all 30 Story presets over the six shared engines. A structural pass (`PASS-S`) proves renderer/data contracts; the Browser-QA marker remains open until the corresponding viewport/theme/media interaction is exercised in a real browser.

`darkModeThemeContract.test.js` verifies surface-authoritative Home hero and Categories text, the fixed-Light Categories mega-menu, the common Article-card hierarchy across every category variant, Coding isolation, the standard Article-detail root and its 12 semantic roles, 18 requested content-surface areas, fixed-Light exceptions, shared forms/actions, chapter/summary/milestone/navigation/collection/insight foregrounds, Learn local Dark tokens, Story landing/reader selectors, representative contrast ratios, Light-Dark-Light scoping, and the absence of a global Dark text override. It is structural evidence, not a substitute for the manual viewport matrix.

## Full regression

```bash
npm test -- --runInBand
```

In-band execution is preferred for stabilization and local database work because it avoids overlapping database-backed suites and makes failure ordering deterministic.

Do not encode a permanent expected test count in scripts or docs. Report the exact suite/test count from each audit run.

## Syntax and production build

```bash
npm run check:server
npm run build
git diff --check
```

`npm run build` writes the Parcel production bundle to ignored `dist/`. If another process truly occupies the build target, stop it or use a verified Parcel output option and report that deviation.

## Runtime/API smoke expectations

With local MongoDB and `npm start` running, verify:

- `/api/health`, public Articles/Stories, Creator directory/profile, Learn catalogs/details, and multiplayer health;
- anonymous 401s for account/Life/Studio/Admin routes;
- Free/Premium content-body and lesson gates;
- signup, OTP, HttpOnly cookies, `/api/auth/me`, refresh rotation, logout, and password login;
- Free and Premium membership resolution;
- active Creator owner/Studio access and self-follow denial;
- Admin login and representative CMS reads;
- temporary smoke records are removed.

## Manual browser QA

API, source-contract, and SPA-shell tests cannot prove visual layout, click behavior, console cleanliness, focus management, or navigation state. A real browser pass should cover:

- anonymous home, Articles, Stories, Creator Directory, and Learn;
- signup/login/logout and refresh while authenticated;
- Free/Premium gates and subscription page;
- Life navigation, Quick Capture, search, and notifications;
- Creator profile/follow and Creator Studio;
- Admin CMS navigation and content/review pages;
- console exceptions, failed lazy imports, request loops, and error boundaries.

When browser automation is unavailable, report exactly:

> STRUCTURALLY VERIFIED — MANUAL BROWSER QA REQUIRED

That means automated build, API, integration, and source contracts passed, but no claim is made about rendered interactive behavior.
