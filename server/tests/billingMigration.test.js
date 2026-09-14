const migration = require("../migrations/012-production-billing-domain");

const createCollection = () => ({
  items: [{ name: "_id_", key: { _id: 1 } }],
  updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
  indexes: jest.fn(async function indexes() { return this.items; }),
  createIndex: jest.fn(async function createIndex(keys, options) {
    this.items.push({ name: options.name, key: keys, ...options });
    return options.name;
  }),
  dropIndex: jest.fn().mockResolvedValue(undefined),
});

describe("production billing migration", () => {
  test("is non-destructive, safe to rerun, and declares every required index", async () => {
    const collections = new Map();
    const db = { collection(name) { if (!collections.has(name)) collections.set(name, createCollection()); return collections.get(name); } };
    await migration.up(db);
    const first = [...collections.values()].reduce((count, collection) => count + collection.items.length, 0);
    await migration.up(db);
    const second = [...collections.values()].reduce((count, collection) => count + collection.items.length, 0);
    expect(second).toBe(first);
    expect(Object.keys(migration.indexes).sort()).toEqual(["billingevents", "invoices", "payments", "refunds"]);
    expect(db.collection("billingevents").updateMany).toHaveBeenCalled();
    for (const collection of collections.values()) {
      expect(collection).not.toHaveProperty("deleteMany");
    }
  });
});
