const INDEXES = Object.freeze({
  creatorapplications: [
    [{ userId: 1 }, { unique: true, name: "creator_application_user_unique" }],
    [{ status: 1, submittedAt: 1 }, { name: "creator_application_review_queue" }],
  ],
  creatorprofiles: [
    [{ userId: 1 }, { unique: true, partialFilterExpression: { userId: { $type: "objectId" } }, name: "creator_profile_user_unique" }],
    [{ slug: 1 }, { unique: true, name: "creator_profile_slug_unique" }],
    [{ status: 1, isFeatured: -1, createdAt: -1 }, { name: "creator_public_directory" }],
  ],
  creatorreviewevents: [[{ applicationId: 1, occurredAt: -1 }, { name: "creator_review_history" }]],
  courses: [
    [{ slug: 1 }, { unique: true, name: "course_slug_unique" }],
    [{ creatorId: 1, workflowStatus: 1, updatedAt: -1 }, { name: "course_creator_workflow" }],
    [{ publicationStatus: 1, isFeatured: -1, publishedAt: -1 }, { name: "course_public_catalog" }],
  ],
  coursemodules: [
    [{ courseId: 1, stableKey: 1 }, { unique: true, name: "course_module_stable_key" }],
    [{ courseId: 1, order: 1 }, { name: "course_module_order" }],
  ],
  courselessons: [
    [{ courseId: 1, stableKey: 1 }, { unique: true, name: "course_lesson_stable_key" }],
    [{ courseId: 1, moduleId: 1, order: 1 }, { name: "course_lesson_order" }],
  ],
  courseenrollments: [
    [{ userId: 1, courseId: 1 }, { unique: true, name: "course_enrollment_unique" }],
    [{ userId: 1, status: 1, lastActivityAt: -1 }, { name: "course_continue_learning" }],
  ],
  learningevents: [
    [{ userId: 1, idempotencyKey: 1 }, { unique: true, name: "learning_event_dedupe" }],
    [{ userId: 1, courseId: 1, occurredAt: -1 }, { name: "learning_event_history" }],
  ],
  protectedmediaassets: [[{ creatorId: 1, status: 1, createdAt: -1 }, { name: "protected_media_creator_status" }]],
  creatorvideos: [[{ publicationStatus: 1, creatorId: 1, publishedAt: -1 }, { name: "creator_video_catalog" }]],
  podcastepisodes: [[{ publicationStatus: 1, creatorId: 1, publishedAt: -1 }, { name: "creator_podcast_catalog" }]],
  learningresources: [[{ publicationStatus: 1, creatorId: 1, publishedAt: -1 }, { name: "learning_resource_catalog" }]],
  creatorengagementevents: [
    [{ actorUserId: 1, idempotencyKey: 1 }, { unique: true, name: "creator_engagement_dedupe" }],
    [{ creatorId: 1, occurredAt: -1 }, { name: "creator_engagement_creator_time" }],
  ],
  creatoranalyticsaggregates: [[{ creatorId: 1, day: 1, contentType: 1, contentId: 1 }, { unique: true, name: "creator_analytics_daily_unique" }]],
  creatorearningperiods: [[{ creatorId: 1, periodStart: 1, periodEnd: 1 }, { unique: true, name: "creator_earning_period_unique" }]],
  creatorledgerentries: [[{ creatorId: 1, periodId: 1, createdAt: 1 }, { name: "creator_ledger_period_order" }]],
  contentreports: [
    [{ targetType: 1, targetId: 1, status: 1, createdAt: -1 }, { name: "content_report_queue" }],
    [{ openDedupeKey: 1 }, { unique: true, partialFilterExpression: { openDedupeKey: { $type: "string" } }, name: "content_report_open_unique" }],
  ],
  userfollows: [[{ followerId: 1, targetType: 1, targetId: 1 }, { unique: true, name: "user_follow_target_unique" }]],
  articles: [[{ creatorProfileId: 1, creatorWorkflowStatus: 1, updatedAt: -1 }, { name: "article_creator_workflow" }]],
});

const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const compatible = (existing, keys, options) => same(existing.key, keys)
  && Boolean(existing.unique) === Boolean(options.unique)
  && (options.partialFilterExpression === undefined || same(existing.partialFilterExpression, options.partialFilterExpression));

const ignoreMissing = (error) => error.codeName === "NamespaceNotFound" ? [] : Promise.reject(error);

module.exports = {
  version: "1.0.0",
  indexes: INDEXES,
  async up(db) {
    for (const [collectionName, specs] of Object.entries(INDEXES)) {
      const collection = db.collection(collectionName);
      const existing = await collection.indexes().catch(ignoreMissing);
      for (const [keys, options] of specs) {
        if (!existing.some((index) => compatible(index, keys, options))) await collection.createIndex(keys, options);
      }
    }
  },
  async down(db) {
    for (const [collectionName, specs] of Object.entries(INDEXES)) {
      for (const [, options] of specs) await db.collection(collectionName).dropIndex(options.name).catch(() => {});
    }
  },
};
