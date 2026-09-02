const migration = require("../migrations/011-reader-data-foundation");

const asyncRows = (rows) => ({
  async *[Symbol.asyncIterator]() {
    for (const row of rows) yield row;
  },
});

describe("Reader data foundation migration", () => {
  test("merges competing progress without losing furthest progress, time, or completion", () => {
    const createdEarlier = new Date("2026-08-01T00:00:00Z");
    const completedAt = new Date("2026-08-03T00:00:00Z");
    const merged = migration._private.mergeProgressRows([
      { _id: "newer", progressPercent: 30, activeReadingSeconds: 10, lastPosition: 100, lastReadAt: new Date("2026-08-04T00:00:00Z"), createdAt: new Date("2026-08-02T00:00:00Z") },
      { _id: "older", completionPercent: 90, timeSpentSeconds: 20, scrollPositionPx: 800, isCompleted: true, completedAt, createdAt: createdEarlier },
    ]);

    expect(merged.winnerId).toBe("newer");
    expect(merged.duplicateIds).toEqual(["older"]);
    expect(merged.set).toMatchObject({
      progressPercent: 90,
      furthestProgressPercent: 90,
      lastPosition: 800,
      activeReadingSeconds: 30,
      isCompleted: true,
      completedAt,
      completionSource: "auto",
      createdAt: createdEarlier,
    });
  });

  test("moves Reader library state, deletes duplicates, and creates the unique partial index", async () => {
    const users = {
      find: jest.fn(() => asyncRows([{ _id: "user-1", profile: { savedArticles: ["article-1"], comments: [{ text: "legacy" }] } }])),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    const readerProfiles = { updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }) };
    const progress = {
      aggregate: jest.fn(() => asyncRows([{ _id: {}, rows: [{ _id: "keep", userId: "user-1", articleId: "article-1", completionPercent: 20 }, { _id: "drop", userId: "user-1", articleId: "article-1", completionPercent: 40 }] }])),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      dropIndex: jest.fn().mockRejectedValue({ codeName: "IndexNotFound" }),
      indexes: jest.fn().mockResolvedValue([{ name: "_id_", key: { _id: 1 } }]),
      createIndex: jest.fn().mockResolvedValue("uniq_reader_progress_user_article"),
    };
    const collections = { users, readerprofiles: readerProfiles, readingprogresses: progress };
    await migration.up({ collection: (name) => collections[name] });

    expect(readerProfiles.updateOne).toHaveBeenCalledWith(
      { userId: "user-1" },
      expect.objectContaining({ $addToSet: { savedArticles: { $each: ["article-1"] } } }),
      { upsert: true }
    );
    expect(users.updateOne).toHaveBeenCalledWith(
      { _id: "user-1" },
      { $unset: expect.objectContaining({ "profile.comments": "", "profile.savedArticles": "" }) }
    );
    expect(progress.deleteMany).toHaveBeenCalledWith({ _id: { $in: ["drop"] } });
    expect(progress.createIndex).toHaveBeenCalledWith(
      { userId: 1, articleId: 1 },
      expect.objectContaining({ unique: true, partialFilterExpression: { userId: { $type: "objectId" } } })
    );
  });
});
