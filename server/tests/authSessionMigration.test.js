const migration = require("../migrations/009-auth-session-expiry");

const asyncRows = (rows) => ({
  async *[Symbol.asyncIterator]() {
    for (const row of rows) yield row;
  },
});

const createCollection = (rows = []) => ({
  items: [{ name: "_id_", key: { _id: 1 } }],
  aggregate: jest.fn(() => asyncRows(rows)),
  bulkWrite: jest.fn().mockResolvedValue({ modifiedCount: rows.length }),
  indexes: jest.fn(async function indexes() { return this.items; }),
  createIndex: jest.fn(async function createIndex(keys, options) {
    this.items.push({ key: keys, ...options });
    return options.name;
  }),
  dropIndex: jest.fn().mockResolvedValue(undefined),
});

describe("auth session expiry migration", () => {
  test("backfills linked expiries, fails orphan sessions closed, and is idempotent", async () => {
    const future = new Date(Date.now() + 60_000);
    const sessions = createCollection([
      { _id: "linked", refreshExpiresAt: future },
      { _id: "orphan" },
    ]);
    const collections = new Map([["sessions", sessions]]);
    const db = {
      collection(name) {
        if (!collections.has(name)) collections.set(name, createCollection());
        return collections.get(name);
      },
    };

    await migration.up(db);
    const firstIndexCount = sessions.items.length;
    await migration.up(db);

    expect(sessions.items).toHaveLength(firstIndexCount);
    expect(sessions.bulkWrite).toHaveBeenCalledWith([
      expect.objectContaining({
        updateOne: expect.objectContaining({
          update: { $set: { expiresAt: future } },
        }),
      }),
      expect.objectContaining({
        updateOne: expect.objectContaining({
          update: { $set: { expiresAt: new Date(0), isActive: false } },
        }),
      }),
    ], { ordered: false });
    expect(sessions.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "expiresAt_1", expireAfterSeconds: 0 }),
      expect.objectContaining({ name: "user_1_isActive_1_expiresAt_-1" }),
    ]));
  });
});
