const INDEXES = Object.freeze({
  creatorpoolcalculations: [
    [{ periodStart: 1, periodEnd: 1, currency: 1, policyVersion: 1 }, { unique: true, name: "creator_pool_period_currency_policy_unique" }],
    [{ status: 1, periodEnd: -1, currency: 1 }, { name: "creator_pool_status_period" }],
  ],
  creatorearningperiods: [
    [{ creatorId: 1, periodStart: 1, periodEnd: 1, currency: 1 }, { unique: true, partialFilterExpression: { currency: { $type: "string" } }, name: "creator_earning_period_currency_unique" }],
    [{ creatorId: 1, sourceCalculationId: 1 }, { unique: true, partialFilterExpression: { sourceCalculationId: { $type: "objectId" } }, name: "creator_earning_source_unique" }],
    [{ status: 1, periodEnd: -1, currency: 1 }, { name: "creator_earning_admin_report" }],
  ],
  creatorledgerentries: [
    [{ reference: 1 }, { unique: true, name: "creator_ledger_reference_unique" }],
    [{ creatorId: 1, sourceCalculationId: 1, type: 1 }, { unique: true, partialFilterExpression: { sourceCalculationId: { $type: "objectId" } }, name: "creator_ledger_source_unique" }],
    [{ creatorId: 1, status: 1, currency: 1, periodEnd: -1 }, { name: "creator_ledger_earnings_report" }],
  ],
});

const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const compatible = (index, keys, options) => same(index.key, keys)
  && Boolean(index.unique) === Boolean(options.unique)
  && (options.partialFilterExpression === undefined || same(index.partialFilterExpression, options.partialFilterExpression));
const ignoreMissing = (error) => error.codeName === "NamespaceNotFound" ? [] : Promise.reject(error);

const createMissingIndexes = async (collection, specs) => {
  const existing = await collection.indexes().catch(ignoreMissing);
  for (const [keys, options] of specs) {
    if (!existing.some((index) => compatible(index, keys, options))) await collection.createIndex(keys, options);
  }
};

module.exports = {
  version: "1.0.0",
  indexes: INDEXES,
  async up(db) {
    const periods = db.collection("creatorearningperiods");
    await createMissingIndexes(periods, INDEXES.creatorearningperiods);

    const legacyKeys = { creatorId: 1, periodStart: 1, periodEnd: 1 };
    const existingPeriodIndexes = await periods.indexes().catch(ignoreMissing);
    for (const index of existingPeriodIndexes.filter((item) => same(item.key, legacyKeys))) {
      await periods.dropIndex(index.name);
    }

    await createMissingIndexes(db.collection("creatorpoolcalculations"), INDEXES.creatorpoolcalculations);
    await createMissingIndexes(db.collection("creatorledgerentries"), INDEXES.creatorledgerentries);
  },
  async down(db) {
    for (const [collectionName, specs] of Object.entries(INDEXES)) {
      for (const [, options] of specs) await db.collection(collectionName).dropIndex(options.name).catch(() => {});
    }
    await db.collection("creatorearningperiods").createIndex(
      { creatorId: 1, periodStart: 1, periodEnd: 1 },
      { unique: true, name: "creator_earning_period_unique" }
    );
  },
};
