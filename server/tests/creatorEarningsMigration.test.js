const migration = require("../migrations/014-creator-earnings-foundation");

const collection = (initial = []) => ({
  items: [{ name: "_id_", key: { _id: 1 } }, ...initial],
  indexes: jest.fn(async function indexes() { return this.items; }),
  createIndex: jest.fn(async function createIndex(keys, options) { this.items.push({ key: keys, ...options }); return options.name; }),
  dropIndex: jest.fn(async function dropIndex(name) { this.items = this.items.filter((index) => index.name !== name); }),
});

describe("Creator earnings migration", () => {
  test("replaces the legacy period identity and creates source/audit indexes idempotently", async () => {
    const collections = new Map([
      ["creatorearningperiods", collection([{ name: "creator_earning_period_unique", key: { creatorId: 1, periodStart: 1, periodEnd: 1 }, unique: true }])],
    ]);
    const db = { collection(name) { if (!collections.has(name)) collections.set(name, collection()); return collections.get(name); } };
    await migration.up(db);
    const first = [...collections.values()].reduce((sum, value) => sum + value.items.length, 0);
    await migration.up(db);
    const second = [...collections.values()].reduce((sum, value) => sum + value.items.length, 0);

    expect(second).toBe(first);
    expect(collections.get("creatorearningperiods").items).not.toEqual(expect.arrayContaining([expect.objectContaining({ name: "creator_earning_period_unique" })]));
    expect(collections.get("creatorearningperiods").items).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "creator_earning_period_currency_unique", unique: true }),
      expect.objectContaining({ name: "creator_earning_source_unique", unique: true }),
    ]));
    expect(collections.get("creatorledgerentries").items).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "creator_ledger_reference_unique", unique: true }),
      expect.objectContaining({ name: "creator_ledger_source_unique", unique: true }),
    ]));
  });
});
