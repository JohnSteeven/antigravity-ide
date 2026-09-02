const INDEXES = Object.freeze({
  lifepushsubscriptions: [
    [{ endpoint: 1 }, { unique: true, name: "life_push_endpoint_unique" }],
    [{ user: 1, status: 1, updatedAt: -1 }, { name: "life_push_user_status" }],
  ],
  lifeimportbatches: [
    [{ user: 1, kind: 1, status: 1, createdAt: -1 }, { name: "life_import_user_status" }],
    [{ expiresAt: 1 }, { expireAfterSeconds: 0, name: "life_import_expiry" }],
  ],
  lifeinsightpreferences: [[{ user: 1, type: 1 }, { unique: true, name: "life_insight_preference_unique" }]],
  lifetasks: [[{ user: 1, clientMutationId: 1 }, { unique: true, sparse: true, name: "life_task_client_mutation" }]],
  lifejournalentries: [
    [{ user: 1, dedupeKey: 1 }, { unique: true, sparse: true, name: "life_journal_dedupe" }],
    [{ user: 1, deletedAt: 1, localDate: -1 }, { name: "life_journal_private_search_scope" }],
  ],
  lifehealthentries: [
    [{ user: 1, dedupeKey: 1 }, { unique: true, sparse: true, name: "life_health_dedupe" }],
    [{ user: 1, "source.provider": 1, "source.externalId": 1 }, { unique: true, partialFilterExpression: { "source.externalId": { $type: "string", $gt: "" } }, name: "life_health_source_unique" }],
  ],
  lifefinanceentries: [
    [{ user: 1, dedupeKey: 1 }, { unique: true, sparse: true, name: "life_finance_dedupe" }],
    [{ user: 1, "source.provider": 1, "source.externalId": 1 }, { unique: true, partialFilterExpression: { "source.externalId": { $type: "string", $gt: "" } }, name: "life_finance_source_unique" }],
  ],
  notifications: [[{ user: 1, source: 1, createdAt: -1 }, { name: "notification_user_source" }]],
  lifefinanceplans: [[{ user: 1, status: 1, dueDate: 1 }, { name: "life_finance_upcoming_due" }]],
});

const sameKeys = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const compatibleIndex = (existing, keys, options) => sameKeys(existing.key, keys)
  && Boolean(existing.unique) === Boolean(options.unique)
  && Boolean(existing.sparse) === Boolean(options.sparse)
  && (options.expireAfterSeconds === undefined || existing.expireAfterSeconds === options.expireAfterSeconds);

module.exports = {
  version: "2.0.0",
  indexes: INDEXES,
  async up(db) {
    for (const [collectionName, indexes] of Object.entries(INDEXES)) {
      const collection = db.collection(collectionName);
      const existing = await collection.indexes().catch((error) => error.codeName === "NamespaceNotFound" ? [] : Promise.reject(error));
      for (const [keys, options] of indexes) {
        if (!existing.some((index) => compatibleIndex(index, keys, options))) await collection.createIndex(keys, options);
      }
    }
  },
  async down(db) {
    for (const [collectionName, indexes] of Object.entries(INDEXES)) {
      for (const [, options] of indexes) await db.collection(collectionName).dropIndex(options.name).catch(() => {});
    }
  },
};
