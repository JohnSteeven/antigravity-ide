const { seededRank } = require("./random");

const AUCTION_TYPES = Object.freeze({
  OPEN_ASCENDING: "OPEN_ASCENDING",
  SEALED_BID: "SEALED_BID",
  FIXED_PRICE: "FIXED_PRICE",
  DUTCH: "DUTCH",
});

const minimumOpenBid = (auction) => auction.highestBid
  ? auction.highestBid.amount + auction.minimumIncrement
  : auction.startingPrice;

const rankSealedBids = ({ bids, seed, lotId }) => [...bids].sort((a, b) =>
  b.amount - a.amount ||
  new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime() ||
  seededRank(seed, `${lotId}:${a.playerId}`).localeCompare(seededRank(seed, `${lotId}:${b.playerId}`))
);

const createAuction = ({ lot, now, state }) => {
  const priceDelta = Number(state.modifiers?.nextStartingPriceDelta || 0);
  const durationDelta = Number(state.modifiers?.nextDurationDeltaSec || 0);
  state.modifiers = {};
  const startingPrice = Math.max(1, lot.auction.startingPrice + priceDelta);
  const durationSec = Math.max(8, lot.auction.bidDurationSec + durationDelta);
  return {
    lotId: lot.id,
    type: lot.auction.type,
    startingPrice,
    minimumIncrement: lot.auction.minimumIncrement,
    reservePrice: Math.max(1, lot.auction.reservePrice + priceDelta),
    visibility: lot.auction.visibility,
    tiePolicy: lot.auction.tiePolicy,
    winnerCount: lot.auction.winnerCount,
    purchaseLimit: lot.auction.purchaseLimit,
    extensionPolicy: { ...lot.auction.extensionPolicy },
    extensionCount: 0,
    startedAt: now.toISOString(),
    deadline: new Date(now.getTime() + durationSec * 1000).toISOString(),
    highestBid: null,
    sealedBids: {},
    purchases: [],
    bidHistory: [],
  };
};

module.exports = { AUCTION_TYPES, createAuction, minimumOpenBid, rankSealedBids };
