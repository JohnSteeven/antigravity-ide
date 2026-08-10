const LENGTH_PRESETS = Object.freeze({
  quick: Object.freeze({ key: "quick", label: "Quick", lotCount: 8 }),
  standard: Object.freeze({ key: "standard", label: "Standard", lotCount: 15 }),
  full: Object.freeze({ key: "full", label: "Full Life", lotCount: 20 }),
});

const baseEconomy = Object.freeze({
  startingCoins: 100,
  allowDebt: false,
  maximumBalance: 1000000,
});

const mode = (definition) => Object.freeze({
  active: true,
  economy: baseEconomy,
  auctionMix: Object.freeze({ open: 0.66, sealed: 0.24, fixed: 0.1 }),
  eventIntensity: 1,
  antiSniping: Object.freeze({ enabled: true, triggerWindowSec: 3, extensionSec: 3, maximumExtensions: 2 }),
  tiePolicy: "EARLIEST_VALID_BID",
  ...definition,
});

const MODES = Object.freeze({
  "classic-life": mode({
    key: "classic-life",
    title: "Classic Life",
    emoji: "⚖️",
    description: "A balanced auction across the things people often want from life.",
    preferredCategories: ["Peace", "Love", "Money", "Health", "Freedom", "Purpose", "Travel", "Career"],
  }),
  "friends-night": mode({
    key: "friends-night",
    title: "Friends Night",
    emoji: "😂",
    description: "Lighter lots, friendly chaos and choices worth arguing about later.",
    preferredCategories: ["Funny", "Fun", "Friendship", "Travel", "Comfort", "Social Life"],
    auctionMix: Object.freeze({ open: 0.72, sealed: 0.16, fixed: 0.12 }),
  }),
  "deep-life": mode({
    key: "deep-life",
    title: "Deep Life",
    emoji: "❤️",
    description: "Reflective choices about time, peace, courage, purpose and connection.",
    preferredCategories: ["Peace", "Love", "Family", "Time", "Purpose", "Personal Growth", "Legacy"],
    auctionMix: Object.freeze({ open: 0.55, sealed: 0.38, fixed: 0.07 }),
  }),
  "money-success": mode({
    key: "money-success",
    title: "Money & Success",
    emoji: "💰",
    description: "Build the version of success you would actually spend for.",
    preferredCategories: ["Money", "Career", "Achievement", "Home", "Freedom", "Discipline"],
    auctionMix: Object.freeze({ open: 0.7, sealed: 0.22, fixed: 0.08 }),
  }),
  "dream-life": mode({
    key: "dream-life",
    title: "Dream Life",
    emoji: "🌍",
    description: "Travel, location freedom, creativity, comfort and unforgettable experiences.",
    preferredCategories: ["Travel", "Freedom", "Experiences", "Adventure", "Creativity", "Home", "Time"],
  }),
  chaos: mode({
    key: "chaos",
    title: "Chaos Mode",
    emoji: "🔥",
    description: "More events, sharper turns and a market that refuses to sit still.",
    preferredCategories: ["Funny", "Future", "Adventure", "Money", "Freedom", "Fun"],
    auctionMix: Object.freeze({ open: 0.54, sealed: 0.3, fixed: 0.16 }),
    eventIntensity: 2,
    antiSniping: Object.freeze({ enabled: true, triggerWindowSec: 3, extensionSec: 3, maximumExtensions: 3 }),
  }),
  "random-mix": mode({
    key: "random-mix",
    title: "Random Mix",
    emoji: "🎲",
    description: "A seeded mix from every compatible corner of the catalog.",
    preferredCategories: [],
    eventIntensity: 1.25,
  }),
});

const listModes = () => Object.values(MODES).filter((entry) => entry.active);
const getMode = (key) => MODES[key] || null;

module.exports = { LENGTH_PRESETS, MODES, getMode, listModes };
