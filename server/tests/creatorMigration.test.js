const migration = require("../migrations/007-creator-learn-foundation");

const collection = () => ({
  items: [{ name: "_id_", key: { _id: 1 } }],
  indexes: jest.fn(async function indexes() { return this.items; }),
  createIndex: jest.fn(async function createIndex(keys, options) { this.items.push({ key: keys, ...options }); return options.name; }),
  dropIndex: jest.fn().mockResolvedValue(undefined),
});

describe("Creator + Learn migration", () => {
  test("creates required ownership, workflow, progress, and dedupe indexes idempotently", async () => {
    const collections = new Map();
    const db = { collection(name) { if (!collections.has(name)) collections.set(name, collection()); return collections.get(name); } };
    await migration.up(db);
    const first = [...collections.values()].reduce((sum, value) => sum + value.items.length, 0);
    await migration.up(db);
    const second = [...collections.values()].reduce((sum, value) => sum + value.items.length, 0);
    expect(second).toBe(first);
    expect(collections.get("courseenrollments").items).toEqual(expect.arrayContaining([expect.objectContaining({ name: "course_enrollment_unique", unique: true })]));
    expect(collections.get("creatorengagementevents").items).toEqual(expect.arrayContaining([expect.objectContaining({ name: "creator_engagement_dedupe", unique: true })]));
    expect(collections.get("creatorprofiles").items).toEqual(expect.arrayContaining([expect.objectContaining({ name: "creator_profile_user_unique", unique: true })]));
  });
});
