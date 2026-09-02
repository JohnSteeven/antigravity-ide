# Core interaction reliability inventory

Audit date: 2026-08-30. This inventory distinguishes server/service evidence, client source-contract evidence, and actual browser evidence. A Jest source contract is never treated as browser verification. The initial Playwright smoke covers one deterministic Chromium journey against an isolated Mongo database; rows marked browser-pending still need a real browser journey before their user experience is release-gated.

Allowed classifications:

- `VERIFIED BY SERVER TEST`
- `VERIFIED BY CLIENT CONTRACT TEST`
- `REQUIRES REAL BROWSER QA`
- `KNOWN BROKEN`
- `NOT IMPLEMENTED`
- `DEFERRED EXTERNAL PROVIDER`

| Area | Interaction | Classification | Evidence and remaining work |
| --- | --- | --- | --- |
| Auth | Register | VERIFIED BY SERVER TEST | Registration/OTP service and client-request contracts exist; full form submission remains browser-pending. |
| Auth | OTP verify/resend | VERIFIED BY SERVER TEST | `authOtp.test.js` covers delivery boundaries, cooldown, atomic consumption, and replay; real email/SMS is provider-dependent. |
| Auth | Login | VERIFIED BY CLIENT CONTRACT TEST | Playwright performs a real cookie/CSRF login in Chromium for two isolated Reader accounts. |
| Auth | Logout | VERIFIED BY CLIENT CONTRACT TEST | Playwright verifies the POST, redirect, anonymous header, and subsequent account switch. |
| Auth | Forgot password | VERIFIED BY SERVER TEST | Enumeration-resistant recovery behavior is covered; email delivery and browser form remain pending. |
| Auth | Reset password | VERIFIED BY SERVER TEST | Token/session security is covered; browser link/form handling remains pending. |
| Header | Primary navigation | VERIFIED BY CLIENT CONTRACT TEST | Playwright uses the main Articles link and asserts navigation. |
| Header | Categories menu | VERIFIED BY CLIENT CONTRACT TEST | Playwright opens/closes the desktop mega-menu with accessible state checks. |
| Header | Account dropdown | VERIFIED BY CLIENT CONTRACT TEST | Playwright opens the authenticated account menu and signs out. |
| Header | Mobile drawer | VERIFIED BY CLIENT CONTRACT TEST | Playwright opens Categories and closes the 390x844 drawer. |
| Articles | Search | VERIFIED BY CLIENT CONTRACT TEST | Bounded server-query wiring is contract-tested; typing/results/empty-state need browser QA. |
| Articles | Category/tag filters | VERIFIED BY CLIENT CONTRACT TEST | Query construction and server publication boundaries are tested; live controls need browser QA. |
| Articles | Sort | VERIFIED BY CLIENT CONTRACT TEST | Server-backed sort wiring is contract-tested; selector behavior needs browser QA. |
| Articles | Open published Article | VERIFIED BY CLIENT CONTRACT TEST | Playwright opens the deterministic published fixture from `/articles`. |
| Articles | Like / Unlike | VERIFIED BY CLIENT CONTRACT TEST | Playwright verifies 200 response, red active state, authoritative count, reload persistence, unlike, and inactive reload. |
| Articles | Bookmark | VERIFIED BY CLIENT CONTRACT TEST | Playwright verifies gold active state, reload persistence, and Profile Bookmarks. |
| Articles | Save | VERIFIED BY CLIENT CONTRACT TEST | Playwright verifies `Saved ✓`, teal active state, reload persistence, and Profile Saved. This is a library marker, not offline download. |
| Articles | Share | VERIFIED BY CLIENT CONTRACT TEST | Playwright disables native share, captures the canonical clipboard URL, and asserts adjacent `Link copied.` feedback. Native device share remains browser/device-specific. |
| Articles | Comments | REQUIRES REAL BROWSER QA | Comment routes/UI exist, but this audit did not create/edit/delete a comment in Chromium. |
| Articles | Reading progress | VERIFIED BY CLIENT CONTRACT TEST | Playwright scrolls the real page, observes the progress POST, and finds the completed Article in Profile Reading. |
| Profile | Edit profile | VERIFIED BY SERVER TEST | Allowlisted account/profile writes are covered; form validation and success/error UX need browser QA. |
| Profile | Saved / Bookmarks / Likes | VERIFIED BY CLIENT CONTRACT TEST | Playwright verifies Saved and Bookmarks contain the fixture and Likes is empty after Unlike. |
| Profile | Reading | VERIFIED BY CLIENT CONTRACT TEST | Playwright verifies the persisted fixture under Completed after reaching the page end. |
| Profile | Settings | VERIFIED BY CLIENT CONTRACT TEST | Source contracts cover real preference fields and no fabricated data; interactive toggles remain browser-pending. |
| Stories | Open Story | VERIFIED BY CLIENT CONTRACT TEST | Public route/structured-or-legacy renderer selection is contract-tested; a real Story was not opened in this smoke. |
| Stories | Chapter/navigation controls | VERIFIED BY CLIENT CONTRACT TEST | Renderer/preset contracts exist; viewport, scroll, keyboard, and media behavior require browser QA. |
| Stories | Share | REQUIRES REAL BROWSER QA | Clipboard-only action exists, but success/failure feedback and browser permissions were not exercised. |
| Stories | Save story | KNOWN BROKEN | Visible controls only toggle `StoryDetail` component state; there is no API/database write and reload loses the state. |
| Stories | Comments | NOT IMPLEMENTED | No Story comment action or Story comment persistence flow is present. |
| Learn | Topic navigation/filtering | VERIFIED BY SERVER TEST | Canonical slug/ObjectId resolution and published Course filtering are covered; responsive navigation needs browser QA. |
| Learn | Open Course | VERIFIED BY CLIENT CONTRACT TEST | Routes and public/CMS client contracts exist; live catalog-to-detail navigation remains browser-pending. |
| Learn | Open Lesson and entitlement gate | VERIFIED BY SERVER TEST | Protected serialization and entitlement boundaries are covered; UI gate/preview navigation needs browser QA. |
| Learn | Enrollment/progress actions | VERIFIED BY SERVER TEST | Learner ownership/progress domain is implemented; the user journey remains browser-pending. |
| Learn | Protected media delivery | DEFERRED EXTERNAL PROVIDER | Catalog metadata exists; upload/streaming/signed delivery/scanning are unavailable without a provider. |
| Creators | Directory | VERIFIED BY CLIENT CONTRACT TEST | Public active-profile and responsive directory contracts exist; search/cards require browser QA. |
| Creators | Profile | VERIFIED BY CLIENT CONTRACT TEST | Route and viewer-specific follow hydration contracts exist; live profile navigation remains browser-pending. |
| Creators | Follow / Unfollow | VERIFIED BY SERVER TEST | Persistence, idempotency, viewer isolation, self-follow denial, and nonnegative counts are tested. |
| Creators | Creator Studio navigation/actions | VERIFIED BY CLIENT CONTRACT TEST | Route and authorization separation are covered; create/edit/course/media workflows require browser QA. |
| Creators | Earnings / payouts | DEFERRED EXTERNAL PROVIDER | Foundation and inactive UI state exist; no real earnings or payout provider is implemented. |
| Life | Create habit/task/routine/goal/health/money/journal | VERIFIED BY SERVER TEST | Private route/payload/status contracts are covered; UI creation flows require browser QA. |
| Life | Update habit/task/routine/goal/plan | VERIFIED BY SERVER TEST | Server update routes and ownership rules are covered; UI editing needs browser QA. |
| Life | Complete habit/medication/routine occurrence | VERIFIED BY SERVER TEST | Event idempotency and Today status behavior are covered; real click/undo/time-zone UX needs browser QA. |
| Life | AI/push/device integrations | DEFERRED EXTERNAL PROVIDER | Capabilities remain explicitly unavailable until their providers/configuration exist. |
| Agent | Send typed message | VERIFIED BY SERVER TEST | Orchestration, idempotency, tool permissions, and client composer wiring are tested; full panel journey needs browser QA. |
| Agent | Restore/select conversation | VERIFIED BY SERVER TEST | Ownership and bounded history behavior are covered; reload/selection UX needs browser QA. |
| Agent | Confirmation token flow | VERIFIED BY SERVER TEST | Hash-only issue, binding, expiry, atomic consumption, and replay rejection are covered; confirmation UI needs browser QA. |
| Premium | Public gate | VERIFIED BY CLIENT CONTRACT TEST | Shared Article/Story boundary and duration UI contracts exist; real Free-page journey needs browser QA. |
| Premium | Authorized / unauthorized access | VERIFIED BY SERVER TEST | Account entitlement, expiry, failure, and protected-body/lesson boundaries are tested. |
| Premium | Checkout / portal / webhook sync | DEFERRED EXTERNAL PROVIDER | The provider boundary fails honestly; no checkout success is manufactured. |
| CMS | Admin authorization | VERIFIED BY SERVER TEST | CMS management routes require exact Admin authorization; Creator access remains separate. |
| CMS | Create/edit Article or Story | REQUIRES REAL BROWSER QA | Models/routes/client controls exist, but this audit did not exercise an Admin authoring journey. |
| CMS | Preview Article or Story | VERIFIED BY CLIENT CONTRACT TEST | Preview reuses public renderers by source contract; visual/editor state needs browser QA. |
| CMS | Publish workflow | REQUIRES REAL BROWSER QA | Server workflow boundaries exist, but draft-to-published controls were not clicked in a browser. |

## Current gate blockers

- Story Save presents a persistent-sounding action without persistence.
- Critical browser journeys outside the initial Auth/Header/Article/Profile smoke remain open, especially Comments, Story, Learn, Creator Studio, Life, Premium, Agent, and CMS authoring.
- Native Share, OTP delivery, speech/microphone, protected media, checkout, notifications, and other device/provider paths require their own configured environment and cannot be inferred from source tests.

