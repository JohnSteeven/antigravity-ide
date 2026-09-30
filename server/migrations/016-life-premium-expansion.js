const INDEXES = Object.freeze({
  lifebodyentries: [
    [{ user: 1, localDate: -1 }, { name: "life_body_user_date" }],
    [{ user: 1, occurredAt: -1 }, { name: "life_body_user_occurred" }],
    [{ user: 1, "source.provider": 1, "source.externalId": 1 }, { unique: true, partialFilterExpression: { "source.externalId": { $type: "string", $gt: "" } }, name: "life_body_source_external" }],
    [{ user: 1, dedupeKey: 1 }, { unique: true, sparse: true, name: "life_body_dedupe" }],
  ],
  lifesleepsessions: [
    [{ user: 1, localDate: -1 }, { name: "life_sleep_user_date" }],
    [{ user: 1, sleepStart: -1 }, { name: "life_sleep_user_start" }],
    [{ user: 1, "source.provider": 1, "source.externalId": 1 }, { unique: true, partialFilterExpression: { "source.externalId": { $type: "string", $gt: "" } }, name: "life_sleep_source_external" }],
    [{ user: 1, dedupeKey: 1 }, { unique: true, sparse: true, name: "life_sleep_dedupe" }],
  ],
  lifeworkoutsessions: [
    [{ user: 1, localDate: -1 }, { name: "life_workout_user_date" }],
    [{ user: 1, startedAt: -1 }, { name: "life_workout_user_start" }],
    [{ user: 1, workoutType: 1 }, { name: "life_workout_user_type" }],
    [{ user: 1, "source.provider": 1, "source.externalId": 1 }, { unique: true, partialFilterExpression: { "source.externalId": { $type: "string", $gt: "" } }, name: "life_workout_source_external" }],
    [{ user: 1, dedupeKey: 1 }, { unique: true, sparse: true, name: "life_workout_dedupe" }],
  ],
  lifenutritionentries: [
    [{ user: 1, localDate: -1, mealType: 1 }, { name: "life_nutrition_user_date_meal" }],
    [{ user: 1, occurredAt: -1 }, { name: "life_nutrition_user_occurred" }],
    [{ user: 1, "source.provider": 1, "source.externalId": 1 }, { unique: true, partialFilterExpression: { "source.externalId": { $type: "string", $gt: "" } }, name: "life_nutrition_source_external" }],
    [{ user: 1, dedupeKey: 1 }, { unique: true, sparse: true, name: "life_nutrition_dedupe" }],
  ],
  lifefinanceaccounts: [
    [{ user: 1, isArchived: 1 }, { name: "life_finance_account_user_archived" }],
    [{ user: 1, currency: 1 }, { name: "life_finance_account_user_currency" }],
  ],
  lifedailysummaries: [
    [{ user: 1, localDate: 1 }, { unique: true, name: "life_daily_summary_user_date_unique" }],
    [{ user: 1, localDate: -1 }, { name: "life_daily_summary_user_date" }],
  ],
});

module.exports = {
  version: "1.0.0",
  indexes: INDEXES,
  async up(db) {
    for (const [collectionName, indexes] of Object.entries(INDEXES)) {
      const collection = db.collection(collectionName);
      for (const [keys, options] of indexes) await collection.createIndex(keys, options);
    }
  },
  async down(db) {
    for (const [collectionName, indexes] of Object.entries(INDEXES)) {
      const collection = db.collection(collectionName);
      for (const [, options] of indexes) await collection.dropIndex(options.name).catch(() => {});
    }
  },
};
