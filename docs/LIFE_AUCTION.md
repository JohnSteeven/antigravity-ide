# Life Auction

## Release scope

Life Auction is the second registered game on the existing Play With Friends platform. It uses the existing room code, signed guest identity, Socket.IO namespace, Redis adapter, presence ownership, MongoDB compare-and-swap repository, timer coordinator, reconnect flow, moderation, rate limits, analytics, metrics, room expiry, and React game shell. It does not create a second room or transport system.

Launch mechanics:

- open ascending auctions;
- private sealed bids with reveal;
- multi-buyer fixed-price decisions;
- server-owned wallets and deadlines;
- anti-sniping extensions;
- deterministic earliest-valid sealed tie policy with a seeded hash fallback for identical server timestamps;
- seven data-driven modes and Quick, Standard, and Full Life lengths;
- seeded director, mystery lots, Life Events, voluntary group goals, reactions, portfolios, awards, rematch, sharing, and party game switching.

Dutch bidding, team wallets, trading, custom packs, spectators, and user-authored lots are extension seams, not enabled launch features.

## Platform reuse and party sessions

The active room document is the party session. `partySessionId` is stable while the party changes games; `gameInstanceId` changes on rematch or game switch. `roomCode`, players, guest tokens, optional account IDs, roles, presence, socket membership, and host stay in the same room.

`party:switch-game` is a generic host command accepted only from `FINISHED`. It creates the target game state through the registered adapter and transitions the existing room back through `LOBBY`. The target adapter may immediately move it to `READY` when no private setup is required. No prior answers, wallets, bids, scores, lots, events, or reserved balance cross into the new instance.

Final records are unique by `gameInstanceId`, so one party can produce multiple append-only game records. Migration `002-multiplayer-party-game-instances` backfills identifiers, replaces the old one-record-per-room index, and adds party history indexes.

## Versions and content snapshots

Every session snapshots version metadata under the authoritative game state:

| Version | Launch value | Purpose |
| --- | ---: | --- |
| Game | 1 | command and state contract |
| Content | 1 | lot catalog semantics |
| Economy | 1 | wallet and mutation rules |
| Strategy | 1 | bidding and settlement rules |
| Director | 1 | selection and pacing rules |
| Events | 1 | Life Event effects |
| Portfolio | 1 | summary calculation |

The director copies selected lot content and auction configuration into the active game plan. Later catalog price, wording, eligibility, or strategy changes cannot mutate a game in progress.

English lots live in `server/multiplayer/games/lifeAuction/content/lots.en.js`. Each item has a stable ID and version, locale, category, presentation metadata, base price, mode compatibility, rarity, tone, depth, tags, age suitability, event compatibility, portfolio traits, conflict rules, weight, mystery/finale flags, and active status. User-facing game copy is separated into English server content and the client locale module.

Launch sessions deliberately use the reviewed source catalog. The admin/live-content foundation consists of `LifeAuctionContentPack`, `contentPackService.js`, and migration `003-life-auction-content-packs`. It stores immutable locale/version pack records, moderation and publication status, review ownership, checksums, and indexed published-pack lookup. Validation rejects executable/operator keys and refuses unapproved publication. It is not wired into live selection yet, so an admin draft cannot silently change an active or launch game; a future reviewed rollout can snapshot an approved pack through the same director boundary.

## Game director

`director.js` builds a deterministic plan from `roomCode`, `gameInstanceId`, mode, and length. It:

1. filters active compatible content;
2. ranks content using SHA-256-derived seeded values;
3. penalizes adjacent and repeated categories;
4. prefers suitable light openings and mode categories;
5. selects a distinct eligible finale;
6. creates an auction-type mix with at least one open, sealed, and fixed-price lot where the length permits;
7. snapshots strategy configuration;
8. places events at pacing intervals, with extra events in Chaos Mode.

The result is reproducible for support and debugging but is not a single predetermined script. Rematches receive a new `gameInstanceId` and therefore fresh plans.

## Modes and length

Modes are data in `modes.js`, not component branches:

- Classic Life;
- Friends Night;
- Deep Life;
- Money & Success;
- Dream Life;
- Chaos Mode;
- Random Mix.

The launch length presets are Quick (8 lots), Standard (15), and Full Life (20). Starting wallets are selectable from 50, 100, and 200 at launch; 100 is the default. The economy model itself is not tied to those three setup options.

## Economy rules

Life Coins are fictional integer game units. They cannot be purchased, redeemed, cashed out, used outside the room, or converted into currency or cryptocurrency.

Each wallet tracks:

- starting balance;
- current unspent balance;
- reserved balance;
- spent and refunded totals;
- bonuses and penalties;
- incoming and outgoing transfers;
- lot wins.

`available = balance - reserved`. Values must be safe integers between zero and the configured cap. Debt is disabled. All mutations append a bounded, sequenced authoritative audit entry. The audit is never in a client projection or general analytics.

Open bidding reserves the current high bid. When another player wins the compare-and-swap write, the previous reservation is released and the new reservation is installed in the same room mutation. At close, the winner is charged once and every residual reservation is released.

Sealed bidding also reserves the submitted amount until reveal. Before reveal, role-filtered projections include only submitted player IDs and the viewer's submitted/not-submitted state. The viewer's numeric reserved and available values are hidden during that phase so refresh restoration does not echo the secret value. At reveal, the winner is charged and every other reservation is released.

Fixed-price purchases charge available balance immediately and enforce one purchase per player plus the lot's configured purchase limit. Discount effects reduce the charge, never the ordering bid, and leave at least a one-coin charge.

## Strategy contract

Every snapshotted lot carries:

- type;
- starting and reserve prices;
- minimum increment;
- visibility;
- absolute bid duration;
- extension policy;
- tie policy;
- winner count and purchase limit;
- eligibility, currency, and result strategy identifiers.

`strategies.js` owns the strategy identifiers, auction-state construction, open minimum calculation, and sealed ordering. The Life Auction adapter owns economy settlement and portfolio ownership so those mutations remain in one transaction.

### Open ascending

The server rejects bids below the current minimum, beyond the wallet, outside the active room/instance/round, or at/after the absolute deadline. A valid final-window bid extends the stored deadline by three seconds, at most twice in ordinary modes and three times in Chaos. Clients render the stored timestamp; there are no correctness tick messages.

### Sealed bid

One bid per player is accepted. Values remain only in authoritative game state until close. Default ordering is amount descending, server submission time ascending, then an auditable seed/player/lot hash only if both are identical. Missing players simply have no bid when the deadline closes.

### Fixed price

The server ignores client claims about price and accepts only the exact authoritative price. A player cannot buy twice. The configured purchase limit can be one, several, or the room player count.

## Concurrency and idempotency

All commands pass through `RoomService._mutate`. It loads the authoritative room, checks the bounded request UUID log, applies validation, and saves with `{ _id, version: expectedVersion }`. MongoDB increments the version only for the winner. A losing node reloads and reapplies validation up to the bounded retry limit.

Consequences:

- identical concurrent bids produce one accepted bid;
- a later higher bid sees and releases the committed reservation;
- a stale timer close loses to an accepted extension;
- two close triggers produce one saved result and one charge;
- duplicated socket retries return the saved room without repeating the mutation;
- an event response and deadline resolution cannot both commit against the same version.

The request log holds 250 entries to cover bid-heavy retries without unbounded room growth. Per-socket limits, 16 KB transport payload limits, command schemas, game-level per-auction bid throttling, bounded bid/audit/reaction histories, and the 12-player manifest limit protect hot rooms.

## Timers and lifecycle

Life Auction reuses `gameData.roundDeadline` and `gameData.nextRoundAt` so the existing timer coordinator and deadline indexes work across nodes.

```text
READY
  -> IN_PROGRESS / BIDDING
  -> ROUND_REVEAL / AUCTION_REVEAL
  -> BETWEEN_ROUNDS -> IN_PROGRESS
  -> optional LIFE_EVENT -> ROUND_REVEAL / EVENT_REVEAL
  -> ...
  -> FINISHED
```

Every deadline is an absolute server timestamp. Bids at the exact deadline are rejected. All nodes may discover the same due room; compare-and-swap ensures one transition. A restart can rediscover deadlines from MongoDB. Redis carries fanout and presence, not wallet correctness.

## Life Event engine and fairness

Launch event kinds include global bonus, capped expense, present-versus-future opportunity, voluntary friend gift, voluntary group goal, market shift, time pressure, and reflection. Events and choices are server-selected, validated, and resolved inside the room transaction.

Fairness rules are explicit:

- negative effects can consume available coins only, never reserved bids;
- balances cannot go negative;
- negative counts are recorded and negative events are excluded after the configured cap;
- no hidden close-game balancing or rigging exists;
- gifts and contributions are optional;
- failed group goals charge nobody;
- other players' event choices and targets remain server-private before resolution;
- event history prevents immediate repetition.

Group-goal contributions are evaluated together at resolution. When the threshold succeeds, contributors are charged atomically and receive one shared portfolio memory; otherwise all proposed contributions disappear without charge.

## Portfolio model

The result does not declare a universal life winner. Owned lots produce a `Life Portfolio`, remaining balance, spend total, and a value map across broad themes. Wording describes only observable play, for example, “Tonight your choices leaned toward…”. It does not diagnose personality or claim psychometric validity.

Group awards are neutral and session-scoped: Biggest Saver, Portfolio Builder, Boldest Bidder, and Biggest Single Bid. Sharing is explicit and contains only the broad value-map percentages and fictional-coin context, not detailed choices by default.

## Realtime protocol

Life Auction uses the existing versioned `game:command` envelope:

| Command | Purpose |
| --- | --- |
| `setup:update` | host validates mode, length, and starting wallet |
| `session:start` | host creates wallets and seeded plan |
| `auction:bid` | authoritative open, sealed, or fixed-price action |
| `life_event:choose` | validated private event decision |
| `reaction:send` | bounded non-authoritative emoji reaction |

Generic `room:update` remains the server event. The serializer builds a separate projection for each socket. Public open bids fan out; sealed values, private event choices, economy audit, future lots, seeded plan, internal effects, and rate-limit timestamps never do.

`party:switch-game` and `game:rematch` remain generic top-level party commands. Socket acknowledgements preserve the established `{ ok, duplicate, room }` contract.

## Reconnect and presence

Guest identity remains a signed room/player token in tab-scoped session storage. Reconnect receives the current lot, public high bid, absolute deadline, personal wallet, owned count, phase, and portfolio. A submitted sealed bid survives but is represented only as submitted with hidden reservation values until reveal. Request UUIDs prevent a retried bid from duplicating.

The newest connection for a player remains authoritative through the Redis-backed presence claim. Finished rooms continue tracking presence so a party can decide the next game. Late joining remains disabled after meaningful play begins.

## Security and privacy

The server validates room membership, player identity, host role where required, lifecycle, phase, lot, amount, integer bounds, wallet, reservation, deadline, increment, duplicate request, duplicate sealed bid, duplicate purchase, event eligibility, target player, reaction allowlist, and payload size.

Clients never submit or mutate balances, deadlines, winners, ownership, discounts, portfolio results, or event effects. Analytics metadata excludes bid values, answers, free text, guest tokens, and private event choices. Life Auction does not read Play Life mood history, journals, trackers, memories, financial data, relationship data, or other private MyJourney content.

## Analytics and observability

Privacy-minimized events include `mode_selected`, `life_auction_started`, `bid_submitted`, `auction_closed`, `life_event_choice`, `life_event_completed`, `game_finished`, `rematch_created`, and `party_switched_game`, in addition to generic room and player lifecycle events. Safe metadata includes mode, length, room player count, round number, auction type, bid count, and completion.

The existing metrics surface now labels command success, errors, and latency down to `game:command:auction:bid` without including amounts. It also records room version conflicts, room/player/game counters, active connections, game event counters, rejection codes, and p50/p95/p99 handler latency. Logs remain structured and omit secret values.

Analytics, sound, haptics, and decorative presentation are non-critical. Their failure does not block a bid. MongoDB authority failures fail closed. Redis failure degrades cross-node fanout/readiness but cannot create a second wallet winner because MongoDB compare-and-swap remains authoritative.

## Frontend and accessibility

Life Auction is a lazy-loaded game renderer with its own CSS chunk. It includes game selection on `/play-with-friends`, host setup, interactive teaching, responsive auction stage, thumb-reachable bid controls, wallet and party rail, mystery presentation, sealed submission state, event choices, reveals, reactions, portfolio gallery, value map, awards, share, rematch, and party switch controls.

Accessibility support includes semantic headings and forms, labelled numeric inputs, minimum touch sizes, keyboard-operable controls, summarized polite live announcements, non-color presence text, explicit timer labels, a rules dialog with Escape handling, sound-independent results, forced-color borders, high-contrast text, and `prefers-reduced-motion` overrides. The layout changes from a desktop stage plus rail to a mobile stage with sticky controls and bottom wallet; it does not simply stretch one layout.

## Feature flags

| Variable | Effect |
| --- | --- |
| `PARCEL_MULTIPLAYER_ENABLED` | entire client platform entry |
| `MULTIPLAYER_ENABLED` | realtime backend runtime |
| `PARCEL_LIFE_AUCTION_ENABLED` | Life Auction client card/renderer |
| `LIFE_AUCTION_ENABLED` | server registration |
| `LIFE_AUCTION_SEALED_ENABLED` | sealed lots fall back to open |
| `LIFE_AUCTION_EVENTS_ENABLED` | event schedule disabled when false |
| `LIFE_AUCTION_GROUP_EVENTS_ENABLED` | reserved for group-event rollout policy |

Trading remains explicitly disabled in room settings. Life Coins have no monetization integration.

## Tests

Run:

```powershell
npm run test:multiplayer
npm test -- --runInBand
npm run check:server
npm run build
node server\scripts\lifeAuctionLoad.js --rooms=2 --players=4 --lots=8
node server\scripts\lifeAuctionLoad.js --rooms=10 --players=6 --lots=8
```

Automated Life Auction coverage includes deterministic direction, all launch modes, economy invariants, group contribution atomicity, outbid release, winner charge exactly once, simultaneous identical bids, exact deadlines, anti-sniping, sealed privacy across viewers and reconnect, sealed duplicate submission, tie policy, multi-buyer fixed price, full Quick completion, event transitions, persistence, refresh recovery, game switching, rematch cleanup, real Socket.IO fanout, and reconnect.

### Measured local regression baselines (2026-08-09)

These are isolated, single-process, in-memory repository measurements using real Socket.IO clients. They are regression baselines, not production capacity claims.

| Rooms | Clients | Completed | Ack events | Accepted bids | Extensions | Reconnects | Errors | p50 | p95 | p99 | Accepted bids/s |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2 | 8 | 2 | 88 | 58 | 9 | 2 | 0 | 18 ms | 25 ms | 33 ms | 146.84 |
| 10 | 60 | 10 | 636 | 443 | 52 | 10 | 0 | 135 ms | 189 ms | 206 ms | 170.45 |

The 60-client run used 2,719 ms user CPU, 250 ms system CPU, a 32.64 MB heap increase, and 72.65 MB final heap. MongoDB and Redis utilization were not measured because the harness intentionally used the in-memory repository. Before public rollout, repeat against staging MongoDB/Redis with multiple nodes, TLS, the production load balancer, reconnect waves, and a soak at the configured room TTL.

## Adding content

### Lot

1. Add a stable, never-reused ID in `content/lots.en.js`.
2. Increment the item version for a semantic change and the catalog version for a release.
3. Supply category, price, mode compatibility, depth/tone/safety metadata, portfolio traits, weight, and active status.
4. Mark mystery/finale content deliberately and review reflective wording for safety.
5. Run director diversity, privacy, full-session, and build tests.

### Mode

1. Add one data object in `modes.js` with preferences, auction mix, event intensity, anti-sniping, tie policy, and economy configuration.
2. Add its compatibility to eligible content or define a safe pool rule.
3. Add client locale copy only if the generic setup card fields are insufficient.
4. Run all three lengths to ensure the pool has enough unique, diverse lots.

### Life Event

1. Add a versioned definition to `events.js` with modes, scope/kind, copy, choice schema, and negative classification.
2. Add a deterministic resolution branch using only economy helpers.
3. Define missing-choice behavior, fairness cap, projection privacy, and audit metadata.
4. Add success, insufficient-wallet, duplicate, deadline, and event/auction collision tests.

## Extending auction types

### Dutch auction

`DUTCH` already exists as a reserved strategy identifier. Add a strategy definition that snapshots high price, floor, decrement interval, and first-accept result policy. Derive the displayed current price from the absolute server start time rather than ticking the database. Add one `auction:accept` command that calculates the authoritative price at server receive time and saves through the same compare-and-swap mutation. The first saved acceptance wins; competing nodes reload into a closed auction. Reuse wallet settlement, ownership, reveal, timer, serializer, analytics, and tests. Add only the Dutch control/reveal presentation to the lazy client. No room, identity, transport, presence, storage, or timer system changes are required.

### Team Life Auction

Introduce a validated `accountResolver` that maps a player to an individual or team wallet ID, and snapshot team membership before start. Economy helpers already operate on keyed wallet accounts and strategy settlement depends on an account balance, not real money. Store team ownership/portfolio alongside the existing individual mapping, project one shared wallet to members, and require team-safe eligibility. Compare-and-swap, reservations, deadlines, events, party identity, reconnect, and auction strategies remain unchanged. Team creation and host controls are new setup/presentation work; the engine does not need a second auction implementation.

### Trading

When enabled, add a generic proposed transaction containing source/target account, offered assets, requested assets, expiry, and both acceptance versions. Resolve both acceptances in one room compare-and-swap mutation after checking ownership, transferability, wallet availability, and replay ID. Append an audit entry and expose only the appropriate proposal fields. Do not add peer-to-peer currency outside the active game.

## Deployment and external validation

Apply migrations 001–003 before enabling the backend flag. Keep the client flag off until the server manifest, indexes, Redis readiness, and monitoring are healthy. The local implementation does not deploy automatically.

Production-only validation still required:

- apply and verify migration/index names on staging MongoDB;
- run multiple backend instances with required Redis and confirm cross-node fanout/presence replacement;
- run browser-context E2E and accessibility tooling in an environment with a browser surface;
- verify mobile Safari/Chrome haptics, audio gesture restrictions, and Web Share behavior on devices;
- run staging load/soak tests and measure MongoDB, Redis, CPU, memory, event-loop lag, and load-balancer behavior;
- validate provider-managed encryption, alert routes, and production feature-flag rollout.
