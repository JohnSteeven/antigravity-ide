const crypto = require("crypto");
const InMemoryRoomRepository = require("../../multiplayer/persistence/InMemoryRoomRepository");
const MultiplayerMetrics = require("../../multiplayer/observability/metrics");
const RoomService = require("../../multiplayer/services/roomService");
const { serializeRoom } = require("../../multiplayer/domain/serializer");
const { createPlan } = require("../../multiplayer/games/lifeAuction/director");
const { initializeWallets, availableBalance } = require("../../multiplayer/games/lifeAuction/economy");
const { resolveEvent } = require("../../multiplayer/games/lifeAuction/events");

const requestId = () => crypto.randomUUID();

const createHarness = () => {
  let clock = new Date("2026-08-09T12:00:00.000Z");
  const repository = new InMemoryRoomRepository();
  const service = new RoomService({
    repository,
    analytics: null,
    metrics: new MultiplayerMetrics(),
    now: () => new Date(clock),
    roomTtlHours: 6,
    hostGraceSeconds: 10,
  });
  return {
    repository,
    service,
    now: () => new Date(clock),
    advance(ms) { clock = new Date(clock.getTime() + ms); },
  };
};

const gameCommand = (service, roomCode, playerId, command, payload = {}, id = requestId()) => service.executeGameCommand({
  roomCode,
  playerId,
  requestId: id,
  command,
  payload,
});

const createStartedRoom = async (harness, { modeKey = "classic-life", lengthKey = "quick", startingCoins = 100 } = {}) => {
  const host = await harness.service.createRoom({ gameKey: "life-auction", nickname: "Host" });
  const friend = await harness.service.joinRoom({ roomCode: host.room.roomCode, nickname: "Friend" });
  await gameCommand(harness.service, host.room.roomCode, host.playerId, "setup:update", { modeKey, lengthKey, startingCoins });
  const started = await gameCommand(harness.service, host.room.roomCode, host.playerId, "session:start");
  return { host, friend, started };
};

const forceSealedCurrentAuction = async (harness, roomCode) => {
  const room = await harness.repository.findByCode(roomCode);
  room.gameData.state.currentAuction.type = "SEALED_BID";
  room.gameData.state.currentAuction.visibility = "PRIVATE_UNTIL_REVEAL";
  room.gameData.state.currentAuction.highestBid = null;
  room.gameData.state.currentAuction.bidHistory = [];
  room.gameData.state.currentAuction.sealedBids = {};
  room.gameData.state.plan.lots[room.gameData.state.roundIndex].auction.type = "SEALED_BID";
  return harness.repository.save(room, room.version);
};

describe("Life Auction domain and director", () => {
  test("builds deterministic, versioned, varied plans for every launch mode", () => {
    const modes = ["classic-life", "friends-night", "deep-life", "money-success", "dream-life", "chaos", "random-mix"];
    modes.forEach((modeKey) => {
      const first = createPlan({ modeKey, lengthKey: "quick", seed: `seed:${modeKey}` });
      const repeated = createPlan({ modeKey, lengthKey: "quick", seed: `seed:${modeKey}` });
      expect(first).toEqual(repeated);
      expect(first.lots).toHaveLength(8);
      expect(new Set(first.lots.map((lot) => lot.id)).size).toBe(8);
      expect(new Set(first.lots.map((lot) => lot.category)).size).toBeGreaterThanOrEqual(4);
      expect(first.lots[0].auction.type).toBe("OPEN_ASCENDING");
      expect(first.contentVersion).toBe(1);
    });
  });

  test("keeps wallet and event effects inside integer, non-negative invariants", () => {
    const players = [{ playerId: "a" }, { playerId: "b" }];
    const state = {
      seed: "economy-seed",
      wallets: initializeWallets(players, 100),
      ownership: { a: [], b: [] },
      economyAudit: [],
      eventHistory: [],
      eventFairness: { negativeCounts: {} },
      playerEffects: {},
    };
    const currentEvent = {
      eventId: "life-happened",
      kind: "EXPENSE",
      title: "Life Happened",
      icon: "🌧️",
      privateChoices: {},
    };
    resolveEvent({ state, currentEvent, players, now: new Date("2026-08-09T12:00:00Z") });
    Object.values(state.wallets).forEach((wallet) => {
      expect(Number.isSafeInteger(wallet.balance)).toBe(true);
      expect(wallet.balance).toBeGreaterThanOrEqual(0);
      expect(wallet.reserved).toBeLessThanOrEqual(wallet.balance);
      expect(availableBalance(wallet)).toBeGreaterThanOrEqual(0);
    });
    expect(state.economyAudit.every((entry, index) => entry.sequence === index + 1)).toBe(true);
  });

  test("charges a successful voluntary group goal atomically and gives contributors one shared memory", () => {
    const players = ["a", "b", "c", "d"].map((playerId) => ({ playerId }));
    const state = {
      seed: "group-seed",
      wallets: initializeWallets(players, 100),
      ownership: { a: [], b: [], c: [], d: [] },
      economyAudit: [],
      eventHistory: [],
      eventFairness: { negativeCounts: {} },
      playerEffects: {},
    };
    const choices = [
      { id: "contribute-0", amount: 0 },
      { id: "contribute-10", amount: 10 },
    ];
    const currentEvent = {
      id: "shared-trip:0",
      eventId: "shared-trip",
      kind: "GROUP_GOAL",
      title: "The Group Must Decide",
      icon: "🚌",
      choices,
      privateChoices: Object.fromEntries(players.map((player) => [player.playerId, { choiceId: "contribute-10" }])),
    };
    const result = resolveEvent({ state, currentEvent, players, now: new Date("2026-08-09T12:00:00Z") });
    expect(result.unlocked).toBe(true);
    expect(result.totalContribution).toBe(40);
    players.forEach((player) => {
      expect(state.wallets[player.playerId].balance).toBe(90);
      expect(state.ownership[player.playerId]).toHaveLength(1);
      expect(state.ownership[player.playerId][0].shared).toBe(true);
    });
  });
});

describe("Life Auction authoritative bidding", () => {
  test("releases the previous reservation and charges the winner exactly once", async () => {
    const harness = createHarness();
    const { host, friend, started } = await createStartedRoom(harness);
    const minimum = started.room.gameData.state.currentAuction.startingPrice;
    await gameCommand(harness.service, host.room.roomCode, host.playerId, "auction:bid", { amount: minimum });
    harness.advance(100);
    const outbid = await gameCommand(harness.service, host.room.roomCode, friend.playerId, "auction:bid", { amount: minimum + 2 });
    expect(outbid.room.gameData.state.wallets[host.playerId].reserved).toBe(0);
    expect(outbid.room.gameData.state.wallets[friend.playerId].reserved).toBe(minimum + 2);

    const deadline = new Date(outbid.room.gameData.roundDeadline).getTime();
    harness.advance(deadline - harness.now().getTime());
    const stale = await harness.repository.findByCode(host.room.roomCode);
    const closed = await harness.service.expireRound(stale);
    const duplicateClose = await harness.service.expireRound(stale);
    expect(closed.status).toBe("ROUND_REVEAL");
    expect(duplicateClose).toBeNull();
    expect(closed.gameData.state.wallets[friend.playerId].balance).toBe(100 - minimum - 2);
    expect(closed.gameData.state.wallets[friend.playerId].spent).toBe(minimum + 2);
    expect(closed.gameData.state.wallets[friend.playerId].reserved).toBe(0);
    expect(closed.gameData.state.ownership[friend.playerId]).toHaveLength(1);
  });

  test("allows exactly one of two identical simultaneous open bids", async () => {
    const harness = createHarness();
    const { host, friend, started } = await createStartedRoom(harness);
    const amount = started.room.gameData.state.currentAuction.startingPrice;
    const attempts = await Promise.allSettled([
      gameCommand(harness.service, host.room.roomCode, host.playerId, "auction:bid", { amount }),
      gameCommand(harness.service, host.room.roomCode, friend.playerId, "auction:bid", { amount }),
    ]);
    expect(attempts.filter((attempt) => attempt.status === "fulfilled")).toHaveLength(1);
    expect(attempts.filter((attempt) => attempt.status === "rejected")).toHaveLength(1);
    const room = await harness.repository.findByCode(host.room.roomCode);
    const reservations = Object.values(room.gameData.state.wallets).filter((wallet) => wallet.reserved > 0);
    expect(reservations).toHaveLength(1);
    expect(room.gameData.state.currentAuction.bidHistory).toHaveLength(1);
  });

  test("rejects at the exact deadline and extends only a valid final-window bid", async () => {
    const harness = createHarness();
    const { host, friend, started } = await createStartedRoom(harness);
    const auction = started.room.gameData.state.currentAuction;
    harness.advance(new Date(auction.deadline).getTime() - harness.now().getTime() - 2000);
    const extended = await gameCommand(harness.service, host.room.roomCode, friend.playerId, "auction:bid", { amount: auction.startingPrice });
    expect(extended.room.gameData.state.currentAuction.extensionCount).toBe(1);
    expect(new Date(extended.room.gameData.state.currentAuction.deadline).getTime()).toBe(new Date(auction.deadline).getTime() + 3000);

    harness.advance(new Date(extended.room.gameData.state.currentAuction.deadline).getTime() - harness.now().getTime());
    await expect(gameCommand(harness.service, host.room.roomCode, host.playerId, "auction:bid", { amount: auction.startingPrice + 2 }))
      .rejects.toMatchObject({ code: "MULTIPLAYER_INVALID_STATE" });
  });

  test("keeps sealed values out of host, player, reconnect and spectator-shaped projections until reveal", async () => {
    const harness = createHarness();
    const { host, friend } = await createStartedRoom(harness);
    await forceSealedCurrentAuction(harness, host.room.roomCode);
    const submitted = await gameCommand(harness.service, host.room.roomCode, host.playerId, "auction:bid", { amount: 27 });
    const hostView = serializeRoom(submitted.room, host.playerId);
    const friendView = serializeRoom(submitted.room, friend.playerId);
    [hostView, friendView].forEach((view) => {
      expect(view.lifeAuction.auction).not.toHaveProperty("sealedBids");
      expect(view.lifeAuction.auction).not.toHaveProperty("amount");
      expect(JSON.stringify(view)).not.toContain('"amount":27');
    });
    expect(hostView.lifeAuction.wallet.reserved).toBeNull();
    expect(hostView.lifeAuction.wallet.available).toBeNull();
    expect(friendView.lifeAuction.auction.ownBidSubmitted).toBe(false);

    harness.advance(100);
    const revealed = await gameCommand(harness.service, host.room.roomCode, friend.playerId, "auction:bid", { amount: 18 });
    expect(revealed.room.status).toBe("ROUND_REVEAL");
    const revealedView = serializeRoom(revealed.room, friend.playerId);
    expect(revealedView.lifeAuction.result.bids.map((bid) => bid.amount)).toEqual([27, 18]);
    expect(revealedView.lifeAuction.result.winners[0].playerId).toBe(host.playerId);
  });

  test("absorbs a duplicate sealed submission by request id and rejects a distinct replay", async () => {
    const harness = createHarness();
    const { host } = await createStartedRoom(harness);
    await forceSealedCurrentAuction(harness, host.room.roomCode);
    const id = requestId();
    const first = await gameCommand(harness.service, host.room.roomCode, host.playerId, "auction:bid", { amount: 19 }, id);
    const duplicate = await gameCommand(harness.service, host.room.roomCode, host.playerId, "auction:bid", { amount: 19 }, id);
    expect(first.duplicate).toBe(false);
    expect(duplicate.duplicate).toBe(true);
    harness.advance(100);
    await expect(gameCommand(harness.service, host.room.roomCode, host.playerId, "auction:bid", { amount: 20 }))
      .rejects.toMatchObject({ code: "MULTIPLAYER_DUPLICATE_ACTION" });
  });

  test("settles an equal sealed tie by earliest server receipt with the policy visible at reveal", async () => {
    const harness = createHarness();
    const { host, friend } = await createStartedRoom(harness);
    await forceSealedCurrentAuction(harness, host.room.roomCode);
    await gameCommand(harness.service, host.room.roomCode, host.playerId, "auction:bid", { amount: 21 });
    harness.advance(100);
    const reveal = await gameCommand(harness.service, host.room.roomCode, friend.playerId, "auction:bid", { amount: 21 });
    expect(reveal.room.gameData.state.lastResult.tie).toBe(true);
    expect(reveal.room.gameData.state.lastResult.tiePolicy).toBe("EARLIEST_VALID_BID");
    expect(reveal.room.gameData.state.lastResult.winners[0].playerId).toBe(host.playerId);
  });

  test("supports a configured multi-buyer fixed price without charging either player twice", async () => {
    const harness = createHarness();
    const { host, friend } = await createStartedRoom(harness);
    let room = await harness.repository.findByCode(host.room.roomCode);
    const auction = room.gameData.state.currentAuction;
    auction.type = "FIXED_PRICE";
    auction.purchaseLimit = 2;
    auction.purchases = [];
    room.gameData.state.plan.lots[0].auction.type = "FIXED_PRICE";
    room.gameData.state.plan.lots[0].auction.purchaseLimit = 2;
    room = await harness.repository.save(room, room.version);
    const price = auction.startingPrice;
    await gameCommand(harness.service, room.roomCode, host.playerId, "auction:bid", { amount: price });
    harness.advance(100);
    const closed = await gameCommand(harness.service, room.roomCode, friend.playerId, "auction:bid", { amount: price });
    expect(closed.room.status).toBe("ROUND_REVEAL");
    expect(closed.room.gameData.state.lastResult.winners).toHaveLength(2);
    expect(closed.room.gameData.state.wallets[host.playerId].spent).toBe(price);
    expect(closed.room.gameData.state.wallets[friend.playerId].spent).toBe(price);
    expect(closed.room.gameData.state.ownership[host.playerId]).toHaveLength(1);
    expect(closed.room.gameData.state.ownership[friend.playerId]).toHaveLength(1);
  });
});

describe("Life Auction party lifecycle", () => {
  test("returns to a valid lobby when the host removes the only friend before play", async () => {
    const harness = createHarness();
    const host = await harness.service.createRoom({ gameKey: "life-auction", nickname: "Host" });
    const friend = await harness.service.joinRoom({ roomCode: host.room.roomCode, nickname: "Friend" });
    expect(friend.room.status).toBe("READY");
    const removed = await harness.service.removePlayer({
      roomCode: host.room.roomCode,
      playerId: host.playerId,
      requestId: requestId(),
      targetPlayerId: friend.playerId,
    });
    expect(removed.room.status).toBe("LOBBY");
    expect(removed.room.players).toHaveLength(1);
  });

  test("refresh projection restores wallet, lot and deadline without exposing authoritative internals", async () => {
    const harness = createHarness();
    const { host, friend, started } = await createStartedRoom(harness);
    const minimum = started.room.gameData.state.currentAuction.startingPrice;
    harness.advance(100);
    const bid = await gameCommand(harness.service, host.room.roomCode, friend.playerId, "auction:bid", { amount: minimum });
    const restored = serializeRoom(await harness.repository.findByCode(host.room.roomCode), friend.playerId);
    expect(restored.lifeAuction.lot.id).toBeTruthy();
    expect(restored.lifeAuction.auction.deadline).toEqual(bid.room.gameData.state.currentAuction.deadline);
    expect(restored.lifeAuction.wallet.reserved).toBe(minimum);
    expect(JSON.stringify(restored)).not.toContain("economyAudit");
    expect(JSON.stringify(restored)).not.toContain("lastBidAt");
  });

  test("switches games inside the same party, room and player identities", async () => {
    const harness = createHarness();
    const { host, friend } = await createStartedRoom(harness);
    const room = await harness.repository.findByCode(host.room.roomCode);
    room.status = "FINISHED";
    room.endedAt = harness.now();
    const finished = await harness.repository.save(room, room.version);
    const switched = await harness.service.switchGame({
      roomCode: finished.roomCode,
      playerId: host.playerId,
      requestId: requestId(),
      gameKey: "who-knows-me-better",
    });
    expect(switched.room.roomCode).toBe(host.room.roomCode);
    expect(switched.room.partySessionId).toBe(host.room.partySessionId);
    expect(switched.room.gameInstanceId).not.toBe(host.room.gameInstanceId);
    expect(switched.room.players.map((player) => player.playerId)).toEqual([host.playerId, friend.playerId]);
    expect(switched.room.gameKey).toBe("who-knows-me-better");
    expect(switched.room.status).toBe("LOBBY");
  });

  test("completes a full Quick session through lots and events, persists one record, and rematches cleanly", async () => {
    const harness = createHarness();
    const { host, friend } = await createStartedRoom(harness);
    let room = await harness.repository.findByCode(host.room.roomCode);
    let safety = 0;
    while (room.status !== "FINISHED" && safety < 40) {
      safety += 1;
      const state = room.gameData.state;
      if (room.status === "IN_PROGRESS" && state.phase === "BIDDING") {
        room = await harness.service.expireRound(room);
      } else if (room.status === "IN_PROGRESS" && state.phase === "LIFE_EVENT") {
        if (state.currentEvent.choiceRequired) {
          for (const identity of [host, friend]) {
            const latest = await harness.repository.findByCode(host.room.roomCode);
            if (latest.status !== "IN_PROGRESS") break;
            const active = latest.gameData.state.currentEvent;
            const choice = active.choices.find((entry) => entry.id === "skip" || entry.id === "coins-now" || entry.id === "contribute-0") || active.choices[0];
            const targetPlayerId = choice.id === "gift" ? (identity.playerId === host.playerId ? friend.playerId : host.playerId) : undefined;
            const selected = await gameCommand(harness.service, host.room.roomCode, identity.playerId, "life_event:choose", {
              choiceId: choice.id,
              ...(targetPlayerId ? { targetPlayerId } : {}),
            });
            room = selected.room;
          }
        } else room = await harness.service.expireRound(room);
      } else if (room.status === "ROUND_REVEAL" || room.status === "BETWEEN_ROUNDS") {
        room = await harness.service.beginNextRound(room);
      } else {
        throw new Error(`Unexpected lifecycle ${room.status}/${state.phase}`);
      }
    }
    expect(safety).toBeLessThan(40);
    expect(room.status).toBe("FINISHED");
    expect(room.gameData.state.auctionHistory).toHaveLength(8);
    expect(room.gameData.state.portfolios.portfolios).toHaveLength(2);
    expect(harness.repository.records).toHaveLength(1);
    expect(harness.repository.records[0].gameInstanceId).toBe(room.gameInstanceId);

    const previousInstanceId = room.gameInstanceId;
    const rematch = await harness.service.rematch({ roomCode: room.roomCode, playerId: host.playerId, requestId: requestId() });
    expect(rematch.room.status).toBe("READY");
    expect(rematch.room.gameInstanceId).not.toBe(previousInstanceId);
    expect(rematch.room.gameData.state.wallets).toEqual({});
    expect(rematch.room.gameData.state.ownership).toEqual({});
    expect(rematch.room.gameData.state.currentAuction).toBeNull();
  });
});
