const INDEXES = Object.freeze({
  lifeprofiles: [[{ user: 1 }, { unique: true, name: "life_profile_user_unique" }]],
  lifehabits: [[{ user: 1, status: 1, createdAt: -1 }, { name: "life_habit_user_status" }]],
  lifemedications: [[{ user: 1, status: 1, createdAt: -1 }, { name: "life_medication_user_status" }]],
  lifescheduleversions: [
    [{ user: 1, itemType: 1, itemId: 1, version: 1 }, { unique: true, name: "life_schedule_version_unique" }],
    [{ user: 1, itemType: 1, effectiveFrom: 1, effectiveTo: 1 }, { name: "life_schedule_effective_range" }],
  ],
  lifeevents: [
    [{ user: 1, idempotencyKey: 1 }, { unique: true, name: "life_event_idempotency" }],
    [{ user: 1, itemType: 1, itemId: 1, scheduledDate: 1, occurrenceKey: 1, occurredAt: -1 }, { name: "life_event_occurrence_history" }],
    [{ user: 1, occurredAt: -1 }, { name: "life_event_user_timeline" }],
  ],
  lifehealthentries: [[{ user: 1, localDate: 1, type: 1 }, { name: "life_health_user_date_type" }]],
  lifefinanceentries: [[{ user: 1, localDate: 1, type: 1 }, { name: "life_finance_user_date_type" }]],
  lifejournalentries: [[{ user: 1, localDate: -1, type: 1 }, { name: "life_journal_user_date_type" }]],
  lifenotificationjobs: [[{ state: 1, dueAt: 1, nextAttemptAt: 1 }, { name: "life_notification_due_jobs" }]],
  lifenotificationdeliveries: [[{ user: 1, attemptedAt: -1 }, { name: "life_notification_delivery_history" }]],
});

module.exports = {
  version: "1.0.0",
  async up(db) {
    for (const [collectionName, indexes] of Object.entries(INDEXES)) {
      const collection = db.collection(collectionName);
      for (const [keys, options] of indexes) await collection.createIndex(keys, options);
    }
  },
  async down(db) {
    // Rollback removes only indexes created by this migration. It never drops
    // private Life data or collections.
    for (const [collectionName, indexes] of Object.entries(INDEXES)) {
      const collection = db.collection(collectionName);
      for (const [, options] of indexes) await collection.dropIndex(options.name).catch(() => {});
    }
  },
};
