const THEME_ALIASES = Object.freeze({
  Relationships: "Relationships",
  Security: "Security",
  Achievement: "Achievement",
  Freedom: "Freedom",
  Experience: "Experience",
  Experiences: "Experience",
  Growth: "Growth",
  Peace: "Peace",
  Health: "Health",
  Comfort: "Peace",
  Time: "Freedom",
  Hope: "Growth",
  Social: "Relationships",
});

const themeDistribution = (items) => {
  const totals = {};
  items.forEach((item) => {
    const traits = item.portfolioTraits?.length ? item.portfolioTraits : ["Experience"];
    const weight = item.purchasePrice / traits.length;
    traits.forEach((trait) => {
      const theme = THEME_ALIASES[trait] || "Experience";
      totals[theme] = Number(totals[theme] || 0) + weight;
    });
  });
  const total = Object.values(totals).reduce((sum, value) => sum + value, 0);
  return Object.entries(totals)
    .map(([theme, value]) => ({ theme, coins: Math.round(value), percentage: total ? Math.round((value / total) * 100) : 0 }))
    .sort((a, b) => b.coins - a.coins || a.theme.localeCompare(b.theme));
};

const summaryFor = ({ items, themes, bidCount }) => {
  if (!items.length) {
    return bidCount
      ? "Tonight you joined the bidding, but protected your Life Coins when prices moved past your choices."
      : "Tonight you kept your Life Coins close and let the auction pass. That was a strategy too.";
  }
  const leading = themes.slice(0, 2).map((theme) => theme.theme.toLocaleLowerCase("en"));
  const focus = leading.length > 1 ? `${leading[0]} and ${leading[1]}` : leading[0];
  return `Tonight your choices leaned toward ${focus}. You spent most heavily when those lots reached the stage.`;
};

const buildPortfolios = ({ players, state }) => {
  const bidCounts = {};
  let highestBid = { playerId: null, amount: 0 };
  (state.auctionHistory || []).forEach((auction) => {
    (auction.bids || []).forEach((bid) => {
      bidCounts[bid.playerId] = Number(bidCounts[bid.playerId] || 0) + 1;
      if (bid.amount > highestBid.amount) highestBid = { playerId: bid.playerId, amount: bid.amount };
    });
  });

  const portfolios = players.map((player) => {
    const items = [...(state.ownership[player.playerId] || [])];
    const wallet = state.wallets[player.playerId];
    const themes = themeDistribution(items);
    return {
      playerId: player.playerId,
      nickname: player.nickname,
      items,
      coinsRemaining: wallet.balance,
      coinsSpent: wallet.spent,
      bidCount: Number(bidCounts[player.playerId] || 0),
      themes,
      summary: summaryFor({ items, themes, bidCount: bidCounts[player.playerId] || 0 }),
    };
  });

  const by = (selector) => [...portfolios].sort((a, b) => selector(b) - selector(a) || a.nickname.localeCompare(b.nickname))[0];
  const awards = [];
  const saver = by((portfolio) => portfolio.coinsRemaining);
  const collector = by((portfolio) => portfolio.items.length);
  const bidder = by((portfolio) => portfolio.bidCount);
  if (saver) awards.push({ id: "biggest-saver", title: "Biggest Saver", icon: "🪙", playerId: saver.playerId, nickname: saver.nickname });
  if (collector) awards.push({ id: "portfolio-builder", title: "Portfolio Builder", icon: "🖼️", playerId: collector.playerId, nickname: collector.nickname });
  if (bidder?.bidCount) awards.push({ id: "boldest-bidder", title: "Boldest Bidder", icon: "🔥", playerId: bidder.playerId, nickname: bidder.nickname });
  if (highestBid.playerId) {
    const player = players.find((entry) => entry.playerId === highestBid.playerId);
    awards.push({ id: "biggest-moment", title: "Biggest Single Bid", icon: "🎯", playerId: highestBid.playerId, nickname: player?.nickname || "Player", value: highestBid.amount });
  }
  return { portfolios, awards: awards.slice(0, 4) };
};

module.exports = { buildPortfolios, themeDistribution };
