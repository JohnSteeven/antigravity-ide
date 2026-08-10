module.exports = {
  name: "003-life-auction-content-packs",
  version: "1.0.0",

  async up(db) {
    const packs = db.collection("lifeauctioncontentpacks");
    await packs.createIndex({ key: 1, locale: 1, version: 1 }, { unique: true, name: "life_auction_pack_version" });
    await packs.createIndex({ kind: 1, locale: 1, status: 1, version: -1 }, { name: "life_auction_published_packs" });
  },

  async down(db) {
    const packs = db.collection("lifeauctioncontentpacks");
    for (const name of ["life_auction_pack_version", "life_auction_published_packs"]) {
      try {
        await packs.dropIndex(name);
      } catch (error) {
        if (error.codeName !== "IndexNotFound") throw error;
      }
    }
  },
};
