const crypto = require("crypto");

const digest = (seed, value) => crypto.createHash("sha256").update(`${seed}:${value}`).digest();
const seededNumber = (seed, value) => digest(seed, value).readUInt32BE(0) / 0xffffffff;
const seededRank = (seed, value) => digest(seed, value).toString("hex");

const ranked = (items, seed, idFor = (item) => item.id) => [...items]
  .map((item) => ({ item, rank: seededRank(seed, idFor(item)) }))
  .sort((a, b) => a.rank.localeCompare(b.rank))
  .map(({ item }) => item);

module.exports = { ranked, seededNumber, seededRank };
