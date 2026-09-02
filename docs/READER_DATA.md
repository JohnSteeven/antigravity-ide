# Reader data foundation

The authenticated Reader domain has three authorities:

```text
User -> account identity and basic profile
ReaderProfile -> Reader preferences, goals, library, aggregates, achievements, and settings
ReadingProgress -> one per-user/per-Article reading state
```

The client accesses Reader state through `ReaderContext` and `/api/reader/*`. `AuthContext` remains responsible for authentication, session state, account identity, and account-level settings.

## Field ownership matrix

| Field or concept | Classification | Authority and notes |
| --- | --- | --- |
| User id, first/last name, username | ACCOUNT / USER | `User`; allowlisted in the Reader profile account DTO. |
| Email, country code, mobile, verification, role, status, newsletter | ACCOUNT / USER | `User`; private account/session responses only. Email/mobile/security state is not exposed by the Reader profile DTO. |
| Avatar, cover image, bio, location, website, skills | ACCOUNT / USER | `User.profile`; every editable field is modeled, validated, persisted, and returned. |
| Notification delivery preferences and scheduler timestamps | ACCOUNT / USER | `User.notificationPreferences`; scheduler state is not duplicated into ReaderProfile. Clients may mutate only the four public preference groups, never sent/history timestamps. |
| Favorite categories/interests | READER PROFILE | `ReaderProfile.favoriteCategories`. |
| Preferred language and Light/Dark/System preference | READER PROFILE | `ReaderProfile.preferredLanguage` and `themePreference`. |
| Weekly Article and daily-minute goal targets | READER PROFILE | `ReaderProfile.readingGoal`; achieved counts are derived, not client-written. |
| Current/longest streak and last active date | READER PROFILE | Lightweight completion aggregates in `ReaderProfile`; updated only after an atomic first-completion transition. |
| Achievements | READER PROFILE | Only achievements issued by `achievementService` are returned. No sample achievement is presented as earned. |
| Saved, liked, and bookmarked Articles | READER PROFILE | Reader-owned Article library arrays. Writes verify a published `contentType=article` record. |
| User/article identity | READING PROGRESS | `ReadingProgress.userId + articleId`; partial unique Mongo index establishes one authenticated authority row. |
| Current/furthest progress and last position | READING PROGRESS | `progressPercent`, `furthestProgressPercent`, and `lastPosition`; monotonic writes use `$max`. |
| Active reading time | READING PROGRESS | `activeReadingSeconds`; meaningful periodic client deltas accumulate with `$inc`. Estimated reading duration and saved items never count as time read. |
| Completion, completion time, and source | READING PROGRESS | `isCompleted`, `completedAt`, and `completionSource=manual|auto`; completion is compare-and-set and cannot be lost. The retained pre-existing auto threshold is 80 percent. |
| Last read and timestamps | READING PROGRESS | `lastReadAt`, `createdAt`, and `updatedAt`; last read uses a server timestamp. |
| Articles read, weekly completions, total active time, goal percentage | DERIVED STATISTIC | Computed from Article-only ReadingProgress records for the authenticated user. |
| Continue Reading | DERIVED STATISTIC | Non-completed, published Article progress ordered by actual `lastReadAt`; includes actual furthest progress and `/articles/:slug` URL. |
| Completed list | DERIVED STATISTIC | Requires both `isCompleted=true` and authoritative `completedAt`. Saved/liked state never implies completion. |
| `User.profile.bookmarks/likedArticles/savedArticles/comments/darkMode` | DEPRECATED | Migration 011 moves library/theme data and removes the parallel profile fields. Comments remain in the Comment domain. |
| `ReaderProfile.notifications`, `totalReadingTimeMin`, mutable goal counters | DEPRECATED | Removed as duplicate or non-authoritative state. Reading summaries derive from progress. |
| `ReadingProgress.sessionId/articleSlug/scrollPositionPx/completionPercent/timeSpentSeconds/deviceType` | DEPRECATED | Migration 011 normalizes authenticated rows to the current field contract. Anonymous legacy rows are retained but are not Reader API authority. |
| Index-derived progress, estimated saved reading time, sample badges/replies/drafts/collections/activity | FAKE / PLACEHOLDER | Removed from the active Profile experience. Honest zero/error/empty states are rendered instead. |

## API contract

All endpoints below require authentication and derive ownership exclusively from `req.user`:

- `GET /api/reader/profile` returns `{ account, reader, library, contracts }` using allowlisted DTOs.
- `PATCH /api/reader/profile` accepts only interests, Reader preference, and goal-target fields.
- `POST /api/reader/progress` accepts a meaningful periodic Article update; client user/session identity is ignored.
- `GET /api/reader/progress/:articleId` returns only the requesting user's record.
- `GET /api/reader/continue-reading` returns persisted, incomplete Article progress.
- `GET /api/reader/completed` returns persisted completion records with `completedAt`.
- `POST /api/articles/:id/like`, `/bookmark`, and `/save` derive the owner from the authenticated request, atomically toggle the corresponding ReaderProfile array, and return `{ articleId, metric, isActive, count, libraryItem }` (plus the metric-named count for compatibility). The client uses `count` and `isActive`; it does not infer either value.

Story records are rejected on progress/library writes and filtered from profile history. Deleted, draft, archived, and scheduled content is not returned through the Reader history DTOs.

Bookmark and Save currently persist to separate `ReaderProfile.bookmarks` and `ReaderProfile.savedArticles` arrays and render as separate Profile library views. They otherwise have the same server behavior; Save does not currently provide an offline download/cache guarantee. The distinction is retained for compatibility pending a later product decision.

Successful Article interactions update global `ReaderContext` directly from the authoritative response library item, so Article controls and Profile counts/lists change together without an AuthContext refresh or page reload. New/current ReaderProfile writes work before migration 011; pre-existing values that exist only in deprecated `User.profile` arrays remain unavailable until that explicit migration is reviewed and run.

## Migration 011

`011-reader-data-foundation` is explicit and is not run by server startup. It:

1. moves User profile library relations into ReaderProfile and removes parallel/fake activity fields;
2. normalizes legacy authenticated progress fields;
3. merges duplicate user/article rows using maximum progress/position, summed active time, preserved completion, and real stored timestamps;
4. creates `uniq_reader_progress_user_article` only after deduplication.

Legacy completion rows without a stored `completedAt` remain absent from Completed rather than receiving an invented completion time. Applying the migration requires the normal reviewed environment-specific process in `DATA_AND_MIGRATIONS.md`.
