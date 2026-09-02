const { availableBalance, credit, penalize, spendAvailable, transfer, walletFor } = require("./economy");
const { ranked } = require("./random");

const event = (definition) => Object.freeze({
  version: 1,
  locale: "en",
  active: true,
  modes: ["classic-life", "friends-night", "deep-life", "money-success", "dream-life", "chaos", "random-mix"],
  choices: [],
  negative: false,
  ...definition,
});

const EVENTS = Object.freeze([
  event({
    id: "smart-decision",
    kind: "BONUS",
    title: "A Lucky Break",
    description: "You made an unexpectedly smart fictional life decision. Everyone receives 8 Life Coins.",
    icon: "✨",
  }),
  event({
    id: "life-happened",
    kind: "EXPENSE",
    title: "Life Happened",
    description: "An ordinary surprise expense costs everyone up to 5 available Life Coins.",
    icon: "🌧️",
    negative: true,
    modes: ["classic-life", "money-success", "chaos", "random-mix"],
  }),
  event({
    id: "future-or-now",
    kind: "OPPORTUNITY",
    title: "An Opportunity Appears",
    description: "Choose a small boost now or protect a little value for a future win.",
    icon: "🚪",
    choices: [
      { id: "coins-now", label: "Take 10 Life Coins now" },
      { id: "future-discount", label: "Save a 5-coin auction discount" },
    ],
  }),
  event({
    id: "friend-needs-help",
    kind: "GIFT",
    title: "A Friend Could Use a Hand",
    description: "You may give another player 5 Life Coins. Giving is completely optional.",
    icon: "🫶",
    choices: [
      { id: "gift", label: "Give 5 Life Coins" },
      { id: "skip", label: "Skip" },
    ],
    modes: ["friends-night", "deep-life", "chaos", "random-mix"],
  }),
  event({
    id: "shared-trip",
    kind: "GROUP_GOAL",
    title: "The Group Must Decide",
    description: "Contribute voluntarily. Reach 30 Life Coins together to create One Unforgettable Trip Together.",
    icon: "🚌",
    choices: [
      { id: "contribute-0", label: "Contribute 0", amount: 0 },
      { id: "contribute-5", label: "Contribute 5", amount: 5 },
      { id: "contribute-10", label: "Contribute 10", amount: 10 },
    ],
    modes: ["friends-night", "dream-life", "chaos", "random-mix"],
  }),
  event({
    id: "market-shift",
    kind: "MARKET_SHIFT",
    title: "The Market Shifts",
    description: "The next starting price drops by 3 Life Coins for everyone.",
    icon: "📉",
    modes: ["money-success", "chaos", "random-mix"],
  }),
  event({
    id: "time-pressure",
    kind: "TIME_PRESSURE",
    title: "Time Speeds Up",
    description: "The next auction will be five seconds shorter. The server still owns the deadline.",
    icon: "⏱️",
    modes: ["friends-night", "chaos", "random-mix"],
  }),
  event({
    id: "small-reflection",
    kind: "REFLECTION",
    title: "A Quiet Question",
    description: "When resources get scarce, what have you been protecting most tonight?",
    icon: "💭",
    choices: [
      { id: "connection", label: "Connection" },
      { id: "freedom", label: "Freedom" },
      { id: "security", label: "Security" },
      { id: "experience", label: "Experience" },
    ],
    modes: ["classic-life", "deep-life", "dream-life", "random-mix"],
  }),
]);

const selectEvent = ({ state, modeKey, allowGroupEvents = true }) => {
  const seen = new Set((state.eventHistory || []).map((entry) => entry.eventId));
  const negativeCounts = state.eventFairness?.negativeCounts || {};
  let candidates = EVENTS.filter((entry) => entry.active && entry.modes.includes(modeKey) && !seen.has(entry.id) && (allowGroupEvents || entry.kind !== "GROUP_GOAL"));
  if (Object.values(negativeCounts).some((count) => count >= 2)) {
    candidates = candidates.filter((entry) => !entry.negative);
  }
  if (!candidates.length) candidates = EVENTS.filter((entry) => entry.active && entry.modes.includes(modeKey) && !entry.negative && (allowGroupEvents || entry.kind !== "GROUP_GOAL"));
  return ranked(candidates, `${state.seed}:event:${state.eventHistory?.length || 0}`)[0];
};

const startEvent = ({ state, players, modeKey, now, allowGroupEvents = true }) => {
  const definition = selectEvent({ state, modeKey, allowGroupEvents });
  if (!definition) return null;
  const needsChoice = definition.choices.length > 0;
  return {
    id: `${definition.id}:${state.eventHistory?.length || 0}`,
    eventId: definition.id,
    version: definition.version,
    kind: definition.kind,
    title: definition.title,
    description: definition.description,
    icon: definition.icon,
    choices: definition.choices.map((choice) => ({ ...choice })),
    choiceRequired: needsChoice,
    submittedPlayerIds: [],
    privateChoices: {},
    eligiblePlayerIds: players.map((player) => player.playerId),
    startedAt: now.toISOString(),
    deadline: new Date(now.getTime() + (needsChoice ? 16000 : 6000)).toISOString(),
  };
};

const submitEventChoice = ({ state, currentEvent, playerId, choiceId, targetPlayerId }) => {
  if (!currentEvent.choiceRequired) {
    const error = new Error("This Life Event does not need a choice.");
    error.code = "MULTIPLAYER_INVALID_ACTION";
    error.status = 409;
    throw error;
  }
  if (currentEvent.privateChoices[playerId]) {
    const error = new Error("Your Life Event choice is already locked in.");
    error.code = "MULTIPLAYER_DUPLICATE_ACTION";
    error.status = 409;
    throw error;
  }
  const choice = currentEvent.choices.find((entry) => entry.id === choiceId);
  if (!choice) {
    const error = new Error("Choose a valid Life Event option.");
    error.code = "MULTIPLAYER_BAD_REQUEST";
    error.status = 422;
    throw error;
  }
  if (currentEvent.kind === "GIFT" && choiceId === "gift") {
    if (!currentEvent.eligiblePlayerIds.includes(targetPlayerId) || targetPlayerId === playerId) {
      const error = new Error("Choose another player in this party for the gift.");
      error.code = "MULTIPLAYER_BAD_REQUEST";
      error.status = 422;
      throw error;
    }
    if (availableBalance(walletFor(state, playerId)) < 5) {
      const error = new Error("You need 5 available Life Coins to choose the gift.");
      error.code = "MULTIPLAYER_INVALID_ACTION";
      error.status = 409;
      throw error;
    }
  }
  if (currentEvent.kind === "GROUP_GOAL" && availableBalance(walletFor(state, playerId)) < Number(choice.amount || 0)) {
    const error = new Error("You do not have enough available Life Coins for that contribution.");
    error.code = "MULTIPLAYER_INVALID_ACTION";
    error.status = 409;
    throw error;
  }
  currentEvent.privateChoices[playerId] = { choiceId, ...(targetPlayerId ? { targetPlayerId } : {}) };
  currentEvent.submittedPlayerIds.push(playerId);
};

const resolveEvent = ({ state, currentEvent, players, now }) => {
  const choices = currentEvent.privateChoices || {};
  const metadata = { eventId: currentEvent.eventId };
  const result = { eventId: currentEvent.eventId, kind: currentEvent.kind, title: currentEvent.title, icon: currentEvent.icon };
  state.playerEffects = state.playerEffects || {};
  state.eventFairness = state.eventFairness || { negativeCounts: {} };

  if (currentEvent.kind === "BONUS") {
    players.forEach((player) => credit(state, player.playerId, 8, metadata, now));
    result.summary = "Everyone received 8 Life Coins.";
  } else if (currentEvent.kind === "EXPENSE") {
    players.forEach((player) => {
      penalize(state, player.playerId, 5, metadata, now);
      state.eventFairness.negativeCounts[player.playerId] = Number(state.eventFairness.negativeCounts[player.playerId] || 0) + 1;
    });
    result.summary = "Everyone paid up to 5 available Life Coins.";
  } else if (currentEvent.kind === "OPPORTUNITY") {
    const counts = { "coins-now": 0, "future-discount": 0 };
    players.forEach((player) => {
      const choiceId = choices[player.playerId]?.choiceId || "coins-now";
      counts[choiceId] += 1;
      if (choiceId === "future-discount") {
        state.playerEffects[player.playerId] = { ...(state.playerEffects[player.playerId] || {}), nextDiscount: 5 };
      } else credit(state, player.playerId, 10, metadata, now);
    });
    result.summary = `${counts["coins-now"]} chose coins now; ${counts["future-discount"]} saved a discount.`;
    result.choiceCounts = counts;
  } else if (currentEvent.kind === "GIFT") {
    let gifts = 0;
    players.forEach((player) => {
      const choice = choices[player.playerId];
      if (choice?.choiceId === "gift") {
        try {
          transfer(state, player.playerId, choice.targetPlayerId, 5, metadata, now);
          gifts += 1;
        } catch (error) {
          // A stale optional gift fails safely without invalidating the whole event.
        }
      }
    });
    result.summary = gifts ? `${gifts} voluntary gift${gifts === 1 ? " was" : "s were"} shared.` : "The group chose to keep their coins this time.";
  } else if (currentEvent.kind === "GROUP_GOAL") {
    const contributions = players.map((player) => {
      const selected = currentEvent.choices.find((choice) => choice.id === choices[player.playerId]?.choiceId);
      return { playerId: player.playerId, amount: Number(selected?.amount || 0) };
    });
    const total = contributions.reduce((sum, entry) => sum + entry.amount, 0);
    const unlocked = total >= 30;
    if (unlocked) {
      contributions.filter((entry) => entry.amount > 0).forEach((entry) => {
        spendAvailable(state, entry.playerId, entry.amount, metadata, now);
        state.ownership[entry.playerId].push({
          lotId: `group-memory:${currentEvent.id}`,
          title: "One Unforgettable Trip Together",
          category: "Experiences",
          icon: "🚌",
          purchasePrice: entry.amount,
          portfolioTraits: ["Experience", "Relationships"],
          shared: true,
        });
      });
    }
    result.summary = unlocked ? `The group contributed ${total} and unlocked the shared trip.` : `The group reached ${total}; no coins were charged.`;
    result.totalContribution = total;
    result.unlocked = unlocked;
  } else if (currentEvent.kind === "MARKET_SHIFT") {
    state.modifiers = { ...(state.modifiers || {}), nextStartingPriceDelta: -3 };
    result.summary = "The next lot will start 3 Life Coins lower.";
  } else if (currentEvent.kind === "TIME_PRESSURE") {
    state.modifiers = { ...(state.modifiers || {}), nextDurationDeltaSec: -5 };
    result.summary = "The next auction will be five seconds shorter.";
  } else {
    const counts = {};
    Object.values(choices).forEach((choice) => { counts[choice.choiceId] = Number(counts[choice.choiceId] || 0) + 1; });
    result.summary = "A reflection only—no wallets changed.";
    result.choiceCounts = counts;
  }

  state.eventHistory = [...(state.eventHistory || []), { eventId: currentEvent.eventId, kind: currentEvent.kind, at: now.toISOString() }].slice(-30);
  return result;
};

module.exports = { EVENTS, resolveEvent, selectEvent, startEvent, submitEventChoice };
