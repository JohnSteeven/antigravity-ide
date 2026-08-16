const crypto = require("crypto");
const { z } = require("zod");
const Article = require("../../models/Article");
const Course = require("../../models/Course");
const CourseEnrollment = require("../../models/CourseEnrollment");
const CourseLesson = require("../../models/CourseLesson");
const LifeEvent = require("../../life/models/LifeEvent");
const User = require("../../models/User");
const directoryService = require("../../creators/directoryService");
const { escapeRegex } = require("../../creators/utils");
const courseService = require("../../learn/courseService");
const eventService = require("../../life/services/eventService");
const habitService = require("../../life/services/habitService");
const lifeDataService = require("../../life/services/lifeDataService");
const todayService = require("../../life/services/todayService");
const entitlementService = require("../../services/entitlementService");
const KnowledgeSearchService = require("../../services/knowledgeSearchService");
const { ENTITLEMENTS } = require("../../premium/catalog");
const { PERMISSIONS } = require("./permissionService");

const idString = (value) => String(value?._id || value?.id || value || "");
const compact = (value, max = 500) => String(value || "").trim().slice(0, max);
const strictEmpty = z.object({}).strict();
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const output = z.unknown();

const projectTimeline = (today) => Object.values(today.timeline?.groups || {})
  .flat()
  .slice(0, 60)
  .map((item) => ({
    id: compact(item.id, 160),
    itemId: compact(item.itemId, 80),
    type: item.type,
    title: compact(item.title, 180),
    period: item.period,
    scheduledTime: item.scheduledTime || "",
    scheduledFor: item.scheduledFor || null,
    status: item.status,
    priority: item.priority || null,
  }));

const projectEnrollment = (enrollment) => ({
  id: idString(enrollment),
  course: enrollment.courseId ? {
    id: idString(enrollment.courseId),
    title: compact(enrollment.courseId.title, 180),
    slug: enrollment.courseId.slug,
    lessonCount: enrollment.courseId.lessonCount || 0,
    accessLevel: enrollment.courseId.accessLevel,
  } : null,
  status: enrollment.status,
  currentLessonId: idString(enrollment.currentLessonId),
  completedLessonCount: enrollment.completedLessonCount || 0,
  lastActivityAt: enrollment.lastActivityAt || null,
});

const contentSearch = async (contentType, query, limit) => {
  const regex = new RegExp(escapeRegex(query), "i");
  const contentFilter = contentType === "story" ? { contentType: "story" } : { contentType: { $ne: "story" } };
  const items = await Article.find({
    ...contentFilter,
    status: "published",
    isDeleted: false,
    $or: [{ title: regex }, { description: regex }, { excerpt: regex }, { tags: regex }],
  })
    .select("title slug description excerpt coverImage author readingTime accessLevel publishedAt contentType storyLayout")
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();
  return items.map((item) => ({
    id: idString(item), title: compact(item.title, 180), slug: item.slug,
    description: compact(item.description || item.excerpt, 500), author: item.author,
    readingTime: item.readingTime, accessLevel: item.accessLevel || "free",
    publishedAt: item.publishedAt, contentType: item.contentType || contentType,
    ...(contentType === "story" ? { storyLayout: item.storyLayout } : {}),
  }));
};

const definitions = [
  {
    key: "account.getProfile", description: "Return the authenticated user's safe account profile.",
    authRequired: true, inputSchema: strictEmpty, outputSchema: output,
    async execute(_input, context) {
      const user = await User.findById(context.userId).select("firstName lastName username role profile.avatar profile.bio").lean();
      if (!user) return null;
      return { id: idString(user), firstName: user.firstName, lastName: user.lastName, username: user.username, role: user.role, profile: { avatar: user.profile?.avatar || "", bio: compact(user.profile?.bio, 500) } };
    },
  },
  {
    key: "account.getSubscription", description: "Return server-authoritative subscription and entitlement state.",
    authRequired: true, inputSchema: strictEmpty, outputSchema: output,
    execute: (_input, context) => entitlementService.resolveForUser(context.userId),
  },
  {
    key: "life.getToday", description: "Return the authenticated user's actual Life activities for today or a requested date.",
    authRequired: true, requiredEntitlements: [ENTITLEMENTS.LIFE_ACCESS],
    inputSchema: z.object({ date: dateKey.optional() }).strict(), outputSchema: output,
    async execute(input, context) {
      const day = await todayService.getToday(context.userId, input.date);
      return {
        date: day.date, timezone: day.timezone,
        summary: { planned: day.summary.planned, completed: day.summary.completed, partial: day.summary.partial, skipped: day.summary.skipped, missed: day.summary.missed },
        activities: projectTimeline(day),
        goals: (day.summary.goals || []).slice(0, 25).map((goal) => ({ id: goal.id, title: compact(goal.title, 180), progress: goal.progress, targetDate: goal.targetDate || null })),
      };
    },
  },
  {
    key: "life.getHabits", description: "List the authenticated user's Life habits.",
    authRequired: true, requiredEntitlements: [ENTITLEMENTS.LIFE_ACCESS],
    inputSchema: z.object({ status: z.enum(["active", "paused", "archived", "all"]).optional(), limit: z.number().int().min(1).max(50).optional() }).strict(), outputSchema: output,
    async execute(input, context) {
      const result = await habitService.listHabits(context.userId, { status: input.status || "active", limit: input.limit || 30 });
      return { items: result.items.map((habit) => ({ id: idString(habit), name: compact(habit.name, 180), intent: habit.intent, measurementType: habit.measurementType, target: habit.target, unit: habit.unit, preferredPeriod: habit.preferredPeriod, status: habit.status, schedule: habit.schedule })), pagination: result.pagination };
    },
  },
  {
    key: "life.getGoals", description: "List the authenticated user's goals and computed progress.",
    authRequired: true, requiredEntitlements: [ENTITLEMENTS.LIFE_ACCESS],
    inputSchema: z.object({ status: z.enum(["active", "completed", "paused", "archived", "all"]).optional(), limit: z.number().int().min(1).max(50).optional() }).strict(), outputSchema: output,
    async execute(input, context) {
      const result = await lifeDataService.listGoals(context.userId, { status: input.status || "active", limit: input.limit || 30 });
      return { items: result.items.map((goal) => ({ id: idString(goal), title: compact(goal.title, 180), why: compact(goal.why, 300), status: goal.status, progress: goal.progress, targetDate: goal.targetDate || null })), pagination: result.pagination };
    },
  },
  {
    key: "life.getRecentProgress", description: "Return recent owner-scoped Life completion events.",
    authRequired: true, requiredEntitlements: [ENTITLEMENTS.LIFE_ACCESS],
    inputSchema: z.object({ limit: z.number().int().min(1).max(50).optional() }).strict(), outputSchema: output,
    async execute(input, context) {
      const items = await LifeEvent.find({ user: context.userId }).sort({ occurredAt: -1 }).limit(input.limit || 20).lean();
      return items.map((item) => ({ id: idString(item), itemType: item.itemType, itemId: idString(item.itemId), scheduledDate: item.scheduledDate, status: item.status, quantity: item.quantity, unit: item.unit, occurredAt: item.occurredAt }));
    },
  },
  {
    key: "learn.searchCourses", description: "Search the public Learn course catalog.",
    inputSchema: z.object({ query: z.string().trim().min(2).max(100), limit: z.number().int().min(1).max(12).optional() }).strict(), outputSchema: output,
    async execute(input) {
      const result = await courseService.listCourses({ search: input.query, limit: input.limit || 8 });
      return { courses: result.courses, pagination: result.pagination };
    },
  },
  {
    key: "learn.getEnrollments", description: "List the authenticated learner's recent enrollments.",
    authRequired: true, inputSchema: z.object({ limit: z.number().int().min(1).max(20).optional() }).strict(), outputSchema: output,
    async execute(input, context) {
      const rows = await courseService.continueLearning(context.userId, input.limit || 8);
      return rows.map(projectEnrollment);
    },
  },
  {
    key: "learn.getProgress", description: "Return owner-scoped learning progress.",
    authRequired: true, inputSchema: z.object({ courseId: z.string().trim().max(80).optional(), limit: z.number().int().min(1).max(20).optional() }).strict(), outputSchema: output,
    async execute(input, context) {
      const filter = { userId: context.userId, ...(input.courseId ? { courseId: input.courseId } : {}) };
      const rows = await CourseEnrollment.find(filter).select("courseId status currentLessonId completedLessonCount lessonProgress lastActivityAt completedAt").populate("courseId", "title slug lessonCount accessLevel").sort({ lastActivityAt: -1 }).limit(input.limit || 10).lean();
      return rows.map((row) => ({ ...projectEnrollment(row), lessonProgress: (row.lessonProgress || []).slice(-20).map((progress) => ({ lessonId: idString(progress.lessonId), stableKey: progress.lessonStableKey, positionSeconds: progress.positionSeconds || 0, completedAt: progress.completedAt || null, lastActivityAt: progress.lastActivityAt || null })) }));
    },
  },
  {
    key: "learn.getNextLesson", description: "Return the authenticated learner's next lesson from recent progress.",
    authRequired: true, inputSchema: z.object({ courseId: z.string().trim().max(80).optional() }).strict(), outputSchema: output,
    async execute(input, context) {
      const enrollment = await CourseEnrollment.findOne({ userId: context.userId, ...(input.courseId ? { courseId: input.courseId } : {}), status: { $in: ["active", "completed"] } }).sort({ lastActivityAt: -1 }).lean();
      if (!enrollment) return null;
      const [course, lessons] = await Promise.all([
        Course.findOne({ _id: enrollment.courseId, publicationStatus: "published", isDeleted: false }).select("title slug accessLevel lessonCount").lean(),
        CourseLesson.find({ courseId: enrollment.courseId, isDeleted: false }).select("title stableKey moduleId order isPreview durationSeconds").sort({ moduleId: 1, order: 1 }).limit(250).lean(),
      ]);
      if (!course || !lessons.length) return null;
      const completed = new Set((enrollment.lessonProgress || []).filter((item) => item.completedAt).map((item) => item.lessonStableKey));
      const next = lessons.find((lesson) => !completed.has(lesson.stableKey)) || lessons[lessons.length - 1];
      return { course: { id: idString(course), title: course.title, slug: course.slug, accessLevel: course.accessLevel }, lesson: { id: idString(next), title: next.title, stableKey: next.stableKey, isPreview: next.isPreview, durationSeconds: next.durationSeconds || 0 }, completedLessonCount: enrollment.completedLessonCount || 0 };
    },
  },
  {
    key: "content.searchArticles", description: "Search published Article metadata without protected bodies.",
    inputSchema: z.object({ query: z.string().trim().min(2).max(100), limit: z.number().int().min(1).max(12).optional() }).strict(), outputSchema: output,
    execute: (input) => contentSearch("article", input.query, input.limit || 8),
  },
  {
    key: "content.searchStories", description: "Search published Story metadata without protected bodies.",
    inputSchema: z.object({ query: z.string().trim().min(2).max(100), limit: z.number().int().min(1).max(12).optional() }).strict(), outputSchema: output,
    execute: (input) => contentSearch("story", input.query, input.limit || 8),
  },
  {
    key: "creators.search", description: "Search active public Creator profiles.",
    inputSchema: z.object({ query: z.string().trim().min(2).max(80), limit: z.number().int().min(1).max(12).optional() }).strict(), outputSchema: output,
    async execute(input) {
      const result = await directoryService.listCreators({ search: input.query, limit: input.limit || 8 });
      return { creators: result.creators, pagination: result.pagination };
    },
  },
  {
    key: "creators.getProfile", description: "Return one active Creator's public profile and public shelves.",
    inputSchema: z.object({ slug: z.string().trim().min(1).max(120) }).strict(), outputSchema: output,
    execute: (input, context) => directoryService.getPublicProfile(input.slug, context.userId || null),
  },
  {
    key: "knowledge.search", description: "Search the existing entitlement-safe MyJourney RAG index.",
    inputSchema: z.object({ query: z.string().trim().min(2).max(500), category: z.string().trim().max(100).optional(), limit: z.number().int().min(1).max(6).optional() }).strict(), outputSchema: output,
    async execute(input) {
      const result = await KnowledgeSearchService.search(input.query, { category: input.category || null, limit: input.limit || 5 });
      return { contextText: compact(result.contextText, 4000), citations: (result.citations || []).slice(0, 6), intent: result.intent, searchMethod: result.searchMethod };
    },
  },
  {
    key: "life.recordWater", description: "Record a water entry for the authenticated user.",
    permissionLevel: PERMISSIONS.LOW_RISK_WRITE, authRequired: true, requiredEntitlements: [ENTITLEMENTS.LIFE_ACCESS], auditPolicy: "write",
    inputSchema: z.object({ amountMl: z.number().int().min(1).max(10000), localDate: dateKey.optional() }).strict(), outputSchema: output,
    async execute(input, context) {
      const dedupeKey = `agent:${crypto.createHash("sha256").update(`${context.userId}:${context.idempotencyKey}:water`).digest("hex")}`;
      const entry = await lifeDataService.createHealthEntry(context.userId, { type: "water", value: input.amountMl, unit: "ml", localDate: input.localDate, source: { type: "agent" }, dedupeKey });
      return { id: idString(entry), amountMl: entry.canonicalValue, localDate: entry.localDate, duplicateSafe: true };
    },
  },
  {
    key: "life.completeHabit", description: "Mark one owned habit occurrence complete.",
    permissionLevel: PERMISSIONS.LOW_RISK_WRITE, authRequired: true, requiredEntitlements: [ENTITLEMENTS.LIFE_ACCESS], auditPolicy: "write",
    inputSchema: z.object({ habitId: z.string().trim().min(1).max(80), scheduledDate: dateKey.optional(), scheduledTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional() }).strict(), outputSchema: output,
    async execute(input, context) {
      const result = await eventService.logEvent(context.userId, "habit", input.habitId, { status: "completed", scheduledDate: input.scheduledDate, scheduledTime: input.scheduledTime, source: "agent" });
      return { id: idString(result.event), status: result.event.status, scheduledDate: result.event.scheduledDate, duplicate: result.duplicate };
    },
  },
  {
    key: "life.createTask", description: "Create a low-risk owned Life task.",
    permissionLevel: PERMISSIONS.LOW_RISK_WRITE, authRequired: true, requiredEntitlements: [ENTITLEMENTS.LIFE_ACCESS], auditPolicy: "write",
    inputSchema: z.object({ title: z.string().trim().min(1).max(180), localDate: dateKey.optional(), period: z.enum(["all_day", "morning", "afternoon", "evening"]).optional(), priority: z.enum(["none", "low", "medium", "high"]).optional(), durationEstimateMinutes: z.number().int().min(1).max(1440).optional() }).strict(), outputSchema: output,
    async execute(input, context) {
      const item = await lifeDataService.createTask(context.userId, { ...input, clientMutationId: `agent:${context.idempotencyKey}` });
      return { id: idString(item), title: item.title, localDate: item.localDate, period: item.period, priority: item.priority, duplicateSafe: true };
    },
  },
];

module.exports = { definitions, projectTimeline };
