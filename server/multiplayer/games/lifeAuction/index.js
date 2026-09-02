const { z } = require("zod");
const { ERROR_CODES, PLAYER_ROLES, ROOM_STATUSES } = require("../../domain/constants");
const MultiplayerError = require("../../domain/MultiplayerError");
const catalog = require("./content/lots.en");
const { createPlan } = require("./director");
const {
  assertAmount,
  availableBalance,
  commitReservation,
  initializeWallets,
  publicWallet,
  releaseAllReservations,
  setReservation,
  spendAvailable,
  walletFor,
} = require("./economy");
const { resolveEvent, startEvent, submitEventChoice } = require("./events");
const { LENGTH_PRESETS, getMode, listModes } = require("./modes");
const { buildPortfolios } = require("./portfolio");
const { AUCTION_TYPES, createAuction, minimumOpenBid, rankSealedBids } = require("./strategies");

const VERSIONS = Object.freeze({ game: 1, content: catalog.version, economy: 1, strategy: 1, director: 1, events: 1, portfolio: 1 });
const ALLOWED_REACTIONS = new Set(["😂", "😮", "❤️", "👀", "🔥"]);
const HISTORY_LIMIT = 80;

const manifest = Object.freeze({
  key: "life-auction",
  version: VERSIONS.game,
  title: "Life Auction",
  description: "You have 100 Life Coins. You can't buy everything. What matters most?",
  minPlayers: 2,
  maxPlayers: 12,
  supportedLocales: ["en"],
  defaultMode: "classic-life",
  defaultLength: "standard",
  contentVersion: VERSIONS.content,
});

const fail = (code, message, status = 409) => {
  throw new MultiplayerError(code, message, { status });
};

const commandSchemas = Object.freeze({
  "setup:update": z.object({
    modeKey: z.string().min(2).max(40),
    lengthKey: z.enum(["quick", "standard", "full"]),
    startingCoins: z.union([z.literal(50), z.literal(100), z.literal(200)]),
  }).strict(),
  "session:start": z.object({}).strict(),
  "auction:bid": z.object({ amount: z.number().int().min(1).max(1000000) }).strict(),
  "life_event:choose": z.object({
    choiceId: z.string().min(1).max(60),
    targetPlayerId: z.string().uuid().optional(),
  }).strict(),
  "reaction:send": z.object({ emoji: z.string().min(1).max(4) }).strict(),
  "telemetry:record": z.object({
    event: z.enum(["life_auction_viewed", "portfolio_viewed", "result_shared"]),
  }).strict(),
});

const parseCommand = (command, payload) => {
  const schema = commandSchemas[command];
  if (!schema) fail(ERROR_CODES.INVALID_ACTION, "That Life Auction action is not supported.", 400);
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new MultiplayerError(ERROR_CODES.BAD_REQUEST, "That Life Auction action was malformed.", {
      status: 422,
      details: result.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    });
  }
  return result.data;
};

const requireHost = (room, player) => {
  if (player.role !== PLAYER_ROLES.HOST || room.hostPlayerId !== player.playerId) {
    fail(ERROR_CODES.NOT_HOST, "Only the party host can do that.", 403);
  }
};

const stateFor = (room) => room.gameData.state;
const currentLot = (state) => state.plan?.lots?.[state.roundIndex] || null;
const playerName = (room, playerId) => room.players.find((entry) => entry.playerId === playerId)?.nickname || "Player";

const baseState = ({ roomCode, locale = "en", seed = roomCode }) => ({
  phase: "SETUP",
  locale,
  seed,
  modeKey: manifest.defaultMode,
  lengthKey: manifest.defaultLength,
  startingCoins: 100,
  versions: { ...VERSIONS },
  plan: null,
  roundIndex: -1,
  wallets: {},
  ownership: {},
  currentAuction: null,
  currentEvent: null,
  lastResult: null,
  auctionHistory: [],
  eventHistory: [],
  handledEventRounds: [],
  economyAudit: [],
  economySequence: 0,
  eventFairness: { negativeCounts: {} },
  playerEffects: {},
  modifiers: {},
  reactions: [],
  lastBidAt: {},
  lastReactionAt: {},
  portfolios: null,
});

const createRoomState = ({ roomCode, locale = "en", seed } = {}) => ({
  settings: {
    maxPlayers: manifest.maxPlayers,
    minPlayers: manifest.minPlayers,
    questionCount: LENGTH_PRESETS.standard.lotCount,
    roundDurationSec: 18,
    categories: [],
    modeKey: manifest.defaultMode,
    lengthKey: manifest.defaultLength,
    startingCoins: 100,
    currencyLabel: "Life Coins",
    allowDebt: false,
    features: {
      sealedBidding: process.env.LIFE_AUCTION_SEALED_ENABLED !== "false",
      lifeEvents: process.env.LIFE_AUCTION_EVENTS_ENABLED !== "false",
      groupEvents: process.env.LIFE_AUCTION_GROUP_EVENTS_ENABLED !== "false",
      trading: false,
    },
  },
  gameData: {
    questionBankVersion: catalog.version,
    questions: [],
    hostAnswers: {},
    guesses: {},
    scores: {},
    currentRound: -1,
    roundStartedAt: null,
    roundDeadline: null,
    nextRoundAt: null,
    reveal: null,
    state: baseState({ roomCode, locale, seed }),
  },
});

const listCategories = () => [...new Set(catalog.lots.filter((lot) => lot.active).map((lot) => lot.category))].sort();

const onPlayerJoined = ({ room, transition }) => {
  if (room.players.length >= room.settings.minPlayers && room.status === ROOM_STATUSES.LOBBY) transition(ROOM_STATUSES.READY);
};

const onPlayerRemoved = ({ room, transition }) => {
  if (room.players.length < room.settings.minPlayers && room.status === ROOM_STATUSES.READY) transition(ROOM_STATUSES.LOBBY);
};

const publicLot = (lot, hidden) => {
  if (!lot) return null;
  if (hidden && lot.mystery) {
    return {
      id: lot.id,
      title: "Mystery Lot",
      shortDescription: lot.mysteryHint,
      category: lot.category,
      icon: "👀",
      mystery: true,
      rarity: lot.rarity,
      depth: lot.depth,
    };
  }
  return {
    id: lot.id,
    title: lot.title,
    shortDescription: lot.shortDescription,
    category: lot.category,
    icon: lot.icon,
    visualTheme: lot.visualTheme,
    mystery: lot.mystery,
    rarity: lot.rarity,
    depth: lot.depth,
  };
};

const projectAuction = ({ room, state, viewer }) => {
  const auction = state.currentAuction;
  const lot = currentLot(state);
  if (!auction || !lot) return null;
  const common = {
    type: auction.type,
    startingPrice: auction.startingPrice,
    minimumIncrement: auction.minimumIncrement,
    deadline: auction.deadline,
    extensionCount: auction.extensionCount,
    purchaseLimit: auction.purchaseLimit,
  };
  if (auction.type === AUCTION_TYPES.OPEN_ASCENDING) {
    return {
      ...common,
      highestBid: auction.highestBid ? {
        playerId: auction.highestBid.playerId,
        nickname: playerName(room, auction.highestBid.playerId),
        amount: auction.highestBid.amount,
      } : null,
      minimumNextBid: minimumOpenBid(auction),
      bidHistory: auction.bidHistory.slice(-24).map((bid) => ({
        playerId: bid.playerId,
        nickname: playerName(room, bid.playerId),
        amount: bid.amount,
        submittedAt: bid.submittedAt,
      })),
    };
  }
  if (auction.type === AUCTION_TYPES.SEALED_BID) {
    return {
      ...common,
      submittedPlayerIds: Object.keys(auction.sealedBids),
      ownBidSubmitted: Boolean(auction.sealedBids[viewer.playerId]),
    };
  }
  return {
    ...common,
    price: auction.startingPrice,
    purchasedPlayerIds: auction.purchases.map((purchase) => purchase.playerId),
    remainingPurchases: Math.max(0, auction.purchaseLimit - auction.purchases.length),
  };
};

const projectEvent = (state, viewer) => {
  const active = state.currentEvent;
  if (!active) return null;
  return {
    id: active.id,
    eventId: active.eventId,
    kind: active.kind,
    title: active.title,
    description: active.description,
    icon: active.icon,
    choices: active.choices.map(({ id, label }) => ({ id, label })),
    choiceRequired: active.choiceRequired,
    submittedPlayerIds: [...active.submittedPlayerIds],
    ownChoiceId: active.privateChoices[viewer.playerId]?.choiceId || null,
    deadline: active.deadline,
  };
};

const projectState = ({ room, viewer }) => {
  const state = stateFor(room);
  const auction = state.currentAuction;
  const sealedPrivate = room.status === ROOM_STATUSES.IN_PROGRESS && state.phase === "BIDDING" && auction?.type === AUCTION_TYPES.SEALED_BID;
  const ownWallet = state.wallets[viewer.playerId] ? publicWallet(state.wallets[viewer.playerId]) : null;
  const wallet = sealedPrivate && ownWallet ? {
    ...ownWallet,
    reserved: null,
    available: null,
    reservedHidden: true,
  } : ownWallet;
  const finished = room.status === ROOM_STATUSES.FINISHED;
  const lot = currentLot(state);
  return {
    lifeAuction: {
      phase: state.phase,
      modeKey: state.modeKey,
      lengthKey: state.lengthKey,
      currencyLabel: room.settings.currencyLabel || "Life Coins",
      round: state.roundIndex >= 0 ? { number: state.roundIndex + 1, total: state.plan?.lots?.length || 0 } : null,
      lot: publicLot(lot, state.phase === "BIDDING"),
      auction: projectAuction({ room, state, viewer }),
      event: projectEvent(state, viewer),
      result: state.lastResult,
      wallet,
      players: room.players.map((player) => ({
        id: player.playerId,
        nickname: player.nickname,
        role: player.role,
        connected: player.connected,
        balance: state.wallets[player.playerId]?.balance ?? state.startingCoins,
        ownedCount: state.ownership[player.playerId]?.length || 0,
      })),
      setup: {
        modes: listModes().map(({ key, title, emoji, description }) => ({ key, title, emoji, description })),
        lengths: Object.values(LENGTH_PRESETS),
        startingCoinOptions: [50, 100, 200],
      },
      versions: { ...state.versions },
      reactions: state.reactions.slice(-12),
      portfolios: finished ? state.portfolios : null,
      disclaimer: "Life Coins are fictional, have no monetary value, and cannot be purchased or redeemed.",
    },
  };
};

const consumeDiscount = (state, playerId, amount) => {
  const effect = state.playerEffects?.[playerId];
  const discount = Math.min(Number(effect?.nextDiscount || 0), Math.max(0, amount - 1));
  if (discount && effect) effect.nextDiscount = 0;
  return { charged: amount - discount, discount };
};

const addOwnership = ({ state, playerId, lot, bidAmount, chargedAmount, discount, now, shared = false }) => {
  state.ownership[playerId] = state.ownership[playerId] || [];
  if (state.ownership[playerId].some((item) => item.lotId === lot.id)) return;
  state.ownership[playerId].push({
    lotId: lot.id,
    title: lot.title,
    category: lot.category,
    icon: lot.icon,
    purchasePrice: chargedAmount,
    bidAmount,
    discount,
    portfolioTraits: [...lot.portfolioTraits],
    auctionType: lot.auction.type,
    wonAt: now.toISOString(),
    shared,
  });
};

const setReveal = ({ room, state, result, now, transition }) => {
  state.lastResult = result;
  state.phase = result.kind === "LIFE_EVENT" ? "EVENT_REVEAL" : "AUCTION_REVEAL";
  room.gameData.reveal = result;
  room.gameData.roundDeadline = null;
  room.gameData.nextRoundAt = new Date(now.getTime() + (result.kind === "LIFE_EVENT" ? 3000 : 3800));
  transition(ROOM_STATUSES.ROUND_REVEAL);
};

const closeAuction = ({ room, state, now, transition }) => {
  if (state.phase !== "BIDDING" || !state.currentAuction) return false;
  const auction = state.currentAuction;
  const lot = currentLot(state);
  let winners = [];
  let revealedBids = [];
  let tie = false;

  if (auction.type === AUCTION_TYPES.OPEN_ASCENDING && auction.highestBid) {
    const winner = auction.highestBid;
    const price = consumeDiscount(state, winner.playerId, winner.amount);
    commitReservation(state, winner.playerId, price.charged, { lotId: lot.id, bidAmount: winner.amount, discount: price.discount }, now);
    if (walletFor(state, winner.playerId).reserved) setReservation(state, winner.playerId, 0, { lotId: lot.id }, now);
    addOwnership({ state, playerId: winner.playerId, lot, bidAmount: winner.amount, chargedAmount: price.charged, discount: price.discount, now });
    winners = [{ playerId: winner.playerId, nickname: playerName(room, winner.playerId), bidAmount: winner.amount, chargedAmount: price.charged, discount: price.discount }];
    revealedBids = auction.bidHistory.map((bid) => ({ playerId: bid.playerId, nickname: playerName(room, bid.playerId), amount: bid.amount, submittedAt: bid.submittedAt }));
  } else if (auction.type === AUCTION_TYPES.SEALED_BID) {
    const rankedBids = rankSealedBids({ bids: Object.values(auction.sealedBids), seed: state.seed, lotId: lot.id });
    tie = rankedBids.length > 1 && rankedBids[0].amount === rankedBids[1].amount;
    const winner = rankedBids[0];
    if (winner) {
      const price = consumeDiscount(state, winner.playerId, winner.amount);
      commitReservation(state, winner.playerId, price.charged, { lotId: lot.id, bidAmount: winner.amount, discount: price.discount }, now);
      if (walletFor(state, winner.playerId).reserved) setReservation(state, winner.playerId, 0, { lotId: lot.id }, now);
      addOwnership({ state, playerId: winner.playerId, lot, bidAmount: winner.amount, chargedAmount: price.charged, discount: price.discount, now });
      winners = [{ playerId: winner.playerId, nickname: playerName(room, winner.playerId), bidAmount: winner.amount, chargedAmount: price.charged, discount: price.discount }];
    }
    rankedBids.filter((bid) => bid.playerId !== winner?.playerId).forEach((bid) => {
      setReservation(state, bid.playerId, 0, { lotId: lot.id }, now);
    });
    revealedBids = rankedBids.map((bid) => ({ playerId: bid.playerId, nickname: playerName(room, bid.playerId), amount: bid.amount, submittedAt: bid.submittedAt }));
  } else if (auction.type === AUCTION_TYPES.FIXED_PRICE) {
    winners = auction.purchases.map((purchase) => ({ ...purchase, nickname: playerName(room, purchase.playerId) }));
    revealedBids = auction.purchases.map((purchase) => ({ playerId: purchase.playerId, nickname: playerName(room, purchase.playerId), amount: purchase.bidAmount, submittedAt: purchase.submittedAt }));
  }

  releaseAllReservations(state, { lotId: lot.id, reason: "AUCTION_CLOSED" }, now);
  const result = {
    kind: "AUCTION",
    lot: publicLot(lot, false),
    auctionType: auction.type,
    winners,
    bids: revealedBids,
    tie,
    tiePolicy: tie ? auction.tiePolicy : null,
    unsold: winners.length === 0,
    closedAt: now.toISOString(),
  };
  state.auctionHistory = [...state.auctionHistory, { lotId: lot.id, auctionType: auction.type, winners, bids: revealedBids, closedAt: result.closedAt }].slice(-HISTORY_LIMIT);
  setReveal({ room, state, result, now, transition });
  return true;
};

const startLot = ({ room, state, index, now }) => {
  state.roundIndex = index;
  state.currentEvent = null;
  state.lastResult = null;
  state.phase = "BIDDING";
  state.lastBidAt = {};
  state.currentAuction = createAuction({ lot: state.plan.lots[index], now, state });
  room.gameData.currentRound = index;
  room.gameData.roundStartedAt = now;
  room.gameData.roundDeadline = new Date(state.currentAuction.deadline);
  room.gameData.nextRoundAt = null;
  room.gameData.reveal = null;
};

const beginEvent = ({ room, state, now }) => {
  const current = startEvent({
    state,
    players: room.players,
    modeKey: state.modeKey,
    now,
    allowGroupEvents: room.settings.features.groupEvents,
  });
  if (!current) return false;
  state.currentAuction = null;
  state.currentEvent = current;
  state.lastResult = null;
  state.phase = "LIFE_EVENT";
  room.gameData.roundStartedAt = now;
  room.gameData.roundDeadline = new Date(current.deadline);
  room.gameData.nextRoundAt = null;
  room.gameData.reveal = null;
  return true;
};

const finish = ({ room, state, now, transition }) => {
  releaseAllReservations(state, { reason: "GAME_FINISHED" }, now);
  state.portfolios = buildPortfolios({ players: room.players, state });
  state.phase = "FINISHED";
  state.currentAuction = null;
  state.currentEvent = null;
  state.lastResult = null;
  room.gameData.roundDeadline = null;
  room.gameData.nextRoundAt = null;
  room.gameData.reveal = null;
  room.endedAt = now;
  transition(ROOM_STATUSES.FINISHED);
};

const submitBid = ({ room, state, player, amount, now, transition }) => {
  if (room.status !== ROOM_STATUSES.IN_PROGRESS || state.phase !== "BIDDING" || !state.currentAuction) {
    fail(ERROR_CODES.INVALID_STATE, "Bidding is not open right now.");
  }
  const auction = state.currentAuction;
  if (now.getTime() >= new Date(auction.deadline).getTime()) fail(ERROR_CODES.INVALID_STATE, "That auction deadline has passed.");
  assertAmount(amount);
  const lastBid = state.lastBidAt[player.playerId];
  if (lastBid && now.getTime() - new Date(lastBid).getTime() < 75) {
    fail(ERROR_CODES.RATE_LIMITED, "Bids are arriving too quickly. Try again.", 429);
  }
  state.lastBidAt[player.playerId] = now.toISOString();
  const lot = currentLot(state);
  const wallet = walletFor(state, player.playerId);

  if (auction.type === AUCTION_TYPES.OPEN_ASCENDING) {
    const minimum = minimumOpenBid(auction);
    if (amount < minimum) fail(ERROR_CODES.INVALID_ACTION, `The next valid bid is ${minimum} Life Coins.`);
    if (auction.highestBid?.playerId !== player.playerId && availableBalance(wallet) < amount) {
      fail(ERROR_CODES.INVALID_ACTION, "You do not have enough available Life Coins for that bid.");
    }
    const previous = auction.highestBid;
    if (previous && previous.playerId !== player.playerId) {
      setReservation(state, previous.playerId, 0, { lotId: lot.id, reason: "OUTBID" }, now);
    }
    setReservation(state, player.playerId, amount, { lotId: lot.id }, now);
    auction.highestBid = { playerId: player.playerId, amount, submittedAt: now.toISOString() };
    auction.bidHistory = [...auction.bidHistory, { playerId: player.playerId, amount, submittedAt: now.toISOString() }].slice(-60);
    const extension = auction.extensionPolicy;
    const remaining = new Date(auction.deadline).getTime() - now.getTime();
    if (extension.enabled && remaining <= extension.triggerWindowSec * 1000 && auction.extensionCount < extension.maximumExtensions) {
      auction.extensionCount += 1;
      auction.deadline = new Date(new Date(auction.deadline).getTime() + extension.extensionSec * 1000).toISOString();
      room.gameData.roundDeadline = new Date(auction.deadline);
    }
  } else if (auction.type === AUCTION_TYPES.SEALED_BID) {
    if (auction.sealedBids[player.playerId]) fail(ERROR_CODES.DUPLICATE_ACTION, "Your sealed bid is already submitted.");
    if (availableBalance(wallet) < amount) fail(ERROR_CODES.INVALID_ACTION, "You do not have enough available Life Coins for that sealed bid.");
    setReservation(state, player.playerId, amount, { lotId: lot.id, visibility: "PRIVATE" }, now);
    auction.sealedBids[player.playerId] = { playerId: player.playerId, amount, submittedAt: now.toISOString() };
    if (room.players.every((entry) => auction.sealedBids[entry.playerId])) closeAuction({ room, state, now, transition });
  } else if (auction.type === AUCTION_TYPES.FIXED_PRICE) {
    if (auction.purchases.some((purchase) => purchase.playerId === player.playerId)) fail(ERROR_CODES.DUPLICATE_ACTION, "You already bought this fixed-price lot.");
    if (amount !== auction.startingPrice) fail(ERROR_CODES.INVALID_ACTION, `This lot costs exactly ${auction.startingPrice} Life Coins.`);
    const price = consumeDiscount(state, player.playerId, auction.startingPrice);
    spendAvailable(state, player.playerId, price.charged, { lotId: lot.id, bidAmount: amount, discount: price.discount }, now);
    wallet.lotWinnings += 1;
    addOwnership({ state, playerId: player.playerId, lot, bidAmount: amount, chargedAmount: price.charged, discount: price.discount, now });
    auction.purchases.push({ playerId: player.playerId, bidAmount: amount, chargedAmount: price.charged, discount: price.discount, submittedAt: now.toISOString() });
    if (auction.purchases.length >= auction.purchaseLimit || auction.purchases.length >= room.players.length) {
      closeAuction({ room, state, now, transition });
    }
  } else fail(ERROR_CODES.INVALID_ACTION, "This auction strategy is not enabled for launch.");
};

const executeCommand = ({ command, payload, player, room, now, transition }) => {
  const input = parseCommand(command, payload);
  const state = stateFor(room);
  const current = now();

  if (command === "setup:update") {
    requireHost(room, player);
    if (![ROOM_STATUSES.LOBBY, ROOM_STATUSES.READY].includes(room.status)) fail(ERROR_CODES.INVALID_STATE, "Setup is locked after the auction begins.");
    const mode = getMode(input.modeKey);
    if (!mode?.active || !LENGTH_PRESETS[input.lengthKey]) fail(ERROR_CODES.BAD_REQUEST, "Choose an available Life Auction mode.", 422);
    state.modeKey = input.modeKey;
    state.lengthKey = input.lengthKey;
    state.startingCoins = input.startingCoins;
    room.settings.modeKey = input.modeKey;
    room.settings.lengthKey = input.lengthKey;
    room.settings.startingCoins = input.startingCoins;
    room.settings.questionCount = LENGTH_PRESETS[input.lengthKey].lotCount;
    return { analytics: [{ event: "mode_selected", metadata: { mode: input.modeKey, length: input.lengthKey, startingCoins: input.startingCoins } }] };
  }

  if (command === "session:start") {
    requireHost(room, player);
    if (room.status !== ROOM_STATUSES.READY || room.players.length < room.settings.minPlayers) fail(ERROR_CODES.INVALID_STATE, "At least two players are needed before the auction can begin.");
    state.seed = `${room.roomCode}:${room.gameInstanceId || room.version}:life-auction`;
    state.plan = createPlan({ modeKey: state.modeKey, lengthKey: state.lengthKey, seed: state.seed });
    if (!room.settings.features.sealedBidding) {
      state.plan.lots.forEach((lot) => { if (lot.auction.type === AUCTION_TYPES.SEALED_BID) lot.auction.type = AUCTION_TYPES.OPEN_ASCENDING; });
    }
    if (!room.settings.features.lifeEvents) state.plan.eventRounds = [];
    state.wallets = initializeWallets(room.players, state.startingCoins);
    state.ownership = Object.fromEntries(room.players.map((entry) => [entry.playerId, []]));
    state.startedAt = current.toISOString();
    transition(ROOM_STATUSES.IN_PROGRESS);
    startLot({ room, state, index: 0, now: current });
    return { analytics: [
      { event: "life_auction_started", metadata: { mode: state.modeKey, roundCount: state.plan.lots.length, playerCount: room.players.length } },
      { event: "lot_started", metadata: { auctionType: state.currentAuction.type, round: 1 } },
    ] };
  }

  if (command === "auction:bid") {
    submitBid({ room, state, player, amount: input.amount, now: current, transition });
    const auctionType = state.currentAuction?.type || state.lastResult?.auctionType;
    const analytics = [{ event: "bid_submitted", metadata: { auctionType, round: state.roundIndex + 1 } }];
    if (state.phase === "AUCTION_REVEAL") {
      analytics.push({ event: "auction_closed", metadata: { auctionType, round: state.roundIndex + 1, bidCount: state.lastResult?.bids?.length || 0 } });
      if (auctionType === AUCTION_TYPES.SEALED_BID) analytics.push({ event: "sealed_bid_completed", metadata: { round: state.roundIndex + 1, playerCount: room.players.length } });
    }
    return { analytics };
  }

  if (command === "life_event:choose") {
    if (room.status !== ROOM_STATUSES.IN_PROGRESS || state.phase !== "LIFE_EVENT" || !state.currentEvent) fail(ERROR_CODES.INVALID_STATE, "There is no Life Event choice open right now.");
    if (current.getTime() >= new Date(state.currentEvent.deadline).getTime()) fail(ERROR_CODES.INVALID_STATE, "That Life Event deadline has passed.");
    submitEventChoice({ state, currentEvent: state.currentEvent, playerId: player.playerId, choiceId: input.choiceId, targetPlayerId: input.targetPlayerId });
    if (state.currentEvent.choiceRequired && room.players.every((entry) => state.currentEvent.privateChoices[entry.playerId])) {
      const result = resolveEvent({ state, currentEvent: state.currentEvent, players: room.players, now: current });
      setReveal({ room, state, result: { ...result, eventKind: result.kind, kind: "LIFE_EVENT" }, now: current, transition });
    }
    const analytics = [{ event: "life_event_choice", metadata: { eventType: state.currentEvent?.kind || state.lastResult?.eventKind } }];
    if (state.phase === "EVENT_REVEAL") analytics.push({ event: "life_event_completed", metadata: { eventType: state.lastResult?.eventKind } });
    return { analytics };
  }

  if (command === "reaction:send") {
    if (!ALLOWED_REACTIONS.has(input.emoji)) fail(ERROR_CODES.BAD_REQUEST, "Choose an available reaction.", 422);
    const last = state.lastReactionAt[player.playerId];
    if (last && current.getTime() - new Date(last).getTime() < 800) fail(ERROR_CODES.RATE_LIMITED, "Give reactions a moment to breathe.", 429);
    state.lastReactionAt[player.playerId] = current.toISOString();
    state.reactions = [...state.reactions, {
      id: `${player.playerId}:${current.getTime()}`,
      playerId: player.playerId,
      nickname: player.nickname,
      emoji: input.emoji,
      at: current.toISOString(),
    }].slice(-20);
    return { analytics: [] };
  }
  if (command === "telemetry:record") {
    return { analytics: [{ event: input.event, metadata: { mode: state.modeKey, round: Math.max(0, state.roundIndex + 1) } }] };
  }
  return null;
};

const onRoundDeadline = ({ room, now, transition }) => {
  const state = stateFor(room);
  const current = now();
  if (state.phase === "BIDDING") {
    closeAuction({ room, state, now: current, transition });
    return { analytics: [{ event: "auction_closed", metadata: { auctionType: state.lastResult?.auctionType, round: state.roundIndex + 1, bidCount: state.lastResult?.bids?.length || 0 } }] };
  }
  if (state.phase === "LIFE_EVENT" && state.currentEvent) {
    const result = resolveEvent({ state, currentEvent: state.currentEvent, players: room.players, now: current });
    setReveal({ room, state, result: { ...result, eventKind: result.kind, kind: "LIFE_EVENT" }, now: current, transition });
    return { analytics: [{ event: "life_event_completed", metadata: { eventType: result.kind } }] };
  }
  return null;
};

const onBetweenRoundDeadline = ({ room, now, transition }) => {
  const state = stateFor(room);
  const current = now();
  if (room.status !== ROOM_STATUSES.ROUND_REVEAL) return;
  if (state.phase === "AUCTION_REVEAL") {
    const completedCount = state.roundIndex + 1;
    if (completedCount >= state.plan.lots.length) {
      finish({ room, state, now: current, transition });
      return { analytics: [{ event: "game_completed", metadata: { mode: state.modeKey, roundCount: state.plan.lots.length, playerCount: room.players.length } }] };
    }
    const eventDue = state.plan.eventRounds.includes(completedCount) && !state.handledEventRounds.includes(completedCount);
    transition(ROOM_STATUSES.BETWEEN_ROUNDS);
    transition(ROOM_STATUSES.IN_PROGRESS);
    if (eventDue) {
      state.handledEventRounds.push(completedCount);
      if (beginEvent({ room, state, now: current })) {
        return { analytics: [{ event: "life_event_triggered", metadata: { eventType: state.currentEvent.kind, round: completedCount } }] };
      }
    }
    startLot({ room, state, index: state.roundIndex + 1, now: current });
    return { analytics: [{ event: "lot_started", metadata: { auctionType: state.currentAuction.type, round: state.roundIndex + 1 } }] };
  }
  if (state.phase === "EVENT_REVEAL") {
    transition(ROOM_STATUSES.BETWEEN_ROUNDS);
    transition(ROOM_STATUSES.IN_PROGRESS);
    startLot({ room, state, index: state.roundIndex + 1, now: current });
    return { analytics: [{ event: "lot_started", metadata: { auctionType: state.currentAuction.type, round: state.roundIndex + 1 } }] };
  }
  return null;
};

const rematchRoomState = ({ room }) => {
  const next = createRoomState({ roomCode: room.roomCode, locale: room.locale, seed: `${room.roomCode}:${room.gameInstanceId}:rematch` });
  next.settings.modeKey = room.settings.modeKey || manifest.defaultMode;
  next.settings.lengthKey = room.settings.lengthKey || manifest.defaultLength;
  next.settings.startingCoins = room.settings.startingCoins || 100;
  next.settings.questionCount = LENGTH_PRESETS[next.settings.lengthKey].lotCount;
  next.gameData.state.modeKey = next.settings.modeKey;
  next.gameData.state.lengthKey = next.settings.lengthKey;
  next.gameData.state.startingCoins = next.settings.startingCoins;
  return next;
};

const createGameRecord = ({ room }) => {
  const state = stateFor(room);
  const portfolios = state.portfolios?.portfolios || [];
  const standings = [...portfolios]
    .sort((a, b) => b.items.length - a.items.length || b.coinsRemaining - a.coinsRemaining || a.nickname.localeCompare(b.nickname))
    .map((portfolio, index) => ({
      playerId: portfolio.playerId,
      nickname: portfolio.nickname,
      score: portfolio.items.length,
      rank: index + 1,
      coinsRemaining: portfolio.coinsRemaining,
      coinsSpent: portfolio.coinsSpent,
      itemCount: portfolio.items.length,
    }));
  return {
    roundCount: state.plan?.lots?.length || 0,
    standings,
    versionMetadata: { ...state.versions, modeKey: state.modeKey, lengthKey: state.lengthKey },
    summary: {
      modeKey: state.modeKey,
      lengthKey: state.lengthKey,
      startingCoins: state.startingCoins,
      completedLots: state.auctionHistory.length,
      eventCount: state.eventHistory.length,
    },
  };
};

module.exports = {
  VERSIONS,
  createGameRecord,
  createRoomState,
  executeCommand,
  listCategories,
  manifest,
  onBetweenRoundDeadline,
  onPlayerJoined,
  onPlayerRemoved,
  onRoundDeadline,
  projectState,
  rematchRoomState,
  _test: { closeAuction, consumeDiscount, finish, startLot, submitBid },
};
