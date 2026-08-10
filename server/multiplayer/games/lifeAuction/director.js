const catalog = require("./content/lots.en");
const { LENGTH_PRESETS, getMode } = require("./modes");
const { ranked, seededNumber } = require("./random");

const cloneLot = (lot) => ({
  ...lot,
  modeCompatibility: [...lot.modeCompatibility],
  tags: [...lot.tags],
  eventCompatibility: [...lot.eventCompatibility],
  portfolioTraits: [...lot.portfolioTraits],
  conflictRules: [...lot.conflictRules],
});

const compatiblePool = (modeKey) => catalog.lots.filter((lot) =>
  lot.active && (modeKey === "random-mix" || lot.modeCompatibility.includes(modeKey))
);

const scoreCandidate = ({ lot, previous, categoryCounts, mode, seed, position }) => {
  const preferred = mode.preferredCategories.includes(lot.category) ? 0.18 : 0;
  const repeatPenalty = (categoryCounts[lot.category] || 0) * 0.16;
  const adjacentPenalty = previous?.category === lot.category ? 0.5 : 0;
  const lightOpening = position === 0 && lot.depth === "LIGHT" ? 0.35 : 0;
  return seededNumber(seed, `${position}:${lot.id}`) + preferred + lightOpening - repeatPenalty - adjacentPenalty;
};

const selectSequence = ({ pool, count, mode, seed }) => {
  const selected = [];
  const used = new Set();
  const categoryCounts = {};

  for (let position = 0; position < Math.max(0, count - 1); position += 1) {
    const candidates = pool.filter((lot) => !used.has(lot.id) && !lot.finale);
    const source = candidates.length ? candidates : pool.filter((lot) => !used.has(lot.id));
    const choice = [...source].sort((a, b) => scoreCandidate({
      lot: b,
      previous: selected[selected.length - 1],
      categoryCounts,
      mode,
      seed,
      position,
    }) - scoreCandidate({
      lot: a,
      previous: selected[selected.length - 1],
      categoryCounts,
      mode,
      seed,
      position,
    }))[0];
    if (!choice) break;
    selected.push(choice);
    used.add(choice.id);
    categoryCounts[choice.category] = (categoryCounts[choice.category] || 0) + 1;
  }

  const finales = pool.filter((lot) => lot.finale && !used.has(lot.id));
  const finalChoice = ranked(finales.length ? finales : pool.filter((lot) => !used.has(lot.id)), `${seed}:finale`)[0];
  if (finalChoice) selected.push(finalChoice);
  return selected.slice(0, count);
};

const auctionTypes = ({ count, mode, seed }) => {
  const sealedCount = Math.max(1, Math.round(count * mode.auctionMix.sealed));
  const fixedCount = Math.max(1, Math.round(count * mode.auctionMix.fixed));
  const types = [
    ...Array(Math.max(0, count - sealedCount - fixedCount)).fill("OPEN_ASCENDING"),
    ...Array(sealedCount).fill("SEALED_BID"),
    ...Array(fixedCount).fill("FIXED_PRICE"),
  ];
  const arranged = ranked(types.map((type, index) => ({ id: `${type}:${index}`, type })), `${seed}:auction-types`).map((entry) => entry.type);
  if (arranged.length) arranged[0] = "OPEN_ASCENDING";
  if (count > 6 && !arranged.slice(1, -1).includes("SEALED_BID")) arranged[Math.floor(count / 2)] = "SEALED_BID";
  return arranged;
};

const eventRoundsFor = ({ count, intensity }) => {
  if (count <= 8) return [4];
  const base = count >= 20 ? [5, 10, 15] : [4, 9];
  if (intensity >= 2) return [...new Set([...base, 3, 7, 12].filter((round) => round < count))].sort((a, b) => a - b);
  return base.filter((round) => round < count);
};

const createPlan = ({ modeKey, lengthKey, seed }) => {
  const mode = getMode(modeKey);
  const length = LENGTH_PRESETS[lengthKey];
  if (!mode || !length) throw new Error("Invalid Life Auction director configuration.");
  const pool = compatiblePool(modeKey);
  const targetCount = Math.min(length.lotCount, pool.length);
  const sequence = selectSequence({ pool, count: targetCount, mode, seed });
  const types = auctionTypes({ count: sequence.length, mode, seed });
  const lots = sequence.map((source, index) => {
    const type = index === sequence.length - 1 && source.auctionType !== "FIXED_PRICE"
      ? source.auctionType
      : types[index];
    const durationSec = type === "OPEN_ASCENDING" ? 18 : type === "SEALED_BID" ? 16 : 14;
    return {
      ...cloneLot(source),
      auction: {
        type,
        startingPrice: source.basePrice,
        minimumIncrement: source.basePrice >= 10 ? 2 : 1,
        reservePrice: source.basePrice,
        visibility: type === "SEALED_BID" ? "PRIVATE_UNTIL_REVEAL" : "PUBLIC",
        bidDurationSec: durationSec,
        extensionPolicy: { ...mode.antiSniping },
        tiePolicy: mode.tiePolicy,
        winnerCount: 1,
        purchaseLimit: type === "FIXED_PRICE" ? source.purchaseLimit : 1,
        eligibility: "ALL_ACTIVE_PLAYERS",
        currencyRules: "INDIVIDUAL_WALLET_V1",
        resultStrategy: "PORTFOLIO_OWNERSHIP",
      },
    };
  });

  return {
    seed,
    modeKey,
    lengthKey,
    contentVersion: catalog.version,
    directorVersion: 1,
    lots,
    eventRounds: eventRoundsFor({ count: lots.length, intensity: mode.eventIntensity }),
  };
};

module.exports = { compatiblePool, createPlan, selectSequence };
