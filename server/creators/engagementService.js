const crypto = require("crypto");
const Article = require("../models/Article");
const Course = require("../models/Course");
const CourseEnrollment = require("../models/CourseEnrollment");
const CourseLesson = require("../models/CourseLesson");
const CreatorAnalyticsAggregate = require("../models/CreatorAnalyticsAggregate");
const CreatorEngagementEvent = require("../models/CreatorEngagementEvent");
const CreatorProfile = require("../models/CreatorProfile");
const CreatorVideo = require("../models/CreatorVideo");
const LearningResource = require("../models/LearningResource");
const PodcastEpisode = require("../models/PodcastEpisode");
const entitlementService = require("../services/entitlementService");
const { ENTITLEMENTS } = require("../premium/catalog");

const errorWith = (message, status, code) => Object.assign(new Error(message), { status, code });
const EVENT_TYPES = new Set(["view", "read", "watch", "listen", "lesson_completion", "course_progression", "save"]);

const contentContext = async (contentType, contentId) => {
  switch (contentType) {
    case "article":
    case "story": {
      const item = await Article.findOne({ _id: contentId, contentType, status: "published", isDeleted: false }).select("creatorProfileId accessLevel readingTimeMin").lean();
      return item ? { creatorId: item.creatorProfileId, accessLevel: item.accessLevel, maxDuration: (item.readingTimeMin || 1) * 60 } : null;
    }
    case "course": {
      const item = await Course.findOne({ _id: contentId, publicationStatus: "published", isDeleted: false }).select("creatorId accessLevel estimatedDurationMinutes").lean();
      return item ? { creatorId: item.creatorId, accessLevel: item.accessLevel, maxDuration: (item.estimatedDurationMinutes || 0) * 60 } : null;
    }
    case "lesson": {
      const lesson = await CourseLesson.findOne({ _id: contentId, isDeleted: false }).select("creatorId courseId durationSeconds stableKey").lean();
      if (!lesson) return null;
      const course = await Course.findOne({ _id: lesson.courseId, publicationStatus: "published", isDeleted: false }).select("accessLevel").lean();
      return course ? { creatorId: lesson.creatorId, accessLevel: course.accessLevel, maxDuration: lesson.durationSeconds, courseId: lesson.courseId, lessonStableKey: lesson.stableKey } : null;
    }
    case "video": {
      const item = await CreatorVideo.findOne({ _id: contentId, publicationStatus: "published", isDeleted: false }).select("creatorId accessLevel durationSeconds").lean();
      return item ? { creatorId: item.creatorId, accessLevel: item.accessLevel, maxDuration: item.durationSeconds } : null;
    }
    case "podcast": {
      const item = await PodcastEpisode.findOne({ _id: contentId, publicationStatus: "published", creatorId: { $ne: null } }).select("creatorId accessLevel durationSeconds").lean();
      return item ? { creatorId: item.creatorId, accessLevel: item.accessLevel, maxDuration: item.durationSeconds } : null;
    }
    case "resource": {
      const item = await LearningResource.findOne({ _id: contentId, publicationStatus: "published" }).select("creatorId accessLevel").lean();
      return item ? { creatorId: item.creatorId, accessLevel: item.accessLevel, maxDuration: 0 } : null;
    }
    default:
      return null;
  }
};

const qualify = ({ eventType, durationSeconds, progressRatio, maxDuration, selfEngagement, completionVerified }) => {
  if (selfEngagement) return { state: "unqualified", reason: "creator_self_engagement" };
  if (maxDuration > 0 && durationSeconds > maxDuration + 60) return { state: "unqualified", reason: "impossible_duration" };
  if (eventType === "view") return { state: "unqualified", reason: "raw_view_only" };
  if (eventType === "read") return durationSeconds >= 30 && progressRatio >= 0.5 ? { state: "qualified", reason: "qualified_read" } : { state: "unqualified", reason: "insufficient_read" };
  if (eventType === "watch") return durationSeconds >= 30 && progressRatio >= 0.1 ? { state: "qualified", reason: "qualified_watch" } : { state: "unqualified", reason: "insufficient_watch" };
  if (eventType === "listen") return durationSeconds >= 30 && progressRatio >= 0.1 ? { state: "qualified", reason: "qualified_listen" } : { state: "unqualified", reason: "insufficient_listen" };
  if (eventType === "lesson_completion") return completionVerified ? { state: "qualified", reason: "verified_lesson_completion" } : { state: "unqualified", reason: "unverified_completion" };
  if (eventType === "course_progression") return completionVerified ? { state: "qualified", reason: "verified_course_progression" } : { state: "unqualified", reason: "unverified_progression" };
  if (eventType === "save") return { state: "qualified", reason: "authenticated_save" };
  return { state: "unqualified", reason: "unsupported_signal" };
};

const metricIncrement = (eventType, qualified, durationSeconds) => {
  const inc = { "metrics.rawEvents": 1 };
  if (eventType === "view") inc["metrics.views"] = 1;
  if (!qualified) return inc;
  inc["metrics.qualifiedEvents"] = 1;
  if (eventType === "read") inc["metrics.qualifiedReads"] = 1;
  if (eventType === "watch") inc["metrics.qualifiedWatches"] = 1;
  if (eventType === "listen") inc["metrics.qualifiedListens"] = 1;
  if (eventType === "lesson_completion") inc["metrics.lessonCompletions"] = 1;
  if (eventType === "course_progression") inc["metrics.courseProgressions"] = 1;
  if (eventType === "save") inc["metrics.meaningfulSaves"] = 1;
  if (["read", "watch", "listen"].includes(eventType)) inc["metrics.qualifiedDurationSeconds"] = durationSeconds;
  return inc;
};

const verifyLearningSignal = async ({ userId, context, eventType }) => {
  if (!["lesson_completion", "course_progression"].includes(eventType) || !context.courseId) return false;
  const enrollment = await CourseEnrollment.findOne({ userId, courseId: context.courseId }).select("status lessonProgress").lean();
  if (!enrollment) return false;
  if (eventType === "course_progression") return ["active", "completed"].includes(enrollment.status) && enrollment.lessonProgress.some((item) => item.completedAt);
  return enrollment.lessonProgress.some((item) => item.lessonStableKey === context.lessonStableKey && item.completedAt);
};

const recordEngagement = async ({ userId, input }) => {
  const eventType = String(input.eventType || "").toLowerCase();
  if (!EVENT_TYPES.has(eventType)) throw errorWith("Unsupported engagement event.", 422, "INVALID_ENGAGEMENT_EVENT");
  const idempotencyKey = String(input.idempotencyKey || "").trim().slice(0, 120);
  const sessionId = String(input.sessionId || "").trim().slice(0, 200);
  if (!idempotencyKey || !sessionId) throw errorWith("Event and session identifiers are required.", 422, "ENGAGEMENT_IDEMPOTENCY_REQUIRED");
  const durationSeconds = Math.max(0, Math.min(86400, Number(input.durationSeconds || 0)));
  const progressRatio = Math.max(0, Math.min(1, Number(input.progressRatio || 0)));
  const context = await contentContext(String(input.contentType || ""), input.contentId);
  if (!context?.creatorId) throw errorWith("Creator content not found.", 404, "CREATOR_CONTENT_NOT_FOUND");

  const resolution = await entitlementService.resolveForUser(userId);
  const entitlementKey = ["course", "lesson"].includes(input.contentType) ? ENTITLEMENTS.PREMIUM_LEARN : ENTITLEMENTS.PREMIUM_CREATOR_CONTENT;
  const premiumEntitled = entitlementService.hasEntitlement(resolution, entitlementKey);
  if (context.accessLevel === "premium" && !premiumEntitled) throw errorWith("MyJourney Premium is required for this content.", 403, "PREMIUM_REQUIRED");
  const actorCreator = await CreatorProfile.findOne({ userId }).select("_id").lean();
  const completionVerified = await verifyLearningSignal({ userId, context, eventType });
  const qualification = qualify({
    eventType,
    durationSeconds,
    progressRatio,
    maxDuration: Number(context.maxDuration || 0),
    selfEngagement: String(actorCreator?._id || "") === String(context.creatorId),
    completionVerified,
  });
  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);
  try {
    const event = await CreatorEngagementEvent.create({
      actorUserId: userId,
      creatorId: context.creatorId,
      contentId: input.contentId,
      contentType: input.contentType,
      eventType,
      idempotencyKey,
      sessionHash: crypto.createHash("sha256").update(sessionId).digest("hex"),
      durationSeconds,
      progressRatio,
      premiumEntitledAtEvent: premiumEntitled,
      qualificationState: qualification.state,
      qualificationReason: qualification.reason,
      source: ["web", "mobile_web", "system"].includes(input.source) ? input.source : "web",
    });
    await CreatorAnalyticsAggregate.updateOne(
      { creatorId: context.creatorId, contentId: input.contentId, contentType: input.contentType, day },
      { $inc: metricIncrement(eventType, qualification.state === "qualified", durationSeconds) },
      { upsert: true }
    );
    return { accepted: true, duplicate: false, qualified: event.qualificationState === "qualified" };
  } catch (error) {
    if (error.code === 11000) return { accepted: true, duplicate: true, qualified: false };
    throw error;
  }
};

const creatorAnalytics = async (creatorId, query = {}) => {
  const days = Math.min(366, Math.max(1, Number.parseInt(query.days, 10) || 30));
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  since.setUTCHours(0, 0, 0, 0);
  const groups = await CreatorAnalyticsAggregate.aggregate([
    { $match: { creatorId, day: { $gte: since } } },
    { $group: {
      _id: "$contentType",
      rawEvents: { $sum: "$metrics.rawEvents" },
      qualifiedEvents: { $sum: "$metrics.qualifiedEvents" },
      views: { $sum: "$metrics.views" },
      qualifiedReads: { $sum: "$metrics.qualifiedReads" },
      qualifiedWatches: { $sum: "$metrics.qualifiedWatches" },
      qualifiedListens: { $sum: "$metrics.qualifiedListens" },
      lessonCompletions: { $sum: "$metrics.lessonCompletions" },
      courseProgressions: { $sum: "$metrics.courseProgressions" },
      meaningfulSaves: { $sum: "$metrics.meaningfulSaves" },
      qualifiedDurationSeconds: { $sum: "$metrics.qualifiedDurationSeconds" },
    } },
    { $sort: { qualifiedEvents: -1 } },
  ]);
  return { rangeDays: days, aggregates: groups.map(({ _id, ...metrics }) => ({ contentType: _id, ...metrics })), privacy: "Aggregated engagement only. Individual learner identity and Life data are never included." };
};

module.exports = { contentContext, creatorAnalytics, qualify, recordEngagement };
