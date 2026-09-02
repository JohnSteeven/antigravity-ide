"use strict";

/**
 * Migration 009 — auth session expiry
 *
 * Session creation has always calculated the refresh-token expiry, but the
 * legacy Session schema discarded that field in strict mode. Backfill the
 * exact expiry from the linked RefreshToken where possible. Orphaned or
 * malformed legacy sessions fail closed: they are made inactive and expire at
 * the Unix epoch instead of receiving a fabricated future lifetime.
 */

const INDEXES = Object.freeze({
  sessions: [
    [{ expiresAt: 1 }, { expireAfterSeconds: 0, name: "expiresAt_1" }],
    [
      { user: 1, isActive: 1, expiresAt: -1 },
      { name: "user_1_isActive_1_expiresAt_-1" },
    ],
  ],
});

const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const compatible = (existing, keys, options) =>
  same(existing.key, keys)
  && Boolean(existing.unique) === Boolean(options.unique)
  && Boolean(existing.sparse) === Boolean(options.sparse)
  && (options.expireAfterSeconds === undefined
    || existing.expireAfterSeconds === options.expireAfterSeconds);

const missingOrInvalidExpiry = {
  $nor: [{ expiresAt: { $type: "date" } }],
};

const flush = async (collection, operations) => {
  if (!operations.length) return;
  const batch = operations.splice(0, operations.length);
  await collection.bulkWrite(batch, { ordered: false });
};

module.exports = {
  version: "1.0.0",
  indexes: INDEXES,

  async up(db) {
    const sessions = db.collection("sessions");
    const rows = sessions.aggregate([
      { $match: missingOrInvalidExpiry },
      {
        $set: {
          _refreshTokenObjectId: {
            $convert: {
              input: "$refreshToken",
              to: "objectId",
              onError: null,
              onNull: null,
            },
          },
        },
      },
      {
        $lookup: {
          from: "refreshtokens",
          localField: "_refreshTokenObjectId",
          foreignField: "_id",
          as: "_refreshToken",
        },
      },
      {
        $project: {
          refreshExpiresAt: { $arrayElemAt: ["$_refreshToken.expiresAt", 0] },
        },
      },
    ]);

    const migrationStartedAt = new Date();
    const operations = [];
    for await (const row of rows) {
      const linkedExpiry = row.refreshExpiresAt instanceof Date
        && Number.isFinite(row.refreshExpiresAt.getTime())
        ? row.refreshExpiresAt
        : null;
      const isExpired = !linkedExpiry || linkedExpiry <= migrationStartedAt;
      operations.push({
        updateOne: {
          filter: { _id: row._id, ...missingOrInvalidExpiry },
          update: {
            $set: {
              expiresAt: linkedExpiry || new Date(0),
              ...(isExpired ? { isActive: false } : {}),
            },
          },
        },
      });
      if (operations.length >= 500) await flush(sessions, operations);
    }
    await flush(sessions, operations);

    for (const [collectionName, specs] of Object.entries(INDEXES)) {
      const collection = db.collection(collectionName);
      const existing = await collection.indexes().catch((error) =>
        error.codeName === "NamespaceNotFound" ? [] : Promise.reject(error));
      for (const [keys, options] of specs) {
        if (!existing.some((index) => compatible(index, keys, options))) {
          await collection.createIndex(keys, options);
        }
      }
    }
  },

  async down(db) {
    for (const [collectionName, specs] of Object.entries(INDEXES)) {
      for (const [, options] of specs) {
        await db.collection(collectionName).dropIndex(options.name).catch(() => {});
      }
    }
    // expiresAt backfills are valid data and intentionally remain on rollback.
  },
};
