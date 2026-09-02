const premiumMigration = require("../migrations/006-myjourney-premium-foundation");

const createCollection = (premiumArticles = []) => ({
  items: [{ name: "_id_", key: { _id: 1 } }],
  updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
  find: jest.fn(() => ({ toArray: jest.fn().mockResolvedValue(premiumArticles) })),
  indexes: jest.fn(async function indexes() { return this.items; }),
  createIndex: jest.fn(async function createIndex(keys, options) {
    this.items.push({ name: options.name, key: keys, ...options });
    return options.name;
  }),
  dropIndex: jest.fn().mockResolvedValue(undefined),
});

describe("MyJourney Premium migration", () => {
  test("is safe to rerun and keeps legacy content Free by default", async () => {
    const collections = new Map();
    const db = {
      collection(name) {
        if (!collections.has(name)) collections.set(name, createCollection());
        return collections.get(name);
      },
    };

    await premiumMigration.up(db);
    const firstIndexCount = [...collections.values()].reduce((sum, collection) => sum + collection.items.length, 0);
    await premiumMigration.up(db);
    const secondIndexCount = [...collections.values()].reduce((sum, collection) => sum + collection.items.length, 0);

    expect(secondIndexCount).toBe(firstIndexCount);
    expect(db.collection("articles").updateMany).toHaveBeenCalledWith(
      { accessLevel: { $exists: false } },
      { $set: { accessLevel: "free" } }
    );
    expect(db.collection("readermemberships").updateMany).toHaveBeenCalledWith(
      { plan: { $exists: false } },
      expect.objectContaining({ $set: expect.objectContaining({ plan: "free", billingStatus: "incomplete" }) })
    );
  });

  test("removes Premium bodies from discovery indexes and knowledge chunks", async () => {
    const premiumId = { toString: () => "premium-article-id" };
    const collections = new Map([["articles", createCollection([{ _id: premiumId }])]]);
    const db = {
      collection(name) {
        if (!collections.has(name)) collections.set(name, createCollection());
        return collections.get(name);
      },
    };

    await premiumMigration.up(db);

    expect(db.collection("searchindexes").updateMany).toHaveBeenCalledWith(
      { entityId: { $in: ["premium-article-id"] } },
      { $set: { accessLevel: "premium", content: "" } }
    );
    expect(db.collection("knowledgechunks").deleteMany).toHaveBeenCalledWith({ articleId: { $in: [premiumId] } });
  });
});
