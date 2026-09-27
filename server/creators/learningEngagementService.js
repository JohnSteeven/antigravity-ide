const mongoose = require("mongoose");
const Course = require("../models/Course");
const CourseEnrollment = require("../models/CourseEnrollment");
const CreatorProfile = require("../models/CreatorProfile");
const LearningEvent = require("../models/LearningEvent");

const QUALIFIED_EVENT_TYPES = Object.freeze(["lesson_completed", "quiz_passed", "exercise_passed", "course_completed"]);
const MAX_PERIOD_MS = 366 * 24 * 60 * 60 * 1000;
const reportError = (message, code, status = 422) => Object.assign(new Error(message), { code, status });
const id = (value) => String(value?._id || value || "");
const utcDay = (value) => new Date(value).toISOString().slice(0, 10);

const normalizePeriod = ({ periodStart, periodEnd }) => {
  const start = periodStart instanceof Date ? new Date(periodStart) : new Date(String(periodStart || ""));
  const end = periodEnd instanceof Date ? new Date(periodEnd) : new Date(String(periodEnd || ""));
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
    throw reportError("A valid start-inclusive, end-exclusive reporting period is required.", "INVALID_ENGAGEMENT_PERIOD");
  }
  if (end.getTime() - start.getTime() > MAX_PERIOD_MS) {
    throw reportError("Creator engagement reporting periods cannot exceed 366 days.", "ENGAGEMENT_PERIOD_TOO_LARGE");
  }
  return { start, end };
};

const emptyMetrics = () => ({
  enrolledLearners: 0,
  newEnrollments: 0,
  meaningfulLearners: 0,
  qualifiedLearningActions: 0,
  lessonCompletions: 0,
  quizPasses: 0,
  exercisePasses: 0,
  courseCompletions: 0,
  meaningfulLearningDays: 0,
  repeatMeaningfulLearnerDays: 0,
  learnersWithRepeatDays: 0,
});

const addMetrics = (target, source) => {
  Object.keys(target).forEach((key) => { target[key] += Number(source[key] || 0); });
  return target;
};

const eventSemanticKey = (event) => {
  const base = `${id(event.userId)}:${id(event.courseId)}:${event.eventType}`;
  if (event.eventType === "course_completed") return base;
  if (event.eventType === "exercise_passed") return `${base}:${String(event.idempotencyKey || id(event.lessonId))}`;
  return `${base}:${id(event.lessonId)}`;
};

const aggregateTrustedLearningEngagement = ({ courses = [], creatorProfiles = [], enrollments = [], events = [], periodStart, periodEnd }) => {
  const { start, end } = normalizePeriod({ periodStart, periodEnd });
  const creatorUserById = new Map(creatorProfiles.map((profile) => [id(profile), id(profile.userId)]));
  const eligibleCourses = courses.filter((course) => course.creatorId && course.isSystemOwned !== true);
  const courseById = new Map(eligibleCourses.map((course) => [id(course), course]));
  const courseReports = new Map(eligibleCourses.map((course) => [id(course), {
    courseId: id(course),
    creatorId: id(course.creatorId),
    title: course.title,
    slug: course.slug,
    metrics: emptyMetrics(),
    learnerIds: new Set(),
    learnerDays: new Map(),
    enrollmentIds: new Set(),
    newEnrollmentIds: new Set(),
    completionIds: new Set(),
  }]));

  enrollments.forEach((enrollment) => {
    const report = courseReports.get(id(enrollment.courseId));
    if (!report) return;
    const learnerId = id(enrollment.userId);
    if (!learnerId || learnerId === creatorUserById.get(report.creatorId)) return;
    const startedAt = new Date(enrollment.startedAt);
    if (Number.isFinite(startedAt.getTime()) && startedAt < end) report.enrollmentIds.add(learnerId);
    if (startedAt >= start && startedAt < end) report.newEnrollmentIds.add(learnerId);
  });

  const seenActions = new Set();
  events.forEach((event) => {
    if (!QUALIFIED_EVENT_TYPES.includes(event.eventType)) return;
    const report = courseReports.get(id(event.courseId));
    if (!report) return;
    const occurredAt = new Date(event.occurredAt);
    if (!Number.isFinite(occurredAt.getTime()) || occurredAt < start || occurredAt >= end) return;
    const learnerId = id(event.userId);
    if (!learnerId || learnerId === creatorUserById.get(report.creatorId)) return;
    const actionKey = eventSemanticKey(event);
    if (seenActions.has(actionKey)) return;
    seenActions.add(actionKey);

    report.learnerIds.add(learnerId);
    if (!report.learnerDays.has(learnerId)) report.learnerDays.set(learnerId, new Set());
    report.learnerDays.get(learnerId).add(utcDay(occurredAt));
    report.metrics.qualifiedLearningActions += 1;
    if (event.eventType === "lesson_completed") report.metrics.lessonCompletions += 1;
    if (event.eventType === "quiz_passed") report.metrics.quizPasses += 1;
    if (event.eventType === "exercise_passed") report.metrics.exercisePasses += 1;
    if (event.eventType === "course_completed") {
      report.completionIds.add(learnerId);
      report.metrics.courseCompletions += 1;
    }
  });

  // CourseEnrollment is an independent trusted fallback for historical rows
  // that completed before course_completed event persistence was introduced.
  enrollments.forEach((enrollment) => {
    const report = courseReports.get(id(enrollment.courseId));
    if (!report) return;
    const learnerId = id(enrollment.userId);
    const completedAt = new Date(enrollment.completedAt);
    if (!learnerId || learnerId === creatorUserById.get(report.creatorId)
      || !Number.isFinite(completedAt.getTime()) || completedAt < start || completedAt >= end
      || report.completionIds.has(learnerId)) return;
    report.completionIds.add(learnerId);
    report.learnerIds.add(learnerId);
    if (!report.learnerDays.has(learnerId)) report.learnerDays.set(learnerId, new Set());
    report.learnerDays.get(learnerId).add(utcDay(completedAt));
    report.metrics.qualifiedLearningActions += 1;
    report.metrics.courseCompletions += 1;
  });

  const creators = new Map();
  const courseOutput = [...courseReports.values()].map((report) => {
    report.metrics.enrolledLearners = report.enrollmentIds.size;
    report.metrics.newEnrollments = report.newEnrollmentIds.size;
    report.metrics.meaningfulLearners = report.learnerIds.size;
    report.metrics.meaningfulLearningDays = [...report.learnerDays.values()].reduce((sum, days) => sum + days.size, 0);
    report.metrics.repeatMeaningfulLearnerDays = [...report.learnerDays.values()].reduce((sum, days) => sum + Math.max(0, days.size - 1), 0);
    report.metrics.learnersWithRepeatDays = [...report.learnerDays.values()].filter((days) => days.size > 1).length;
    const output = { courseId: report.courseId, creatorId: report.creatorId, title: report.title, slug: report.slug, metrics: report.metrics };
    if (!creators.has(report.creatorId)) creators.set(report.creatorId, {
      creatorId: report.creatorId,
      metrics: emptyMetrics(),
      courses: [],
      enrollmentIds: new Set(),
      newEnrollmentIds: new Set(),
      learnerIds: new Set(),
      learnerDays: new Map(),
    });
    const creator = creators.get(report.creatorId);
    addMetrics(creator.metrics, report.metrics);
    report.enrollmentIds.forEach((learnerId) => creator.enrollmentIds.add(learnerId));
    report.newEnrollmentIds.forEach((learnerId) => creator.newEnrollmentIds.add(learnerId));
    report.learnerIds.forEach((learnerId) => creator.learnerIds.add(learnerId));
    report.learnerDays.forEach((days, learnerId) => {
      if (!creator.learnerDays.has(learnerId)) creator.learnerDays.set(learnerId, new Set());
      days.forEach((day) => creator.learnerDays.get(learnerId).add(day));
    });
    creator.courses.push(output);
    return output;
  }).sort((left, right) => left.courseId.localeCompare(right.courseId));

  const creatorOutput = [...creators.values()]
    .map((creator) => {
      creator.metrics.enrolledLearners = creator.enrollmentIds.size;
      creator.metrics.newEnrollments = creator.newEnrollmentIds.size;
      creator.metrics.meaningfulLearners = creator.learnerIds.size;
      creator.metrics.meaningfulLearningDays = [...creator.learnerDays.values()].reduce((sum, days) => sum + days.size, 0);
      creator.metrics.repeatMeaningfulLearnerDays = [...creator.learnerDays.values()].reduce((sum, days) => sum + Math.max(0, days.size - 1), 0);
      creator.metrics.learnersWithRepeatDays = [...creator.learnerDays.values()].filter((days) => days.size > 1).length;
      return { creatorId: creator.creatorId, metrics: creator.metrics, courses: creator.courses.sort((left, right) => left.courseId.localeCompare(right.courseId)) };
    })
    .sort((left, right) => left.creatorId.localeCompare(right.creatorId));
  return {
    period: { start: start.toISOString(), end: end.toISOString(), boundary: "start_inclusive_end_exclusive" },
    metrics: creatorOutput.reduce((total, creator) => addMetrics(total, creator.metrics), emptyMetrics()),
    creators: creatorOutput,
    courses: courseOutput,
    authority: "LearningEvent and CourseEnrollment only; client engagement totals and raw views excluded.",
  };
};

const reportLearningEngagement = async ({ creatorId = null, courseId = null, periodStart, periodEnd }) => {
  const { start, end } = normalizePeriod({ periodStart, periodEnd });
  if (creatorId && !mongoose.isValidObjectId(creatorId)) throw reportError("Creator ID is invalid.", "INVALID_CREATOR_ID");
  if (courseId && !mongoose.isValidObjectId(courseId)) throw reportError("Course ID is invalid.", "INVALID_COURSE_ID");
  const courseFilter = {
    creatorId: { $ne: null },
    isSystemOwned: { $ne: true },
    ...(creatorId ? { creatorId } : {}),
    ...(courseId ? { _id: courseId } : {}),
  };
  const courses = await Course.find(courseFilter).select("creatorId title slug isSystemOwned").lean();
  const courseIds = courses.map((course) => course._id);
  const creatorIds = [...new Set(courses.map((course) => id(course.creatorId)))];
  if (!courseIds.length) return aggregateTrustedLearningEngagement({ courses, periodStart: start, periodEnd: end });
  const [creatorProfiles, enrollments, events] = await Promise.all([
    CreatorProfile.find({ _id: { $in: creatorIds } }).select("userId").lean(),
    CourseEnrollment.find({ courseId: { $in: courseIds }, startedAt: { $lt: end } })
      .select("userId courseId startedAt completedAt").lean(),
    LearningEvent.find({ courseId: { $in: courseIds }, eventType: { $in: QUALIFIED_EVENT_TYPES }, occurredAt: { $gte: start, $lt: end } })
      .select("userId courseId lessonId eventType idempotencyKey occurredAt").lean(),
  ]);
  return aggregateTrustedLearningEngagement({ courses, creatorProfiles, enrollments, events, periodStart: start, periodEnd: end });
};

module.exports = {
  QUALIFIED_EVENT_TYPES,
  aggregateTrustedLearningEngagement,
  normalizePeriod,
  reportLearningEngagement,
};
