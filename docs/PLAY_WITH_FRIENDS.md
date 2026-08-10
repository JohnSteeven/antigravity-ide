# Play With Friends Platform

## Scope and release status

Play With Friends is an internal MyJourney feature reached through `About Me -> Games -> Play With Friends`. It is not in the main navigation. The client route family is:

- `/play-with-friends`
- `/play-with-friends/join/:code`
- `/play-with-friends/room/:code`

Registered games are `who-knows-me-better` and `life-auction`. Deployment is intentionally not part of this change. Life Auction architecture and operational details are documented in `docs/LIFE_AUCTION.md`.

Release controls:

- `PARCEL_MULTIPLAYER_ENABLED=false` removes the About Me card and redirects game routes.
- `MULTIPLAYER_ENABLED=false` prevents the realtime runtime from starting.
- Keep both enabled only after MongoDB indexes, Redis, routing, and monitoring are ready.

## Architecture

The feature is a modular monolith inside the existing React, Express, and MongoDB application.

```text
React game shell
  -> REST create/join/resume/QR
  -> Socket.IO command protocol
       -> guest identity and payload validation
       -> room service and lifecycle rules
       -> game registry / registered game engine
       -> compare-and-swap MongoDB room repository
       -> role-aware serializer
       -> Socket.IO Redis adapter fanout
  -> append-only game records and analytics
```

Ownership boundaries:

- `server/multiplayer/domain`: lifecycle, protocol schemas, errors, moderation, serialization.
- `server/multiplayer/games`: game registry and game-specific question/scoring logic.
- `server/multiplayer/persistence`: storage interface implementations. Production uses MongoDB; the memory implementation exists only for isolated tests and load tooling.
- `server/multiplayer/services`: authoritative room orchestration and analytics.
- `server/multiplayer/realtime`: sockets, presence ownership, fanout, deadlines, reconnect behavior.
- `src/features/play-with-friends`: client session, API/socket adapters, game registry, UI, and locale bundle.

Adding another game does not require a second room transport. Register a server engine and client renderer under a new game key. A stable `partySessionId` and per-play `gameInstanceId` let finished parties switch games without changing room, identity, presence, or sockets.

## Authoritative lifecycle

The server owns every transition and persists a bounded lifecycle history:

| State | Purpose | Valid next states |
| --- | --- | --- |
| `CREATED` | Auditable creation marker | `LOBBY`, `CANCELLED` |
| `LOBBY` | Players may join | `HOST_SETUP`, `READY`, `CANCELLED`, `EXPIRED` |
| `HOST_SETUP` | Host answers are incomplete/private | `READY`, `LOBBY`, `CANCELLED`, `EXPIRED` |
| `READY` | Setup complete and minimum players present | `HOST_SETUP`, `IN_PROGRESS`, `CANCELLED`, `EXPIRED` |
| `IN_PROGRESS` | Current question accepts answers | `ROUND_REVEAL`, `CANCELLED`, `EXPIRED` |
| `ROUND_REVEAL` | Correct answer and points are public | `BETWEEN_ROUNDS`, `FINISHED`, `CANCELLED`, `EXPIRED` |
| `BETWEEN_ROUNDS` | Server deadline gates the next round | `IN_PROGRESS`, `CANCELLED`, `EXPIRED` |
| `FINISHED` | Final standings/rematch | `LOBBY`, `EXPIRED` |
| `EXPIRED` | Terminal cleanup state | none |
| `CANCELLED` | Terminal failure/moderation state | none |

Every write compares the expected room version. A conflict reloads and retries a bounded number of times. Request UUIDs are retained in a 50-entry bounded log, making retries idempotent without unbounded room growth.

Timers are absolute MongoDB timestamps. Every node may scan overdue work, while versioned compare-and-swap ensures only one node can reveal or advance a round.

## Who Knows Me Better rules

- One host chooses private answers before play.
- A room supports 2 to 12 total participants, including the host.
- The host observes rounds and does not guess.
- Players receive only the active question.
- Correct answers earn 500 to 1,000 points based on server-observed response time.
- Rank values preserve ties.
- A rematch keeps the party but selects a new deterministic question set and clears all answers, guesses, and scores.

The English bank contains 60 versioned prompts across 12 categories. It remains server-only; no endpoint or socket payload sends the bulk bank to clients.

## REST protocol

Base path: `/api/multiplayer`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/games` | Public game manifests and categories |
| `POST` | `/rooms` | Create room and host guest session |
| `POST` | `/rooms/:code/join` | Join room and issue player session |
| `POST` | `/rooms/:code/resume` | Validate a session after refresh |
| `GET` | `/rooms/:code/invite-qr` | Generate an internal deep-link QR image |
| `GET` | `/health` | Realtime/distributed-fanout readiness |
| `GET` | `/metrics` | Admin-only multiplayer metrics hook |

REST failures include `error.code`, `error.message`, and `error.retryable`. Stable codes are defined in `server/multiplayer/domain/constants.js`.

## Socket protocol

Namespace: `/multiplayer`. The signed guest token is sent in `handshake.auth.token`.

Client commands require a UUID `requestId`:

| Event | Actor | Effect |
| --- | --- | --- |
| `room:sync` | Any player | Fetch role-filtered current state |
| `host:prepare` | Host | Select settings and private setup questions |
| `host:setup` | Host | Validate and lock private answers |
| `game:start` | Host | Start round one |
| `round:answer` | Player | Lock one answer; score only on server |
| `round:advance` | Host | Finish or enter the between-round deadline |
| `game:rematch` | Host | Reset party into a new lobby |
| `host:transfer` | Host | Transfer control outside active play |
| `player:remove` | Host | Remove a player before play |
| `game:command` | Game-defined | Execute a bounded command implemented by the registered game adapter |

Server events:

- `room:update`: complete role-filtered room projection.
- `game:error`: stable command failure.
- `session:replaced`: the same player continued on a newer connection.
- `session:removed`: the player no longer belongs to the room.

Commands are acknowledged with `{ ok, duplicate, room }` or `{ ok: false, error }`. Payloads are strict Zod schemas and reject unknown fields.

## Identity and reconnects

Guest identity is a signed JWT containing room ID, room code, player ID, expiry, audience, issuer, and nonce. It is separate from a socket connection and separate from an optional MyJourney account ID.

The browser keeps the token in tab-scoped `sessionStorage`; it does not store room or scoring state. Refresh resumes the same player. A copied invite creates a new player. When the same token connects again, Redis presence ownership makes the newest connection authoritative and disconnects the older one, including across nodes.

The token is bearer material. Do not log it, put it in a URL, or store it in analytics.

## Privacy and trust boundaries

- Host answers are stored only in the authoritative room document.
- Player projections never include `hostAnswers`, setup questions, future questions, or a correct choice before `ROUND_REVEAL`.
- The host receives setup data only during pregame states.
- Scores use server receive time and server-held answers. Client timestamps and claimed scores are ignored.
- Analytics hash player IDs with a separate salt and never contain answer content.
- Game records contain standings and version metadata, not private host answers.
- Provider-managed encryption at rest should be enabled for MongoDB and Redis. Application-level field encryption is not included in this release.

Automated tests inspect serialized player payloads before reveal and reject forged tokens and malformed events.

## Moderation and abuse controls

- Nicknames are HTML-stripped, Unicode-normalized, whitespace-normalized, bounded to 24 characters, and checked against reserved/abusive terms.
- Nickname uniqueness is case-insensitive within a room.
- Hosts can remove players before play and transfer control outside active rounds.
- REST create, join, resume, and QR endpoints have separate rate limits.
- Each socket has a bounded event-rate window and a 16 KB maximum inbound payload.
- Edge rate limits should also be enabled because process-local REST limits are defense in depth, not a global distributed quota.

The local blocked-term list is intentionally small. Before broad public launch, connect a reviewed moderation provider or a maintained locale-aware list and add appeal/false-positive telemetry.

## Persistence and migrations

Collections:

- `multiplayerrooms`: active authoritative rooms, TTL, lifecycle, bounded idempotency log.
- `multiplayergamerecords`: one append-only final record per room.
- `multiplayeranalyticsevents`: privacy-minimized events with retention TTL.

Run:

```powershell
npm run migrate
npm run migrate -- status
```

Migration `001-create-multiplayer-platform.js` creates unique room/record indexes, deadline indexes, host-grace index, and TTL indexes. MongoDB TTL cleanup is a fallback; the coordinator first records `EXPIRED` when it sees a due room.

## Horizontal scaling

Production requirements:

1. At least one MongoDB replica set with majority writes appropriate to the deployment.
2. Redis reachable by every realtime node.
3. `MULTIPLAYER_REQUIRE_REDIS=true` so a node without distributed fanout fails readiness.
4. Load-balancer session affinity while Socket.IO long-polling fallback is enabled. Pure WebSocket deployments can remove this requirement after compatibility testing.
5. Graceful termination long enough for readiness removal, socket disconnect, and HTTP close.

MongoDB remains the authority. Redis carries fanout and presence ownership, not scores or private answers. No correctness path depends on process-local room state.

Provisional rollout assumption: keep rooms at the enforced 12-person maximum and establish per-node connection limits from staging soak tests. No production concurrent-user or maximum-room claim is made by the local measurements below.

## Failure policy

| Failure | Behavior |
| --- | --- |
| Browser network loss | Socket retries with bounded backoff; tab token resumes the player |
| Duplicate player connection | Newest connection wins; older socket receives `session:replaced` |
| Host loss before play | 45-second grace, then oldest connected player becomes host |
| Host loss during play | 45-second grace, then room is cancelled; mid-round host transfer is deliberately disallowed |
| Node restart | Room/timers reload from MongoDB; clients reconnect through the load balancer |
| Redis unavailable at startup | Production readiness/startup fails when Redis is required |
| Redis fails at runtime | Readiness fails; MongoDB still prevents conflicting scores, but cross-node broadcasts are degraded until reconnect/recovery |
| MongoDB unavailable | Mutations fail closed; clients retain no speculative authoritative state and may retry |
| Late/duplicate event | State validation or idempotency log rejects/absorbs it |
| Room expiry | Coordinator records `EXPIRED`; TTL eventually removes the active document |

## Monitoring and alerts

Structured logs are JSON with service, event, timestamp, node, room code where relevant, and error message. Tokens and answers must never be added.

The admin metrics hook reports:

- active connections per node;
- room/player/game counters;
- socket success/error counters by event/code;
- optimistic concurrency conflicts;
- p50/p95/p99 event-handler latency from a rolling local sample.

Recommended initial alerts, to be tuned from staging baselines:

- multiplayer readiness not OK for 2 minutes;
- any production node in `single-instance` mode;
- socket error ratio above 2% over 5 minutes;
- p95 command latency above 500 ms over 5 minutes;
- sustained room version conflicts above baseline;
- game completion rate falling sharply relative to starts;
- MongoDB or Redis saturation, reconnect storms, or TTL backlog.

Aggregate per-node metrics in the existing infrastructure dashboard or an external collector. In-memory metrics reset on restart and are not a long-term metrics database.

## Load testing

The reproducible harness uses real Socket.IO clients and the production room service with an isolated in-memory repository:

```powershell
node server\scripts\multiplayerLoad.js --rooms=2 --players=4 --rounds=3
node server\scripts\multiplayerLoad.js --rooms=10 --players=6 --rounds=3
```

Measured locally on 2026-08-09:

| Scenario | Clients | Ack events | Errors | p50 | p95 | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Light | 8 | 40 | 0 | 5 ms | 9 ms | 140 ms |
| Moderate | 60 | 260 | 0 | 60 ms | 70 ms | 743 ms |

These numbers cover a single Node process, Socket.IO transport, validation, serialization, concurrency, and game engine. They exclude real MongoDB latency, Redis fanout, TLS, load balancers, geographic networks, reconnect storms, and analytics storage. They are regression baselines, not capacity claims.

Before production, run the same lifecycle against staging MongoDB/Redis with multiple nodes, then soak for at least the intended room TTL while tracking p95/p99, CPU, memory, event-loop lag, database write latency, adapter errors, and reconnect rate.

## Testing

```powershell
npm run test:multiplayer
npm test -- --runInBand
npm run check:server
npm run build
```

Coverage includes lifecycle/privacy, server scoring, ties, idempotency, reconnect identity, refresh resume, rematch reset, host transfer/cancellation, expiry cleanup, REST contracts, collision errors, forged tokens, malformed payloads, and real synchronized Socket.IO clients.

## Adding a game

1. Create `server/multiplayer/games/<game>/index.js` with a manifest plus `createRoomState`, `projectState`, `executeCommand`, `onPlayerJoined`, deadline hooks, and `createGameRecord`.
2. Register it in `server/multiplayer/games/registry.js`.
3. Keep game-owned data under `gameData.state`; validate each `game:command` payload inside the adapter.
4. Add a renderer under `src/features/play-with-friends/games/<game>`.
5. Register the renderer in the client game registry.
6. Add privacy, lifecycle, multi-client, and load cases before enabling it.

Do not copy the socket gateway or create game-specific room endpoints.

For **Most Likely To**, add `server/multiplayer/games/mostLikelyTo/index.js` and `questions/en.js`. Store nominees/votes/reveal in `gameData.state`; implement `session:start`, `round:nominate`, and `round:advance` through `game:command`; project each viewer's own locked vote before reveal and aggregate votes afterward. Add `MostLikelyToGame.jsx` and one client-registry entry.

For **Would You Rather**, add `server/multiplayer/games/wouldYouRather/index.js` and `questions/en.js`. Store option votes and round counters in `gameData.state`; implement `session:start`, `round:vote`, and `round:advance`; project only the viewer's vote before reveal and totals afterward. Add `WouldYouRatherGame.jsx` and one client-registry entry.

Both games reuse room codes, guest tokens, reconnect ownership, presence, Redis fanout, Mongo compare-and-swap writes, lifecycle validation, timers, host grace, analytics, metrics, moderation, rate limits, and the generic `game:command` event without changes to multiplayer core modules.

## Questions and localization

Question files are versioned locale modules under the game. To add content:

1. Add stable IDs; never reuse an ID for semantically different content.
2. Increment the bank version for material edits.
3. Keep prompts mutually understandable and answer options non-overlapping.
4. Run a duplicate/bias review and server tests.
5. Keep inactive content in source with `active: false` if historical records reference it.

To add a locale, provide a full question module and client message bundle, add the locale to the game manifest, and test text expansion at mobile widths. The server falls back to English until a locale is explicitly supported.

## Deployment and rollback

Staged release:

1. Apply migration and verify index names in staging.
2. Start one hidden canary node with Redis required.
3. Run multi-device smoke tests and the staging load/soak plan.
4. Enable the backend for staff while the client flag remains off.
5. Enable the About Me card for a small traffic cohort at the edge/build layer.
6. Expand only while readiness, error ratio, p95, completion, and reconnect metrics remain healthy.

Rollback:

1. Set `PARCEL_MULTIPLAYER_ENABLED=false` to remove entry points.
2. Set `MULTIPLAYER_ENABLED=false` on drained backend nodes.
3. Keep collections and indexes during rollback so active audit records are not destroyed.
4. Roll back indexes with `npm run migrate -- down 1` only after confirming no compatible service still uses them.

## Cost and risk notes

Main variable costs are persistent socket connections, Redis operations/bandwidth, MongoDB writes from presence and answers, analytics retention, and QR generation CPU. The current 90-day analytics TTL and six-hour room TTL are tunable. Presence writes are intentionally limited to connect/disconnect rather than heartbeats. The largest open launch risks are unmeasured multi-region latency, reconnect storms, moderation breadth, real database contention, and generated image payload size.

The final production-dependency audit has two moderate React Router advisories that require a major router migration to resolve. Multiplayer navigation uses fixed internal destinations and validated room-code segments, which limits this feature's exposure, but it does not remove the repository-wide advisory. Plan and test the React Router 7 migration before public release rather than forcing it into the multiplayer change.
