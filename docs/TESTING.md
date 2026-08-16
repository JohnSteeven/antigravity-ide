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
npx jest --runInBand server/tests/authOtp.test.js server/tests/authClientContract.test.js server/tests/dbStartup.test.js server/tests/auditLogger.test.js
```

Story/content/security examples:

```bash
npx jest --runInBand server/tests/storyContent.test.js server/tests/storyLayouts.test.js server/tests/storyMedia.test.js server/tests/storyRenderingContract.test.js
npx jest --runInBand server/tests/security.test.js server/tests/routes.test.js server/tests/premiumSecurity.test.js server/tests/creatorSecurity.test.js
```

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
