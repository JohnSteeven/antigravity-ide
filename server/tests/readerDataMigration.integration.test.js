const crypto = require("crypto");
const { MongoClient, ObjectId } = require("mongoose").mongo;
const migration = require("../migrations/011-reader-data-foundation");

const databaseName = `myjourney_reader_migration_${crypto.randomBytes(8).toString("hex")}_test`;
const receiptField = "_readerMigration011Merge";

describe("Migration 011 interruption recovery with isolated MongoDB", () => {
  jest.setTimeout(20000);
  let client;
  let db;
  let progress;
  let ownerId;
  let articleId;
  let winnerId;
  let anonymous;

  const clearTestDatabase = async () => {
    if (db?.databaseName !== databaseName || !/^myjourney_reader_migration_[a-f0-9]{16}_test$/.test(databaseName)) {
      throw new Error("Refusing to clear a database outside this isolated migration test.");
    }
    await db.dropDatabase();
  };

  beforeAll(async () => {
    // Deliberately independent of application/production URI configuration.
    client = new MongoClient("mongodb://127.0.0.1:27017", { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    db = client.db(databaseName);
  });

  beforeEach(async () => {
    await clearTestDatabase();
    ownerId = new ObjectId();
    articleId = new ObjectId();
    winnerId = new ObjectId();
    await db.collection("users").insertOne({
      _id: ownerId,
      profile: { savedArticles: [articleId], bookmarks: [articleId], darkMode: true, bio: "Preserve account profile" },
    });
    progress = db.collection("readingprogresses");
    anonymous = { _id: new ObjectId(), sessionId: "migration-test-anonymous", articleId, completionPercent: 35, timeSpentSeconds: 9 };
    await progress.insertMany([
      { _id: winnerId, userId: ownerId, articleId, activeReadingSeconds: 10, progressPercent: 20, lastReadAt: new Date("2026-08-04T00:00:00Z"), createdAt: new Date("2026-08-02T00:00:00Z") },
      { _id: new ObjectId(), userId: ownerId, articleId, timeSpentSeconds: 15, completionPercent: 90, scrollPositionPx: 800, isCompleted: true, completedAt: new Date("2026-08-03T00:00:00Z"), createdAt: new Date("2026-08-01T00:00:00Z") },
      { _id: new ObjectId(), userId: ownerId, articleId, timeSpentSeconds: 5, completionPercent: 40, lastReadAt: new Date("2026-08-02T00:00:00Z") },
      anonymous,
    ]);
  });

  afterAll(async () => {
    try { if (db) await clearTestDatabase(); }
    finally { await client?.close(); }
  });

  const assertRecovered = async () => {
    const rows = await progress.find({ userId: ownerId, articleId }).toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      _id: winnerId, activeReadingSeconds: 30, progressPercent: 90, furthestProgressPercent: 90,
      lastPosition: 800, isCompleted: true, completedAt: new Date("2026-08-03T00:00:00Z"),
      createdAt: new Date("2026-08-01T00:00:00Z"),
    });
    expect(rows[0][receiptField]).toBeUndefined();
    expect(rows[0].timeSpentSeconds).toBeUndefined();
    expect(await progress.findOne({ _id: anonymous._id })).toEqual(anonymous);
    const profile = await db.collection("readerprofiles").findOne({ userId: ownerId });
    expect(profile.savedArticles).toEqual([articleId]);
    expect(profile.bookmarks).toEqual([articleId]);
    expect(profile.themePreference).toBe("dark");
    expect((await db.collection("users").findOne({ _id: ownerId })).profile).toEqual({ bio: "Preserve account profile" });
    expect(await progress.indexes()).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "uniq_reader_progress_user_article", unique: true, partialFilterExpression: { userId: { $type: "objectId" } } }),
    ]));
  };

  test.each(["before-delete", "partial-delete", "after-delete", "before-receipt-clear"])("retries safely after %s", async (failurePoint) => {
    let interrupted = false;
    const faultProgress = new Proxy(progress, {
      get(target, property) {
        if (property === "deleteMany") return async (filter) => {
          if (!interrupted && failurePoint !== "before-receipt-clear") {
            interrupted = true;
            if (failurePoint === "partial-delete") await target.deleteOne({ ...filter, _id: filter._id.$in[0] });
            if (failurePoint === "after-delete") await target.deleteMany(filter);
            throw new Error("Simulated migration interruption");
          }
          return target.deleteMany(filter);
        };
        if (property === "updateOne") return async (filter, update, options) => {
          if (!interrupted && failurePoint === "before-receipt-clear" && update.$unset?.[receiptField] !== undefined) {
            interrupted = true;
            throw new Error("Simulated migration interruption");
          }
          return target.updateOne(filter, update, options);
        };
        return typeof target[property] === "function" ? target[property].bind(target) : target[property];
      },
    });
    const faultDb = { collection: (name) => name === "readingprogresses" ? faultProgress : db.collection(name) };
    await expect(migration.up(faultDb)).rejects.toThrow("Simulated migration interruption");
    const savedWinner = await progress.findOne({ _id: winnerId });
    expect(savedWinner.activeReadingSeconds).toBe(30);
    expect(savedWinner[receiptField].duplicateIds).toHaveLength(2);

    await migration.up(db);
    await assertRecovered();
    await migration.up(db);
    await assertRecovered();
  });

  test("down/up preserves merged time and does not invent missing completion dates", async () => {
    const undatedArticle = new ObjectId();
    await progress.insertOne({ userId: ownerId, articleId: undatedArticle, completionPercent: 100, timeSpentSeconds: 4, isCompleted: true });
    await migration.up(db);
    await migration.down(db);
    const rolledBack = await progress.findOne({ _id: winnerId });
    expect(rolledBack.timeSpentSeconds).toBe(30);
    expect((await db.collection("users").findOne({ _id: ownerId })).profile.savedArticles).toEqual([articleId]);
    await migration.up(db);
    await assertRecovered();
    expect((await progress.findOne({ userId: ownerId, articleId: undatedArticle })).completedAt).toBeNull();
  });
});
