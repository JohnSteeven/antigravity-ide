"use strict";

/**
 * Migration 011 — Reader data foundation
 *
 * Moves Article library relations out of User.profile, normalizes legacy
 * ReadingProgress fields, merges competing user/article rows, and then creates
 * the partial unique index. Anonymous legacy rows are retained but are no
 * longer part of the authenticated Reader API.
 */

const PROGRESS_INDEX = [
  { userId: 1, articleId: 1 },
  {
    unique: true,
    name: "uniq_reader_progress_user_article",
    partialFilterExpression: { userId: { $type: "objectId" } },
  },
];

const INDEXES = Object.freeze({ readingprogresses: [PROGRESS_INDEX] });

const validDate = (value) => value instanceof Date && Number.isFinite(value.getTime());
const latestDate = (values) => values.filter(validDate).sort((left, right) => right - left)[0] || null;
const earliestDate = (values) => values.filter(validDate).sort((left, right) => left - right)[0] || null;
const numeric = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

const mergeProgressRows = (rows) => {
  const winner = rows[0];
  const completedRows = rows.filter((row) => row.isCompleted);
  const progressPercent = Math.min(100, Math.max(0, ...rows.flatMap((row) => [
    numeric(row.furthestProgressPercent),
    numeric(row.progressPercent),
    numeric(row.completionPercent),
  ])));
  const completedAt = earliestDate(completedRows.map((row) => row.completedAt));

  return {
    winnerId: winner._id,
    duplicateIds: rows.slice(1).map((row) => row._id),
    set: {
      progressPercent,
      furthestProgressPercent: progressPercent,
      lastPosition: Math.max(0, ...rows.map((row) => numeric(row.lastPosition ?? row.scrollPositionPx))),
      activeReadingSeconds: rows.reduce(
        (total, row) => total + Math.max(0, numeric(row.activeReadingSeconds ?? row.timeSpentSeconds)),
        0
      ),
      isCompleted: completedRows.length > 0,
      completedAt,
      completionSource: completedRows.find((row) => row.completionSource)?.completionSource
        || (completedRows.length && progressPercent >= 80 ? "auto" : null),
      lastReadAt: latestDate(rows.map((row) => row.lastReadAt)) || new Date(0),
      createdAt: earliestDate(rows.map((row) => row.createdAt)) || winner.createdAt || new Date(0),
      updatedAt: latestDate(rows.map((row) => row.updatedAt || row.lastReadAt)) || new Date(0),
    },
  };
};

const libraryUpdate = (profile = {}) => {
  const update = { $setOnInsert: {}, $unset: { notifications: "", totalReadingTimeMin: "" } };
  const arrays = {
    bookmarks: profile.bookmarks || [],
    likedArticles: profile.likedArticles || [],
    savedArticles: profile.savedArticles || [],
  };
  const addToSet = {};
  Object.entries(arrays).forEach(([field, values]) => {
    if (values.length) addToSet[field] = { $each: values };
  });
  if (Object.keys(addToSet).length) update.$addToSet = addToSet;
  if (typeof profile.darkMode === "boolean") {
    update.$set = { themePreference: profile.darkMode ? "dark" : "light" };
  }
  return update;
};

module.exports = {
  version: "1.0.0",
  indexes: INDEXES,

  async up(db) {
    const users = db.collection("users");
    const readerProfiles = db.collection("readerprofiles");
    const progress = db.collection("readingprogresses");

    const userRows = users.find(
      { profile: { $exists: true } },
      { projection: { profile: 1 } }
    );
    for await (const user of userRows) {
      const update = libraryUpdate(user.profile || {});
      update.$setOnInsert.userId = user._id;
      await readerProfiles.updateOne({ userId: user._id }, update, { upsert: true });
      await users.updateOne(
        { _id: user._id },
        {
          $unset: {
            "profile.bookmarks": "",
            "profile.likedArticles": "",
            "profile.savedArticles": "",
            "profile.comments": "",
            "profile.draftComments": "",
            "profile.replies": "",
            "profile.darkMode": "",
          },
        }
      );
    }

    const groups = progress.aggregate([
      { $match: { userId: { $type: "objectId" }, articleId: { $type: "objectId" } } },
      { $sort: { lastReadAt: -1, updatedAt: -1, _id: 1 } },
      { $group: { _id: { userId: "$userId", articleId: "$articleId" }, rows: { $push: "$$ROOT" } } },
    ]);
    for await (const group of groups) {
      const merged = mergeProgressRows(group.rows);
      await progress.updateOne(
        { _id: merged.winnerId },
        {
          $set: merged.set,
          $unset: {
            sessionId: "",
            articleSlug: "",
            scrollPositionPx: "",
            completionPercent: "",
            timeSpentSeconds: "",
            deviceType: "",
          },
        }
      );
      if (merged.duplicateIds.length) {
        await progress.deleteMany({ _id: { $in: merged.duplicateIds } });
      }
    }

    await progress.dropIndex("userId_1_articleId_1").catch((error) => {
      if (error.codeName !== "IndexNotFound" && error.code !== 27) throw error;
    });
    const indexes = await progress.indexes().catch((error) =>
      error.codeName === "NamespaceNotFound" ? [] : Promise.reject(error));
    if (!indexes.some((index) => index.name === PROGRESS_INDEX[1].name)) {
      await progress.createIndex(...PROGRESS_INDEX);
    }
  },

  async down(db) {
    const users = db.collection("users");
    const readerProfiles = db.collection("readerprofiles");
    const progress = db.collection("readingprogresses");

    await progress.dropIndex(PROGRESS_INDEX[1].name).catch(() => {});
    await progress.createIndex(
      { userId: 1, articleId: 1 },
      { name: "userId_1_articleId_1" }
    ).catch(() => {});
    await progress.updateMany(
      { userId: { $type: "objectId" }, articleId: { $type: "objectId" } },
      [{
        $set: {
          completionPercent: "$progressPercent",
          scrollPositionPx: "$lastPosition",
          timeSpentSeconds: "$activeReadingSeconds",
        },
      }]
    );

    const profiles = readerProfiles.find({}, {
      projection: { userId: 1, bookmarks: 1, likedArticles: 1, savedArticles: 1, themePreference: 1 },
    });
    for await (const profile of profiles) {
      const addToSet = {};
      ["bookmarks", "likedArticles", "savedArticles"].forEach((field) => {
        if (profile[field]?.length) addToSet[`profile.${field}`] = { $each: profile[field] };
      });
      const update = {};
      if (Object.keys(addToSet).length) update.$addToSet = addToSet;
      if (["light", "dark"].includes(profile.themePreference)) {
        update.$set = { "profile.darkMode": profile.themePreference === "dark" };
      }
      if (Object.keys(update).length) await users.updateOne({ _id: profile.userId }, update);
      await readerProfiles.updateOne(
        { _id: profile._id },
        { $unset: { bookmarks: "", likedArticles: "", savedArticles: "" } }
      );
    }
  },

  _private: { mergeProgressRows },
};
