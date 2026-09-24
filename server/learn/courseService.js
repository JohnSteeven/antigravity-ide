const crypto = require("crypto");
const mongoose = require("mongoose");
const Course = require("../models/Course");
const CourseModule = require("../models/CourseModule");
const CourseLesson = require("../models/CourseLesson");
const CourseEnrollment = require("../models/CourseEnrollment");
const LearningEvent = require("../models/LearningEvent");
const Topic = require("../models/Topic");
const LearningResource = require("../models/LearningResource");
const CodingSubmission = require("../models/CodingSubmission");
const { resolveLearnAccess } = require("./accessPolicy");
const { serializeCourse, serializeLesson, serializeLessonMetadata, serializeResource } = require("./serializers");
const { escapeRegex, slugify, uniqueStrings } = require("../creators/utils");

const errorWith = (message, status, code) => Object.assign(new Error(message), { status, code });
const userIdString = (value) => String(value?._id || value?.id || value || "");

const findAvailableSlug = async (title, excludeId = null) => {
  const base = slugify(title) || "course";
  let candidate = base;
  let suffix = 1;
  while (await Course.exists({ slug: candidate, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) candidate = `${base}-${suffix++}`;
  return candidate;
};

const runTransaction = async (operation) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await operation(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    if (error.codeName === "CommandNotSupported" || String(error.message).includes("does not support sessions")) return operation(null);
    throw error;
  } finally { await session.endSession(); }
};

const courseQuery = () => Course.findOne({ publicationStatus: "published", isDeleted: false })
  .populate("creatorId", "displayName slug headline profileImage")
  .populate("topicIds", "name slug");

const curriculumForCourse = async (courseId) => {
  const [modules, lessons] = await Promise.all([
    CourseModule.find({ courseId, isDeleted: false }).sort({ order: 1 }).lean(),
    CourseLesson.find({ courseId, isDeleted: false }).sort({ moduleId: 1, order: 1 }).lean(),
  ]);
  const byModule = new Map();
  lessons.forEach((lesson) => {
    const key = String(lesson.moduleId);
    if (!byModule.has(key)) byModule.set(key, []);
    byModule.get(key).push(serializeLessonMetadata(lesson));
  });
  return modules.map((module) => ({ id: String(module._id), stableKey: module.stableKey, title: module.title, description: module.description, order: module.order, lessons: byModule.get(String(module._id)) || [] }));
};

// ── Phase 7 Learn Mastery Canonical Helpers ─────────────────────────────────

const getEligibleCourseLessons = async (courseId) => {
  if (!courseId || !mongoose.isValidObjectId(courseId)) return [];
  try {
    const activeModules = await CourseModule.find({ courseId, isDeleted: false }).sort({ order: 1 }).lean();
    const activeModuleIds = activeModules.map((m) => m._id);
    const lessons = await CourseLesson.find({
      courseId,
      moduleId: { $in: activeModuleIds },
      isDeleted: false,
    }).sort({ moduleId: 1, order: 1 }).lean();

    const moduleOrderMap = new Map(activeModules.map((m, idx) => [String(m._id), idx]));
    lessons.sort((a, b) => {
      const modA = moduleOrderMap.get(String(a.moduleId)) ?? 0;
      const modB = moduleOrderMap.get(String(b.moduleId)) ?? 0;
      if (modA !== modB) return modA - modB;
      return (a.order || 0) - (b.order || 0);
    });
    return lessons;
  } catch {
    return [];
  }
};

const deriveLessonState = (progress, lesson = null) => {
  const started = Boolean(progress?.startedAt);
  const completed = Boolean(progress?.completedAt);
  const exercisePassed = Boolean(progress?.exercisePassed);
  const exerciseAttempts = Number(progress?.exerciseAttempts || 0);
  const quizPassed = Boolean(progress?.quizPassed);
  const quizScore = Number(progress?.quizScore || 0);
  const bestQuizScore = Number(progress?.bestQuizScore ?? progress?.quizScore ?? 0);
  const quizAttempts = Number(progress?.quizAttempts ?? (quizScore > 0 ? 1 : 0));
  const solutionViewed = Boolean(progress?.solutionViewed);
  const positionSeconds = Number(progress?.positionSeconds || 0);

  let state = "not_started";
  if (completed) {
    state = "completed";
  } else if (started || exerciseAttempts > 0 || quizAttempts > 0 || positionSeconds > 0) {
    state = "in_progress";
  }

  return {
    started,
    completed,
    state,
    exercisePassed,
    exerciseAttempts,
    quizPassed,
    quizScore,
    bestQuizScore,
    quizAttempts,
    solutionViewed,
    positionSeconds,
  };
};

const calculateEnrollmentProgress = (enrollment, eligibleLessons = []) => {
  const totalEligible = eligibleLessons.length;
  if (!enrollment) {
    return {
      completedLessonCount: 0,
      totalEligibleLessons: totalEligible,
      progressPercent: 0,
      isCompleted: false,
      completedAt: null,
    };
  }

  const completedStableKeys = new Set(
    (enrollment.lessonProgress || [])
      .filter((lp) => Boolean(lp.completedAt))
      .map((lp) => lp.lessonStableKey)
  );

  const completedEligibleCount = eligibleLessons.filter((l) =>
    completedStableKeys.has(l.stableKey)
  ).length;

  const isHistoricallyCompleted = enrollment.status === "completed" && Boolean(enrollment.completedAt);

  let progressPercent = 0;
  if (isHistoricallyCompleted) {
    progressPercent = 100;
  } else if (totalEligible > 0) {
    progressPercent = Math.min(100, Math.round((completedEligibleCount / totalEligible) * 100));
  }

  return {
    completedLessonCount: completedEligibleCount,
    totalEligibleLessons: totalEligible,
    progressPercent,
    isCompleted: isHistoricallyCompleted || (totalEligible > 0 && completedEligibleCount >= totalEligible),
    completedAt: enrollment.completedAt || null,
  };
};

const resolveNextLesson = (enrollment, eligibleLessons = []) => {
  if (!eligibleLessons || eligibleLessons.length === 0) return null;

  const completedSet = new Set(
    (enrollment?.lessonProgress || [])
      .filter((p) => Boolean(p.completedAt))
      .map((p) => p.lessonStableKey)
  );

  const incompleteLessons = eligibleLessons.filter((l) => !completedSet.has(l.stableKey));
  if (incompleteLessons.length === 0) return null;

  const currentId = enrollment?.currentLessonId ? String(enrollment.currentLessonId) : null;
  if (currentId) {
    const currentLesson = eligibleLessons.find((l) => String(l._id) === currentId || l.stableKey === currentId);
    if (currentLesson) {
      if (!completedSet.has(currentLesson.stableKey)) {
        return currentLesson;
      }
      const currentIdx = eligibleLessons.indexOf(currentLesson);
      const nextAfter = eligibleLessons.slice(currentIdx + 1).find((l) => !completedSet.has(l.stableKey));
      if (nextAfter) return nextAfter;
    }
  }

  return incompleteLessons[0] || null;
};

const reconcileCourseCompletion = async (enrollment, eligibleLessons, userId, entitlementPlan) => {
  if (!enrollment) return;
  const isFirstCompletion = enrollment.status !== "completed";
  enrollment.status = "completed";
  if (!enrollment.completedAt) {
    enrollment.completedAt = new Date();
  }
  if (isFirstCompletion) {
    await LearningEvent.create({
      userId,
      courseId: enrollment.courseId,
      eventType: "course_completed",
      idempotencyKey: `course_completed:${enrollment.courseId}:${userId}`,
      entitlementPlan: entitlementPlan || "free",
    }).catch((err) => {
      if (err.code !== 11000) throw err;
    });
  }
};


const listCourses = async (query = {}) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(48, Math.max(1, Number.parseInt(query.limit, 10) || 18));
  const filter = { publicationStatus: "published", isDeleted: false };
  const topicParam = query.topic || query.topicIds || query.topicSlug || query.topicId;
  if (topicParam) {
    let topicDoc = null;
    const topicRaw = String(Array.isArray(topicParam) ? topicParam[0] : topicParam).trim();
    if (mongoose.isValidObjectId(topicRaw)) {
      topicDoc = await Topic.findOne({ _id: topicRaw, status: "active" }).select("_id").lean();
    }
    if (!topicDoc) {
      topicDoc = await Topic.findOne({
        slug: slugify(topicRaw) || topicRaw.toLowerCase(),
        status: "active",
      }).select("_id").lean();
    }
    if (!topicDoc) {
      topicDoc = await Topic.findOne({
        name: new RegExp(`^${escapeRegex(topicRaw)}$`, "i"),
        status: "active",
      }).select("_id").lean();
    }
    if (topicDoc) {
      filter.topicIds = topicDoc._id;
    } else {
      filter.topicIds = new mongoose.Types.ObjectId();
    }
  }
  if (query.level) filter.level = query.level;
  if (query.language) filter.language = query.language;
  if (query.accessLevel) filter.accessLevel = query.accessLevel;
  if (query.creator) {
    const creatorRaw = String(query.creator).trim();
    if (mongoose.isValidObjectId(creatorRaw)) {
      filter.creatorId = creatorRaw;
    } else {
      const CreatorProfile = require("../models/CreatorProfile");
      const creatorDoc = await CreatorProfile.findOne({
        slug: slugify(creatorRaw) || creatorRaw.toLowerCase(),
        status: "active",
      }).select("_id").lean();
      if (creatorDoc) {
        filter.creatorId = creatorDoc._id;
      } else {
        filter.creatorId = new mongoose.Types.ObjectId();
      }
    }
  }
  if (query.search) filter.$text = { $search: String(query.search).slice(0, 100) };
  const sort = query.sort === "new" ? { publishedAt: -1 } : { isFeatured: -1, publishedAt: -1 };
  const [items, total] = await Promise.all([
    Course.find(filter).select("-reviewMessage -reviewedBy").populate("creatorId", "displayName slug headline profileImage").populate("topicIds", "name slug").sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Course.countDocuments(filter),
  ]);
  return { courses: items.map((course) => serializeCourse(course)), pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

const getCourseDetail = async (slug, userId = null) => {
  const course = await courseQuery().where({ slug }).lean();
  if (!course) throw errorWith("Course not found.", 404, "COURSE_NOT_FOUND");
  const [curriculum, enrollment, eligibleLessons] = await Promise.all([
    curriculumForCourse(course._id),
    userId ? CourseEnrollment.findOne({ userId, courseId: course._id }).select("status currentLessonId completedLessonCount lastActivityAt lessonProgress completedAt").lean() : null,
    getEligibleCourseLessons(course._id),
  ]);
  const progressMeta = calculateEnrollmentProgress(enrollment, eligibleLessons);
  const nextLesson = resolveNextLesson(enrollment, eligibleLessons);

  const enrichedEnrollment = enrollment ? {
    ...enrollment,
    completedLessonCount: progressMeta.completedLessonCount,
    totalEligibleLessons: progressMeta.totalEligibleLessons,
    progressPercent: progressMeta.progressPercent,
    isCompleted: progressMeta.isCompleted,
    nextLessonId: nextLesson ? String(nextLesson._id) : null,
    lessonProgress: (enrollment.lessonProgress || []).map((lp) => {
      const lessonObj = eligibleLessons.find((el) => el.stableKey === lp.lessonStableKey);
      return {
        ...lp,
        ...deriveLessonState(lp, lessonObj),
      };
    }),
  } : null;

  return serializeCourse(course, { curriculum, enrollment: enrichedEnrollment });
};

const getLesson = async ({ courseSlug, lessonId, userId = null, creatorId = null, admin = false }) => {
  // Studio preview authority is limited to the authenticated Creator's own
  // Course. Free access and preview flags never bypass that ownership check.
  const courseScope = admin ? {} : creatorId ? { creatorId } : { publicationStatus: "published" };
  const course = await Course.findOne({ slug: courseSlug, ...courseScope, isDeleted: false }).lean();
  if (!course) throw errorWith("Course not found.", 404, "COURSE_NOT_FOUND");
  const owner = creatorId && String(course.creatorId) === String(creatorId);

  const isOid = mongoose.isValidObjectId(lessonId);
  const lessonQuery = isOid
    ? { _id: lessonId, courseId: course._id, isDeleted: false }
    : { stableKey: lessonId, courseId: course._id, isDeleted: false };
  const lesson = await CourseLesson.findOne(lessonQuery)
    .select("+body +mediaAssetId +transcript +captions +resourceIds")
    .lean();
  if (!lesson) throw errorWith("Lesson not found.", 404, "LESSON_NOT_FOUND");
  const access = lesson.isPreview
    ? { allowed: true, reason: "preview" }
    : await resolveLearnAccess({ userId, accessLevel: course.accessLevel, owner, admin, monetizationType: course.monetizationType });
  if (!access.allowed) throw errorWith("MyJourney Premium is required for this lesson.", 403, "PREMIUM_REQUIRED");

  // Load attached materials/resources
  const attachedResources = await LearningResource.find({
    $or: [
      { lessonId: lesson._id },
      { _id: { $in: lesson.resourceIds || [] } },
      { courseId: course._id, lessonId: null, moduleId: null },
      { moduleId: lesson.moduleId, lessonId: null },
    ],
    publicationStatus: "published",
  }).sort({ sortOrder: 1, createdAt: 1 }).lean();

  const serializedResources = await Promise.all(
    attachedResources.map(async (r) => {
      const isAllowed = r.accessLevel === "free"
        ? true
        : (await resolveLearnAccess({ userId, accessLevel: r.accessLevel, owner, admin })).allowed;
      return serializeResource(r, { allowed: isAllowed });
    })
  );

  let progress = null;
  if (userId && !owner && !admin) {
    try {
      const enrollment = await CourseEnrollment.findOne({ userId, courseId: course._id }).select("lessonProgress").lean();
      const lp = enrollment?.lessonProgress?.find((item) => item.lessonStableKey === lesson.stableKey);
      if (lp) {
        progress = deriveLessonState(lp, lesson);
      }
    } catch {
      progress = null;
    }
  }

  const curriculum = await curriculumForCourse(course._id);

  return {
    course: serializeCourse(course, { curriculum }),
    lesson: {
      ...serializeLesson(lesson, { allowed: true }),
      resources: serializedResources,
    },
    accessReason: access.reason,
    progress,
  };
};

const createCourse = async (creator, input) => {
  if (input.confirmContentRights !== true) throw errorWith("Confirm that you hold the rights to this Course.", 422, "CONTENT_RIGHTS_REQUIRED");
  return Course.create({
    creatorId: creator._id,
    title: String(input.title || "").trim(),
    slug: await findAvailableSlug(input.slug || input.title),
    subtitle: String(input.subtitle || "").trim(),
    description: String(input.description || "").trim(),
    topicIds: Array.isArray(input.topicIds) ? input.topicIds.slice(0, 12) : [],
    language: String(input.language || "English").trim(),
    level: input.level || "all_levels",
    accessLevel: input.accessLevel === "premium" ? "premium" : "free",
    coverImage: String(input.coverImage || "").trim(),
    coverImageAlt: String(input.coverImageAlt || "").trim(),
    estimatedDurationMinutes: Number(input.estimatedDurationMinutes || 0),
    learningOutcomes: uniqueStrings(input.learningOutcomes, 20),
    prerequisites: uniqueStrings(input.prerequisites, 20),
    rightsConfirmedAt: new Date(),
  });
};

const updateCourse = async (creatorId, courseId, input) => {
  const course = await Course.findOne({ _id: courseId, creatorId, isDeleted: false });
  if (!course) throw errorWith("Course not found.", 404, "COURSE_NOT_FOUND");
  if (!["draft", "changes_requested"].includes(course.workflowStatus)) throw errorWith("Submitted Courses cannot be edited until review is complete.", 409, "COURSE_NOT_EDITABLE");
  const allowed = ["title", "subtitle", "description", "language", "level", "coverImage", "coverImageAlt", "estimatedDurationMinutes"];
  allowed.forEach((field) => { if (input[field] !== undefined) course[field] = input[field]; });
  if (input.topicIds !== undefined) course.topicIds = Array.isArray(input.topicIds) ? input.topicIds.slice(0, 12) : [];
  if (input.learningOutcomes !== undefined) course.learningOutcomes = uniqueStrings(input.learningOutcomes, 20);
  if (input.prerequisites !== undefined) course.prerequisites = uniqueStrings(input.prerequisites, 20);
  if (input.accessLevel !== undefined) course.accessLevel = input.accessLevel === "premium" ? "premium" : "free";
  if (input.title !== undefined || input.subtitle !== undefined || input.description !== undefined) course.contentVersion += 1;
  await course.save();
  return course;
};

const replaceCurriculum = async (creatorId, courseId, input) => {
  const modulesInput = Array.isArray(input.modules) ? input.modules : [];
  if (!modulesInput.length || modulesInput.length > 50) throw errorWith("A Course needs 1–50 Modules.", 422, "INVALID_CURRICULUM");
  const lessonCount = modulesInput.reduce((count, module) => count + (Array.isArray(module.lessons) ? module.lessons.length : 0), 0);
  if (!lessonCount || lessonCount > 500) throw errorWith("A Course needs 1–500 Lessons.", 422, "INVALID_CURRICULUM");

  return runTransaction(async (session) => {
    const options = session ? { session } : {};
    const course = await Course.findOne({ _id: courseId, creatorId, isDeleted: false }).session(session || null);
    if (!course) throw errorWith("Course not found.", 404, "COURSE_NOT_FOUND");
    if (!["draft", "changes_requested"].includes(course.workflowStatus)) throw errorWith("Submitted Courses cannot change curriculum.", 409, "COURSE_NOT_EDITABLE");
    if (Number(input.expectedStructuralVersion) !== course.structuralVersion) throw errorWith("The Course curriculum changed in another session. Refresh before saving.", 409, "COURSE_VERSION_CONFLICT");

    await Promise.all([
      CourseLesson.deleteMany({ courseId }, options),
      CourseModule.deleteMany({ courseId }, options),
    ]);
    const moduleDocs = [];
    for (let moduleIndex = 0; moduleIndex < modulesInput.length; moduleIndex += 1) {
      const moduleInput = modulesInput[moduleIndex];
      const [module] = await CourseModule.create([{
        courseId,
        creatorId,
        title: String(moduleInput.title || "").trim(),
        description: String(moduleInput.description || "").trim(),
        order: moduleIndex,
        stableKey: String(moduleInput.stableKey || crypto.randomUUID()),
      }], options);
      moduleDocs.push(module);
      const lessons = (Array.isArray(moduleInput.lessons) ? moduleInput.lessons : []).map((lesson, lessonIndex) => ({
        courseId,
        moduleId: module._id,
        creatorId,
        stableKey: String(lesson.stableKey || crypto.randomUUID()),
        title: String(lesson.title || "").trim(),
        description: String(lesson.description || "").trim(),
        lessonType: lesson.lessonType || "text",
        body: String(lesson.body || ""),
        mediaAssetId: lesson.mediaAssetId || null,
        transcript: String(lesson.transcript || ""),
        captions: Array.isArray(lesson.captions) ? lesson.captions.slice(0, 20) : [],
        resourceIds: Array.isArray(lesson.resourceIds) ? lesson.resourceIds.slice(0, 30) : [],
        codingBlocks: Array.isArray(lesson.codingBlocks) ? lesson.codingBlocks.map((block, bIndex) => ({
          id: String(block.id || crypto.randomUUID()),
          blockType: block.blockType || "explanation",
          title: String(block.title || "").trim(),
          content: String(block.content || ""),
          language: String(block.language || "javascript"),
          starterCode: String(block.starterCode || ""),
          instructions: String(block.instructions || ""),
          expectedOutput: String(block.expectedOutput || ""),
          hints: Array.isArray(block.hints) ? block.hints.map((h) => String(h).slice(0, 1000)) : [],
          validationRules: block.validationRules || null,
          solutionCode: String(block.solutionCode || ""),
          tests: Array.isArray(block.tests) ? block.tests.map((t) => ({
            description: String(t.description || ""),
            testCode: String(t.testCode || ""),
            hidden: Boolean(t.hidden),
          })) : [],
          order: Number(block.order ?? bIndex),
        })) : [],
        quizQuestions: Array.isArray(lesson.quizQuestions) ? lesson.quizQuestions.map((q, qIndex) => ({
          id: String(q.id || crypto.randomUUID()),
          question: String(q.question || "").trim(),
          options: Array.isArray(q.options) ? q.options.map((o) => ({
            id: String(o.id || crypto.randomUUID()),
            text: String(typeof o === "string" ? o : (o.text || "")).trim(),
          })) : [],
          explanation: String(q.explanation || "").trim(),
          correctOptionIndex: Number(q.correctOptionIndex ?? 0),
          order: Number(q.order ?? qIndex),
        })) : [],
        durationSeconds: Number(lesson.durationSeconds || 0),
        order: lessonIndex,
        isPreview: Boolean(lesson.isPreview),
        completionMode: lesson.completionMode || "manual",
      }));
      if (!lessons.length) throw errorWith("Every Module needs at least one Lesson.", 422, "INVALID_CURRICULUM");
      await CourseLesson.insertMany(lessons, options);
    }
    course.moduleCount = moduleDocs.length;
    course.lessonCount = lessonCount;
    course.structuralVersion += 1;
    course.contentVersion += 1;
    await course.save(options);
    return { course, curriculum: await curriculumForCourse(courseId) };
  });
};

const submitCourse = async (creatorId, courseId) => {
  const course = await Course.findOne({ _id: courseId, creatorId, isDeleted: false });
  if (!course) throw errorWith("Course not found.", 404, "COURSE_NOT_FOUND");
  if (!["draft", "changes_requested"].includes(course.workflowStatus)) throw errorWith("Course is already in review.", 409, "COURSE_ALREADY_SUBMITTED");
  if (!course.lessonCount) throw errorWith("Add Lessons before submitting this Course.", 422, "COURSE_CURRICULUM_REQUIRED");
  course.workflowStatus = "submitted";
  course.publicationStatus = "draft";
  await course.save();
  return course;
};

const ensureCourseAccess = async (course, userId) => {
  const access = await resolveLearnAccess({ userId, accessLevel: course.accessLevel, monetizationType: course.monetizationType });
  if (!access.allowed) throw errorWith("MyJourney Premium is required for this Course.", 403, "PREMIUM_REQUIRED");
  return access;
};

const enroll = async (userId, courseId) => {
  const course = await Course.findOne({ _id: courseId, publicationStatus: "published", isDeleted: false }).lean();
  if (!course) throw errorWith("Course not found.", 404, "COURSE_NOT_FOUND");
  const access = await ensureCourseAccess(course, userId);
  let enrollment = await CourseEnrollment.findOne({ userId, courseId });
  if (!enrollment) {
    enrollment = await CourseEnrollment.create({ userId, courseId, structuralVersionAtEnrollment: course.structuralVersion });
    await LearningEvent.create({ userId, courseId, eventType: "enrolled", idempotencyKey: `enroll:${courseId}`, entitlementPlan: access.resolution?.plan || "free" }).catch((error) => { if (error.code !== 11000) throw error; });
  } else if (enrollment.status === "archived") {
    enrollment.status = "active";
    enrollment.lastActivityAt = new Date();
    await enrollment.save();
  }
  return enrollment;
};

const recordExerciseAttempt = async ({ userId, courseId, courseSlug, lessonId, blockId, passed }) => {
  const courseQuery = courseId ? { _id: courseId } : { slug: courseSlug };
  const isOid = mongoose.isValidObjectId(lessonId);
  const lessonQuery = isOid ? { _id: lessonId, isDeleted: false } : { stableKey: lessonId, isDeleted: false };
  const [course, lesson] = await Promise.all([
    Course.findOne({ ...courseQuery, publicationStatus: "published", isDeleted: false }).lean(),
    CourseLesson.findOne(lessonQuery).lean(),
  ]);
  if (!course || !lesson) throw errorWith("Course Lesson not found.", 404, "LESSON_NOT_FOUND");
  await ensureCourseAccess(course, userId);

  const enrollment = await CourseEnrollment.findOne({ userId, courseId: course._id });
  if (!enrollment) throw errorWith("Enroll in this Course before recording progress.", 403, "ENROLLMENT_REQUIRED");
  if (!enrollment.structuralVersionAtEnrollment) {
    enrollment.structuralVersionAtEnrollment = course.structuralVersion || 1;
  }

  const block = (lesson.codingBlocks || []).find((b) => String(b.id) === String(blockId));
  if (!block) throw errorWith("Coding block not found.", 404, "CODING_BLOCK_NOT_FOUND");

  let progress = enrollment.lessonProgress.find((item) => item.lessonStableKey === lesson.stableKey);
  if (!progress) {
    enrollment.lessonProgress.push({
      lessonId: lesson._id,
      lessonStableKey: lesson.stableKey,
      startedAt: new Date(),
      lessonContentVersion: lesson.contentVersion,
    });
    progress = enrollment.lessonProgress[enrollment.lessonProgress.length - 1];
  }
  progress.exerciseAttempts = (progress.exerciseAttempts || 0) + 1;
  progress.lastActivityAt = new Date();
  const wasAlreadyPassed = Boolean(progress.exercisePassed);
  if (passed === true) {
    progress.exercisePassed = true;
    if (!wasAlreadyPassed) {
      await LearningEvent.create({
        userId,
        courseId: course._id,
        lessonId: lesson._id,
        eventType: "exercise_passed",
        idempotencyKey: `exercise_passed:${course._id}:${lesson._id}:${block.id}`,
        entitlementPlan: "free",
      }).catch(() => {});
    }
  }
  enrollment.lastActivityAt = new Date();
  await enrollment.save();

  return {
    recorded: true,
    success: true,
    exercisePassed: Boolean(progress.exercisePassed),
    exerciseAttempts: progress.exerciseAttempts,
  };
};

const evaluateQuiz = async ({ courseSlug, courseId, lessonId, userId, answers }) => {
  const courseQuery = courseId ? { _id: courseId } : { slug: courseSlug };
  const course = await Course.findOne({ ...courseQuery, publicationStatus: "published", isDeleted: false }).lean();
  if (!course) throw errorWith("Course not found.", 404, "COURSE_NOT_FOUND");
  await ensureCourseAccess(course, userId);

  const isOid = mongoose.isValidObjectId(lessonId);
  const lessonQuery = isOid
    ? { _id: lessonId, courseId: course._id, isDeleted: false }
    : { stableKey: lessonId, courseId: course._id, isDeleted: false };
  const lesson = await CourseLesson.findOne(lessonQuery)
    .select("+quizQuestions.correctOptionIndex +quizQuestions.explanation")
    .lean();
  if (!lesson) throw errorWith("Lesson not found.", 404, "LESSON_NOT_FOUND");
  if (!lesson.quizQuestions || !lesson.quizQuestions.length) {
    throw errorWith("This lesson does not contain quiz questions.", 400, "NO_QUIZ_QUESTIONS");
  }

  const enrollment = await CourseEnrollment.findOne({ userId, courseId: course._id });
  if (!enrollment) throw errorWith("Enroll in this Course before taking quizzes.", 403, "ENROLLMENT_REQUIRED");

  const results = lesson.quizQuestions.map((q) => {
    const selected = answers ? answers[String(q.id)] : undefined;
    const isCorrect = selected !== undefined && Number(selected) === q.correctOptionIndex;
    return {
      questionId: String(q.id),
      correct: isCorrect,
      selectedOptionIndex: selected !== undefined ? Number(selected) : null,
      correctOptionIndex: q.correctOptionIndex,
      explanation: q.explanation || "",
    };
  });

  const correctCount = results.filter((r) => r.correct).length;
  const total = results.length;
  const scorePercent = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const passed = scorePercent >= 70;

  let progress = enrollment.lessonProgress.find((item) => item.lessonStableKey === lesson.stableKey);
  if (!progress) {
    enrollment.lessonProgress.push({
      lessonId: lesson._id,
      lessonStableKey: lesson.stableKey,
      startedAt: new Date(),
      lessonContentVersion: lesson.contentVersion,
    });
    progress = enrollment.lessonProgress[enrollment.lessonProgress.length - 1];
  }
  progress.quizScore = scorePercent;
  progress.bestQuizScore = Math.max(progress.bestQuizScore || 0, scorePercent);
  progress.quizAttempts = (progress.quizAttempts || 0) + 1;
  progress.lastActivityAt = new Date();
  const wasQuizPassed = Boolean(progress.quizPassed);
  if (passed) {
    progress.quizPassed = true;
    if (!wasQuizPassed) {
      await LearningEvent.create({
        userId,
        courseId: course._id,
        lessonId: lesson._id,
        eventType: "quiz_passed",
        idempotencyKey: `quiz_passed:${course._id}:${lesson._id}`,
        entitlementPlan: "free",
      }).catch(() => {});
    }
  }
  enrollment.lastActivityAt = new Date();
  await enrollment.save();

  return {
    success: true,
    passed,
    score: scorePercent,
    bestScore: progress.bestQuizScore,
    attempts: progress.quizAttempts,
    correctCount,
    totalQuestions: total,
    results,
  };
};

const revealSolution = async ({ courseSlug, courseId, lessonId, userId, blockId }) => {
  const courseQuery = courseId ? { _id: courseId } : { slug: courseSlug };
  const course = await Course.findOne({ ...courseQuery, publicationStatus: "published", isDeleted: false }).lean();
  if (!course) throw errorWith("Course not found.", 404, "COURSE_NOT_FOUND");
  await ensureCourseAccess(course, userId);

  const isOid = mongoose.isValidObjectId(lessonId);
  const lessonQuery = isOid
    ? { _id: lessonId, courseId: course._id, isDeleted: false }
    : { stableKey: lessonId, courseId: course._id, isDeleted: false };
  const lesson = await CourseLesson.findOne(lessonQuery)
    .select("+codingBlocks.solutionCode")
    .lean();
  if (!lesson) throw errorWith("Lesson not found.", 404, "LESSON_NOT_FOUND");

  const block = (lesson.codingBlocks || []).find((b) => !blockId || String(b.id) === String(blockId));
  if (!block) throw errorWith("Coding block not found.", 404, "CODING_BLOCK_NOT_FOUND");

  const enrollment = await CourseEnrollment.findOne({ userId, courseId: course._id });
  if (!enrollment) throw errorWith("Enroll in this Course before viewing solutions.", 403, "ENROLLMENT_REQUIRED");
  if (!enrollment.structuralVersionAtEnrollment) {
    enrollment.structuralVersionAtEnrollment = course.structuralVersion || 1;
  }

  let progress = enrollment.lessonProgress.find((item) => item.lessonStableKey === lesson.stableKey);
  if (!progress) {
    enrollment.lessonProgress.push({
      lessonId: lesson._id,
      lessonStableKey: lesson.stableKey,
      startedAt: new Date(),
      lessonContentVersion: lesson.contentVersion,
    });
    progress = enrollment.lessonProgress[enrollment.lessonProgress.length - 1];
  }
  progress.solutionViewed = true;
  progress.lastActivityAt = new Date();
  enrollment.lastActivityAt = new Date();
  await enrollment.save();

  return {
    success: true,
    blockId: String(block.id),
    solutionCode: block.solutionCode || "",
    solutionViewed: true,
  };
};

const recordProgress = async ({ userId, courseId, lessonId, positionSeconds = 0, completed = false, idempotencyKey }) => {
  const [course, lesson, enrollment] = await Promise.all([
    Course.findOne({ _id: courseId, publicationStatus: "published", isDeleted: false }).lean(),
    CourseLesson.findOne({ _id: lessonId, courseId, isDeleted: false }).lean(),
    CourseEnrollment.findOne({ userId, courseId }),
  ]);
  if (!course || !lesson) throw errorWith("Course Lesson not found.", 404, "LESSON_NOT_FOUND");
  if (!enrollment) throw errorWith("Enroll in this Course before recording progress.", 409, "COURSE_ENROLLMENT_REQUIRED");
  const access = lesson.isPreview ? { allowed: true, resolution: null } : await ensureCourseAccess(course, userId);
  const position = Math.max(0, Math.min(Number(positionSeconds || 0), lesson.durationSeconds || Number(positionSeconds || 0)));
  if (completed && lesson.completionMode === "consume" && lesson.durationSeconds > 0 && position < lesson.durationSeconds * 0.9) {
    throw errorWith("Complete the required lesson content before marking it finished.", 422, "LESSON_COMPLETION_NOT_ELIGIBLE");
  }

  let progress = enrollment.lessonProgress.find((item) => item.lessonStableKey === lesson.stableKey);
  const wasNewProgress = !progress;
  if (!progress) {
    enrollment.lessonProgress.push({ lessonId: lesson._id, lessonStableKey: lesson.stableKey, startedAt: new Date(), lessonContentVersion: lesson.contentVersion });
    progress = enrollment.lessonProgress[enrollment.lessonProgress.length - 1];
  }
  progress.positionSeconds = position;
  progress.lastActivityAt = new Date();

  if (completed) {
    if (lesson.completionMode === "consume" && lesson.durationSeconds > 0 && position < lesson.durationSeconds * 0.9) {
      throw errorWith("Complete the required lesson content before marking it finished.", 422, "LESSON_COMPLETION_NOT_ELIGIBLE");
    }
    const hasCoding = lesson.lessonType === "coding" || (Array.isArray(lesson.codingBlocks) && lesson.codingBlocks.length > 0);
    if (hasCoding && !progress.exercisePassed) {
      throw errorWith("Complete and pass the coding exercise before marking this lesson finished.", 422, "EXERCISE_COMPLETION_REQUIRED");
    }
    const hasQuiz = Array.isArray(lesson.quizQuestions) && lesson.quizQuestions.length > 0;
    if (hasQuiz && !progress.quizPassed) {
      throw errorWith("Pass the lesson quiz before marking this lesson finished.", 422, "QUIZ_COMPLETION_REQUIRED");
    }
    if (!progress.completedAt) progress.completedAt = new Date();
  }

  enrollment.currentLessonId = lesson._id;
  enrollment.lastActivityAt = new Date();

  const eligibleLessons = await getEligibleCourseLessons(course._id);
  if (eligibleLessons && eligibleLessons.length > 0) {
    const progressCalc = calculateEnrollmentProgress(enrollment, eligibleLessons);
    enrollment.completedLessonCount = progressCalc.completedLessonCount;

    if (progressCalc.isCompleted) {
      await reconcileCourseCompletion(
        enrollment,
        eligibleLessons,
        userId,
        access.resolution?.plan || (course.accessLevel === "premium" ? "premium" : "free")
      );
    }
  } else {
    enrollment.completedLessonCount = (enrollment.lessonProgress || []).filter((item) => item.completedAt).length;
    if (course.lessonCount > 0 && enrollment.completedLessonCount >= course.lessonCount) {
      await reconcileCourseCompletion(
        enrollment,
        eligibleLessons,
        userId,
        access.resolution?.plan || (course.accessLevel === "premium" ? "premium" : "free")
      );
    }
  }

  await enrollment.save();
  const eventType = completed ? "lesson_completed" : wasNewProgress ? "lesson_started" : "lesson_resumed";
  await LearningEvent.create({
    userId,
    courseId,
    lessonId,
    eventType,
    idempotencyKey: String(idempotencyKey || crypto.randomUUID()).slice(0, 120),
    positionSeconds: position,
    entitlementPlan: access.resolution?.plan || (course.accessLevel === "premium" ? "premium" : "free"),
  }).catch((error) => { if (error.code !== 11000) throw error; });
  return enrollment;
};

const continueLearning = async (userId, limit = 8) => {
  const enrollments = await CourseEnrollment.find({ userId, status: { $in: ["active", "completed"] } })
    .select("courseId status currentLessonId completedLessonCount lastActivityAt completedAt lessonProgress")
    .populate({ path: "courseId", select: "title slug coverImage lessonCount accessLevel creatorId publicationStatus isDeleted", populate: { path: "creatorId", select: "displayName slug" } })
    .sort({ lastActivityAt: -1 })
    .limit(Math.min(20, Math.max(1, Number(limit) || 8)))
    .lean();

  const activeEnrollments = enrollments.filter((e) => e.courseId && e.courseId.publicationStatus === "published" && !e.courseId.isDeleted);

  const results = await Promise.all(activeEnrollments.map(async (enrollment) => {
    const eligibleLessons = await getEligibleCourseLessons(enrollment.courseId._id);
    const progressMeta = calculateEnrollmentProgress(enrollment, eligibleLessons);
    const nextLesson = resolveNextLesson(enrollment, eligibleLessons);

    return {
      courseId: enrollment.courseId,
      status: enrollment.status,
      currentLessonId: enrollment.currentLessonId,
      nextLessonId: nextLesson ? String(nextLesson._id) : null,
      nextLessonTitle: nextLesson ? nextLesson.title : null,
      completedLessonCount: progressMeta.completedLessonCount,
      totalEligibleLessons: progressMeta.totalEligibleLessons,
      progressPercent: progressMeta.progressPercent,
      isCompleted: progressMeta.isCompleted,
      lastActivityAt: enrollment.lastActivityAt,
      completedAt: enrollment.completedAt,
    };
  }));

  return results;
};

const CANONICAL_CODING_SLUGS = [
  "html-foundations",
  "css-foundations",
  "javascript-foundations",
  "python-foundations",
];

const getAdminCodingCourses = async () => {
  const courses = await Course.find({
    $or: [
      { slug: { $in: CANONICAL_CODING_SLUGS } },
      { isSystemOwned: true },
    ],
    isDeleted: false,
  }).sort({ createdAt: 1 }).lean();

  const results = await Promise.all(
    courses.map(async (course) => {
      const curriculum = await curriculumForCourse(course._id, null);
      return serializeCourse(course, { curriculum });
    })
  );
  return results;
};

const updateAdminCodingCourse = async (courseId, input) => {
  const isOid = mongoose.isValidObjectId(courseId);
  const query = isOid ? { _id: courseId, isDeleted: false } : { slug: courseId, isDeleted: false };
  const course = await Course.findOne(query);
  if (!course) throw errorWith("Course not found.", 404, "COURSE_NOT_FOUND");

  if (input.title !== undefined) course.title = String(input.title).trim();
  if (input.subtitle !== undefined) course.subtitle = String(input.subtitle).trim();
  if (input.description !== undefined) course.description = String(input.description).trim();
  if (input.level !== undefined) course.level = input.level;
  if (input.accessLevel !== undefined) {
    course.accessLevel = input.accessLevel === "premium" ? "premium" : "free";
    course.monetizationType = course.accessLevel === "premium" ? "PREMIUM_INCLUDED" : "FREE";
  }
  if (input.learningOutcomes !== undefined) course.learningOutcomes = uniqueStrings(input.learningOutcomes, 20);
  if (input.prerequisites !== undefined) course.prerequisites = uniqueStrings(input.prerequisites, 20);
  if (input.publicationStatus !== undefined && ["published", "draft", "archived"].includes(input.publicationStatus)) {
    course.publicationStatus = input.publicationStatus;
  }
  if (input.estimatedDurationMinutes !== undefined) course.estimatedDurationMinutes = Number(input.estimatedDurationMinutes) || 0;

  course.contentVersion += 1;
  await course.save();

  const curriculum = await curriculumForCourse(course._id, null);
  return serializeCourse(course.toObject(), { curriculum });
};

const getAdminCodingLesson = async (lessonId) => {
  const isOid = mongoose.isValidObjectId(lessonId);
  const lessonQuery = isOid ? { _id: lessonId, isDeleted: false } : { stableKey: lessonId, isDeleted: false };
  const lesson = await CourseLesson.findOne(lessonQuery)
    .select("+body +codingBlocks.solutionCode +codingBlocks.tests +quizQuestions.correctOptionIndex +quizQuestions.explanation +resourceIds")
    .lean();
  if (!lesson) throw errorWith("Lesson not found.", 404, "LESSON_NOT_FOUND");
  return lesson;
};

const updateAdminCodingLesson = async (lessonId, input) => {
  const isOid = mongoose.isValidObjectId(lessonId);
  const lessonQuery = isOid ? { _id: lessonId, isDeleted: false } : { stableKey: lessonId, isDeleted: false };
  const lesson = await CourseLesson.findOne(lessonQuery)
    .select("+body +codingBlocks.solutionCode +codingBlocks.tests +quizQuestions.correctOptionIndex +quizQuestions.explanation +resourceIds");
  if (!lesson) throw errorWith("Lesson not found.", 404, "LESSON_NOT_FOUND");

  if (input.title !== undefined) lesson.title = String(input.title).trim();
  if (input.description !== undefined) lesson.description = String(input.description).trim();
  if (input.body !== undefined) lesson.body = String(input.body);
  if (input.lessonType !== undefined) lesson.lessonType = input.lessonType;
  if (input.durationSeconds !== undefined) lesson.durationSeconds = Number(input.durationSeconds) || 0;
  if (input.isPreview !== undefined) lesson.isPreview = Boolean(input.isPreview);
  if (input.order !== undefined) lesson.order = Number(input.order) || 0;
  if (input.completionMode !== undefined) lesson.completionMode = input.completionMode;
  if (Array.isArray(input.resourceIds)) lesson.resourceIds = input.resourceIds;

  if (Array.isArray(input.codingBlocks)) {
    lesson.codingBlocks = input.codingBlocks.map((b, bIdx) => ({
      id: String(b.id || crypto.randomUUID()),
      blockType: b.blockType || "explanation",
      title: String(b.title || "").trim(),
      content: String(b.content || ""),
      language: String(b.language || "html"),
      starterCode: String(b.starterCode || ""),
      instructions: String(b.instructions || ""),
      expectedOutput: String(b.expectedOutput || ""),
      previewFixture: String(b.previewFixture || ""),
      hints: Array.isArray(b.hints) ? b.hints.map((h) => String(h).slice(0, 1000)) : [],
      validationRules: b.validationRules ? sanitizeValidationRules(b.validationRules) : null,
      solutionCode: String(b.solutionCode || ""),
      tests: Array.isArray(b.tests) ? b.tests.map((t) => ({
        description: String(t.description || ""),
        testCode: String(t.testCode || ""),
        hidden: Boolean(t.hidden),
      })) : [],
      order: Number(b.order ?? bIdx),
    }));
  }

  if (Array.isArray(input.quizQuestions)) {
    lesson.quizQuestions = input.quizQuestions.map((q, qIdx) => ({
      id: String(q.id || crypto.randomUUID()),
      question: String(q.question || "").trim(),
      options: Array.isArray(q.options) ? q.options.map((o) => ({ id: String(o.id || crypto.randomUUID()), text: String(o.text || "").trim() })) : [],
      correctOptionIndex: Number(q.correctOptionIndex ?? 0),
      explanation: String(q.explanation || "").trim(),
      order: Number(q.order ?? qIdx),
    }));
  }

  lesson.contentVersion += 1;
  await lesson.save();
  return lesson.toObject();
};

const listAdminCodingMaterials = async (query = {}) => {
  const filter = {};
  if (query.courseId) filter.courseId = query.courseId;
  if (query.lessonId) filter.lessonId = query.lessonId;
  if (query.resourceType) filter.resourceType = query.resourceType;
  if (query.resourceCategory) filter.resourceCategory = query.resourceCategory;

  const materials = await LearningResource.find(filter)
    .populate({ path: "courseId", select: "title slug" })
    .populate({ path: "lessonId", select: "title stableKey order" })
    .sort({ sortOrder: 1, createdAt: -1 })
    .lean();

  return materials;
};

const createAdminCodingMaterial = async (input) => {
  if (!input.title) throw errorWith("Material title is required.", 422, "TITLE_REQUIRED");
  if (!input.resourceType) throw errorWith("Material resourceType is required.", 422, "TYPE_REQUIRED");

  const baseSlug = slugify(input.title) || "material";
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const material = await LearningResource.create({
    isSystemOwned: true,
    title: String(input.title).trim(),
    slug,
    description: String(input.description || "").trim(),
    resourceType: input.resourceType,
    resourceCategory: input.resourceCategory || "general",
    accessLevel: input.accessLevel === "premium" ? "premium" : "free",
    externalUrl: String(input.externalUrl || "").trim(),
    filename: String(input.filename || "").trim(),
    textContent: String(input.textContent || ""),
    sizeBytes: Number(input.sizeBytes || 0),
    courseId: input.courseId || null,
    moduleId: input.moduleId || null,
    lessonId: input.lessonId || null,
    publicationStatus: input.publicationStatus || "published",
    sortOrder: Number(input.sortOrder || 0),
    rightsConfirmedAt: new Date(),
    publishedAt: input.publicationStatus === "published" ? new Date() : null,
  });

  return material;
};

const updateAdminCodingMaterial = async (id, input) => {
  const material = await LearningResource.findById(id);
  if (!material) throw errorWith("Material not found.", 404, "MATERIAL_NOT_FOUND");

  if (input.title !== undefined) material.title = String(input.title).trim();
  if (input.description !== undefined) material.description = String(input.description).trim();
  if (input.resourceType !== undefined) material.resourceType = input.resourceType;
  if (input.resourceCategory !== undefined) material.resourceCategory = input.resourceCategory;
  if (input.accessLevel !== undefined) material.accessLevel = input.accessLevel === "premium" ? "premium" : "free";
  if (input.externalUrl !== undefined) material.externalUrl = String(input.externalUrl).trim();
  if (input.filename !== undefined) material.filename = String(input.filename).trim();
  if (input.textContent !== undefined) material.textContent = String(input.textContent);
  if (input.sizeBytes !== undefined) material.sizeBytes = Number(input.sizeBytes) || 0;
  if (input.courseId !== undefined) material.courseId = input.courseId || null;
  if (input.moduleId !== undefined) material.moduleId = input.moduleId || null;
  if (input.lessonId !== undefined) material.lessonId = input.lessonId || null;
  if (input.publicationStatus !== undefined) {
    material.publicationStatus = input.publicationStatus;
    if (input.publicationStatus === "published" && !material.publishedAt) material.publishedAt = new Date();
  }
  if (input.sortOrder !== undefined) material.sortOrder = Number(input.sortOrder) || 0;

  await material.save();
  return material;
};

const deleteAdminCodingMaterial = async (id) => {
  const material = await LearningResource.findById(id);
  if (!material) throw errorWith("Material not found.", 404, "MATERIAL_NOT_FOUND");
  material.isDeleted = true;
  await material.save();
  return { deleted: true, id };
};

const listLearnerCodingResources = async (query = {}, userId = null) => {
  const filter = { publicationStatus: "published" };

  if (query.track) {
    const course = await Course.findOne({
      $or: [{ slug: query.track }, { slug: `${query.track}-foundations` }],
      isDeleted: false,
    }).select("_id").lean();
    if (course) filter.courseId = course._id;
  }

  if (query.category && query.category !== "all") {
    filter.resourceCategory = query.category;
  }

  if (query.type && query.type !== "all") {
    filter.resourceType = query.type;
  }

  const materials = await LearningResource.find(filter)
    .populate({ path: "courseId", select: "title slug accessLevel" })
    .populate({ path: "lessonId", select: "title stableKey" })
    .sort({ sortOrder: 1, createdAt: -1 })
    .lean();

  const accessCache = new Map();
  const serialized = await Promise.all(
    materials.map(async (item) => {
      let isAllowed = item.accessLevel === "free";
      if (!isAllowed) {
        if (!userId) {
          isAllowed = false;
        } else {
          if (!accessCache.has(userId)) {
            const access = await resolveLearnAccess({ userId, accessLevel: "premium" });
            accessCache.set(userId, access.allowed);
          }
          isAllowed = accessCache.get(userId);
        }
      }
      return serializeResource(item, { allowed: isAllowed });
    })
  );

  return serialized;
};

const slugToTrack = (slug) => {
  const s = String(slug || "").toLowerCase();
  if (s.includes("html")) return "html";
  if (s.includes("css")) return "css";
  if (s.includes("javascript") || s.includes("js")) return "javascript";
  if (s.includes("python") || s.includes("py")) return "python";
  return "html";
};

const createSubmission = async ({ courseSlug, lessonId, userId, payload }) => {
  if (!userId) throw errorWith("Authentication required.", 401, "UNAUTHENTICATED");
  if (!payload || typeof payload !== "object") throw errorWith("Invalid submission payload.", 400, "INVALID_PAYLOAD");

  const {
    blockId,
    codeSnapshot,
    status,
    testsPassed = 0,
    testsTotal = 0,
    runtimeMs = 0,
    validationSummary = [],
  } = payload;

  if (typeof codeSnapshot !== "string") {
    throw errorWith("Code snapshot is required and must be a string.", 400, "INVALID_CODE");
  }

  const byteLength = Buffer.byteLength(codeSnapshot, "utf8");
  if (byteLength > 65536) {
    throw errorWith("Code snapshot exceeds the 64 KB limit.", 400, "CODE_EXCEEDS_64KB");
  }

  const validStatuses = ["accepted", "partially_passed", "failed", "runtime_error", "syntax_error", "timeout"];
  if (!validStatuses.includes(status)) {
    throw errorWith("Invalid submission status.", 400, "INVALID_STATUS");
  }

  const courseQuery = mongoose.isValidObjectId(courseSlug) ? { _id: courseSlug } : { slug: courseSlug };
  const course = await Course.findOne({ ...courseQuery, publicationStatus: "published", isDeleted: false }).lean();
  if (!course) throw errorWith("Course not found.", 404, "COURSE_NOT_FOUND");

  await ensureCourseAccess(course, userId);

  const isOid = mongoose.isValidObjectId(lessonId);
  const lessonQuery = isOid
    ? { _id: lessonId, courseId: course._id, isDeleted: false }
    : { stableKey: lessonId, courseId: course._id, isDeleted: false };
  const lesson = await CourseLesson.findOne(lessonQuery).lean();
  if (!lesson) throw errorWith("Lesson not found.", 404, "LESSON_NOT_FOUND");

  const block = (lesson.codingBlocks || []).find((b) => !blockId || String(b.id) === String(blockId));
  if (!block) throw errorWith("Coding block not found.", 404, "CODING_BLOCK_NOT_FOUND");

  const sanitizedPassed = Math.max(0, Math.floor(Number(testsPassed) || 0));
  const sanitizedTotal = Math.max(0, Math.floor(Number(testsTotal) || 0));
  if (sanitizedPassed > sanitizedTotal) {
    throw errorWith("testsPassed cannot exceed testsTotal.", 400, "INVALID_TEST_COUNTS");
  }

  const sanitizedValidation = (Array.isArray(validationSummary) ? validationSummary : [])
    .slice(0, 50)
    .map((v) => ({
      description: String(v.description || v.name || "Check").slice(0, 500),
      passed: Boolean(v.passed),
      message: String(v.message || "").slice(0, 1000),
    }));

  const trackKey = slugToTrack(course.slug);

  const submission = await CodingSubmission.create({
    userId,
    courseId: course._id,
    lessonId: lesson._id,
    blockId: String(block.id || block._id || "block-1"),
    track: trackKey,
    language: block.language || "javascript",
    codeSnapshot,
    status,
    testsPassed: sanitizedPassed,
    testsTotal: sanitizedTotal,
    runtimeMs: Math.max(0, Math.min(60000, Math.floor(Number(runtimeMs) || 0))),
    validationSummary: sanitizedValidation,
    submittedAt: new Date(),
  });

  return {
    success: true,
    submission: {
      id: String(submission._id),
      courseId: String(submission.courseId),
      lessonId: String(submission.lessonId),
      blockId: submission.blockId,
      track: submission.track,
      language: submission.language,
      status: submission.status,
      testsPassed: submission.testsPassed,
      testsTotal: submission.testsTotal,
      runtimeMs: submission.runtimeMs,
      validationSummary: submission.validationSummary,
      submittedAt: submission.submittedAt,
      // Submission payloads are learner-authored history only. They never mutate mastery.
      exercisePassed: false,
    },
  };
};

const listSubmissions = async ({ courseSlug, lessonId, userId }) => {
  if (!userId) throw errorWith("Authentication required.", 401, "UNAUTHENTICATED");

  const courseQuery = mongoose.isValidObjectId(courseSlug) ? { _id: courseSlug } : { slug: courseSlug };
  const course = await Course.findOne({ ...courseQuery, isDeleted: false }).lean();
  if (!course) throw errorWith("Course not found.", 404, "COURSE_NOT_FOUND");

  const isOid = mongoose.isValidObjectId(lessonId);
  const lessonQuery = isOid
    ? { _id: lessonId, courseId: course._id, isDeleted: false }
    : { stableKey: lessonId, courseId: course._id, isDeleted: false };
  const lesson = await CourseLesson.findOne(lessonQuery).lean();
  if (!lesson) throw errorWith("Lesson not found.", 404, "LESSON_NOT_FOUND");

  const submissions = await CodingSubmission.find({
    userId,
    lessonId: lesson._id,
  })
    .sort({ submittedAt: -1 })
    .limit(50)
    .lean();

  return {
    success: true,
    submissions: submissions.map((s, index, arr) => ({
      id: String(s._id),
      submissionNumber: arr.length - index,
      status: s.status,
      testsPassed: s.testsPassed,
      testsTotal: s.testsTotal,
      language: s.language,
      runtimeMs: s.runtimeMs,
      submittedAt: s.submittedAt,
    })),
  };
};

const getSubmission = async ({ courseSlug, lessonId, submissionId, userId }) => {
  if (!userId) throw errorWith("Authentication required.", 401, "UNAUTHENTICATED");
  if (!mongoose.isValidObjectId(submissionId)) {
    throw errorWith("Invalid submission ID.", 400, "INVALID_SUBMISSION_ID");
  }

  const submission = await CodingSubmission.findById(submissionId).lean();
  if (!submission) throw errorWith("Submission not found.", 404, "SUBMISSION_NOT_FOUND");

  // Strict ownership check: only the author may view their code snapshot
  if (String(submission.userId) !== String(userId)) {
    throw errorWith("You are not authorized to view this submission.", 403, "FORBIDDEN");
  }

  return {
    success: true,
    submission: {
      id: String(submission._id),
      blockId: submission.blockId,
      track: submission.track,
      language: submission.language,
      codeSnapshot: submission.codeSnapshot,
      status: submission.status,
      testsPassed: submission.testsPassed,
      testsTotal: submission.testsTotal,
      runtimeMs: submission.runtimeMs,
      validationSummary: submission.validationSummary,
      submittedAt: submission.submittedAt,
    },
  };
};


// ─── CMS: system-author identity ────────────────────────────────────────────
const SYSTEM_LEARNING_SLUG = "myjourney-learning";

/**
 * Resolves the system-owned CreatorProfile for new Coding CMS tracks.
 * Uses the same slug as seedCodingCurriculum.js — idempotent, never creates duplicates.
 */
const resolveSystemCreator = async () => {
  const CreatorProfile = require("../models/CreatorProfile");
  const profile = await CreatorProfile.findOne({ slug: SYSTEM_LEARNING_SLUG }).select("_id").lean();
  if (!profile) {
    throw errorWith(
      "System creator profile 'myjourney-learning' not found. Run the coding curriculum seeder first.",
      500,
      "SYSTEM_CREATOR_MISSING"
    );
  }
  return profile._id;
};

// ─── CMS: VALID_VALIDATION_RULE_TYPES — server-side whitelist (Amendment #9) ─
const VALID_VALIDATION_RULE_TYPES = new Set([
  // HTML
  "element_exists", "element_attribute", "text_content",
  // CSS
  "selector_property", "has_media_query",
  // JS / Python
  "output_contains", "stdout_contains",
  "output_pattern", "stdout_pattern",
  "code_contains", "syntax_contains",
  "pattern",
]);

const VALID_VALIDATION_FIELDS = new Set([
  "selector", "attribute", "value", "pattern",
  "property", "expected", "description", "message",
]);

const sanitizeValidationRules = (rules) => {
  if (!Array.isArray(rules)) return null;
  return rules.slice(0, 50).map((r) => {
    if (!r || typeof r !== "object") return null;
    if (!VALID_VALIDATION_RULE_TYPES.has(r.type)) return null;
    const safe = { type: r.type };
    for (const key of VALID_VALIDATION_FIELDS) {
      if (r[key] !== undefined) safe[key] = String(r[key]).slice(0, 2000);
    }
    return safe;
  }).filter(Boolean);
};

// ─── CMS: RUNTIME VALIDATION (Amendment #3) ──────────────────────────────────
const SUPPORTED_RUNTIMES = new Set(["html", "css", "javascript", "python"]);

const assertRuntimeAvailable = (language) => {
  if (language && !SUPPORTED_RUNTIMES.has(String(language).toLowerCase())) {
    throw errorWith(
      `Runtime '${language}' is not currently available for learner execution. Save as Draft only.`,
      400,
      "RUNTIME_NOT_AVAILABLE"
    );
  }
};

// ─── CMS: createAdminCodingCourse ─────────────────────────────────────────────
/**
 * Creates a new system-owned Coding track (Course).
 * System ownership is enforced; no Creator Studio leak.
 * Uses the existing "myjourney-learning" creator profile idempotently (Amendment #12).
 * New tracks default to publicationStatus=draft (Amendment #18 — never auto-publish).
 * Adding the field does not break the four canonical tracks (Amendment #11).
 */
const createAdminCodingCourse = async (input) => {
  if (!input.title || !String(input.title).trim()) {
    throw errorWith("Track title is required.", 422, "TITLE_REQUIRED");
  }
  if (!input.language || !String(input.language).trim()) {
    throw errorWith("Track language is required (e.g. html, css, javascript, python).", 422, "LANGUAGE_REQUIRED");
  }

  const creatorId = await resolveSystemCreator();
  const slug = await findAvailableSlug(String(input.title).trim());

  const course = await Course.create({
    creatorId,
    title: String(input.title).trim(),
    slug,
    subtitle: String(input.subtitle || "").trim(),
    description: String(input.description || input.title).trim(),
    language: String(input.language).trim().toLowerCase(),
    level: ["beginner", "intermediate", "advanced", "all_levels"].includes(input.level) ? input.level : "beginner",
    accessLevel: input.accessLevel === "premium" ? "premium" : "free",
    monetizationType: input.accessLevel === "premium" ? "PREMIUM_INCLUDED" : "FREE",
    publicationStatus: "draft",
    workflowStatus: "draft",
    isSystemOwned: true,
    rightsConfirmedAt: new Date(),
    estimatedDurationMinutes: Number(input.estimatedDurationMinutes || 0) || 0,
    learningOutcomes: Array.isArray(input.learningOutcomes) ? uniqueStrings(input.learningOutcomes, 20) : [],
    prerequisites: Array.isArray(input.prerequisites) ? uniqueStrings(input.prerequisites, 20) : [],
  });

  return serializeCourse(course.toObject(), {});
};

// ─── CMS: createAdminCodingModule ─────────────────────────────────────────────
const createAdminCodingModule = async (courseId, input) => {
  const isOid = mongoose.isValidObjectId(courseId);
  const courseQ = isOid ? { _id: courseId } : { slug: courseId };
  const course = await Course.findOne({ ...courseQ, isDeleted: false }).lean();
  if (!course) throw errorWith("Course not found.", 404, "COURSE_NOT_FOUND");
  if (!course.isSystemOwned && !CANONICAL_CODING_SLUGS.includes(course.slug)) {
    throw errorWith("Forbidden: course is not a system-owned Coding track.", 403, "NOT_SYSTEM_COURSE");
  }
  if (!input.title || !String(input.title).trim()) {
    throw errorWith("Module title is required.", 422, "TITLE_REQUIRED");
  }

  // Place new module at end (highest existing order + 1)
  const maxOrderDoc = await CourseModule.findOne({ courseId: course._id, isDeleted: false })
    .sort({ order: -1 }).select("order").lean();
  const newOrder = (maxOrderDoc ? maxOrderDoc.order : -1) + 1;

  const stableKey = `module-${String(course.slug).replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}`;

  const module = await CourseModule.create({
    courseId: course._id,
    creatorId: course.creatorId,
    title: String(input.title).trim(),
    description: String(input.description || "").trim().slice(0, 1200),
    order: newOrder,
    stableKey,
  });

  // Update moduleCount on course
  const moduleCount = await CourseModule.countDocuments({ courseId: course._id, isDeleted: false });
  await Course.updateOne({ _id: course._id }, { moduleCount, structuralVersion: course.structuralVersion + 1 });

  return { id: String(module._id), stableKey: module.stableKey, title: module.title, description: module.description, order: module.order };
};

// ─── CMS: updateAdminCodingModule ─────────────────────────────────────────────
const updateAdminCodingModule = async (courseId, moduleId, input) => {
  const course = await Course.findOne({
    ...(mongoose.isValidObjectId(courseId) ? { _id: courseId } : { slug: courseId }),
    isDeleted: false,
  }).select("_id isSystemOwned slug").lean();
  if (!course) throw errorWith("Course not found.", 404, "COURSE_NOT_FOUND");
  if (!course.isSystemOwned && !CANONICAL_CODING_SLUGS.includes(course.slug)) {
    throw errorWith("Forbidden: course is not a system-owned Coding track.", 403, "NOT_SYSTEM_COURSE");
  }

  const mod = await CourseModule.findOne({ _id: moduleId, courseId: course._id, isDeleted: false });
  if (!mod) throw errorWith("Module not found.", 404, "MODULE_NOT_FOUND");

  if (input.title !== undefined) mod.title = String(input.title).trim();
  if (input.description !== undefined) mod.description = String(input.description).trim().slice(0, 1200);
  await mod.save();

  return { id: String(mod._id), stableKey: mod.stableKey, title: mod.title, description: mod.description, order: mod.order };
};

// ─── CMS: deleteAdminCodingModule ─────────────────────────────────────────────
const deleteAdminCodingModule = async (courseId, moduleId) => {
  const course = await Course.findOne({
    ...(mongoose.isValidObjectId(courseId) ? { _id: courseId } : { slug: courseId }),
    isDeleted: false,
  }).select("_id isSystemOwned slug structuralVersion").lean();
  if (!course) throw errorWith("Course not found.", 404, "COURSE_NOT_FOUND");
  if (!course.isSystemOwned && !CANONICAL_CODING_SLUGS.includes(course.slug)) {
    throw errorWith("Forbidden: course is not a system-owned Coding track.", 403, "NOT_SYSTEM_COURSE");
  }

  const mod = await CourseModule.findOne({ _id: moduleId, courseId: course._id, isDeleted: false });
  if (!mod) throw errorWith("Module not found.", 404, "MODULE_NOT_FOUND");

  // Soft-delete module (Amendment #2)
  mod.isDeleted = true;
  await mod.save();

  // Soft-delete lessons within this module (preserve enrollments/analytics per Amendment #2)
  await CourseLesson.updateMany({ moduleId: mod._id, isDeleted: false }, { isDeleted: true });

  const moduleCount = await CourseModule.countDocuments({ courseId: course._id, isDeleted: false });
  const lessonCount = await CourseLesson.countDocuments({ courseId: course._id, isDeleted: false });
  await Course.updateOne({ _id: course._id }, { moduleCount, lessonCount, structuralVersion: course.structuralVersion + 1 });

  return { deleted: true, moduleId };
};

// ─── CMS: reorderAdminCodingModules ──────────────────────────────────────────
/**
 * Accepts: { orderedIds: [moduleId, moduleId, ...] }
 * Re-assigns order 0,1,2,… to the given IDs in sequence.
 */
const reorderAdminCodingModules = async (courseId, input) => {
  const course = await Course.findOne({
    ...(mongoose.isValidObjectId(courseId) ? { _id: courseId } : { slug: courseId }),
    isDeleted: false,
  }).select("_id isSystemOwned slug").lean();
  if (!course) throw errorWith("Course not found.", 404, "COURSE_NOT_FOUND");
  if (!course.isSystemOwned && !CANONICAL_CODING_SLUGS.includes(course.slug)) {
    throw errorWith("Forbidden.", 403, "NOT_SYSTEM_COURSE");
  }
  if (!Array.isArray(input.orderedIds) || input.orderedIds.length === 0) {
    throw errorWith("orderedIds array is required.", 422, "ORDERED_IDS_REQUIRED");
  }

  const existingModules = await CourseModule.find({ courseId: course._id, isDeleted: false }).select("_id").lean();
  const existingIds = new Set(existingModules.map((m) => String(m._id)));

  for (const id of input.orderedIds) {
    if (!existingIds.has(String(id))) {
      throw errorWith(`Module ${id} does not belong to this course.`, 422, "INVALID_MODULE_ID");
    }
  }

  await Promise.all(
    input.orderedIds.map((id, idx) =>
      CourseModule.updateOne({ _id: id, courseId: course._id }, { order: idx })
    )
  );

  return { reordered: true };
};

// ─── CMS: createAdminCodingLesson ─────────────────────────────────────────────
const createAdminCodingLesson = async (courseId, moduleId, input) => {
  const course = await Course.findOne({
    ...(mongoose.isValidObjectId(courseId) ? { _id: courseId } : { slug: courseId }),
    isDeleted: false,
  }).select("_id isSystemOwned slug creatorId structuralVersion lessonCount").lean();
  if (!course) throw errorWith("Course not found.", 404, "COURSE_NOT_FOUND");
  if (!course.isSystemOwned && !CANONICAL_CODING_SLUGS.includes(course.slug)) {
    throw errorWith("Forbidden: course is not a system-owned Coding track.", 403, "NOT_SYSTEM_COURSE");
  }

  const mod = await CourseModule.findOne({ _id: moduleId, courseId: course._id, isDeleted: false }).lean();
  if (!mod) throw errorWith("Module not found.", 404, "MODULE_NOT_FOUND");

  if (!input.title || !String(input.title).trim()) {
    throw errorWith("Lesson title is required.", 422, "TITLE_REQUIRED");
  }

  // Check runtime if lesson is coding type (Amendment #3) — only on publish, but warn on create
  const lessonType = input.lessonType || "coding";

  const maxOrderDoc = await CourseLesson.findOne({ moduleId: mod._id, isDeleted: false })
    .sort({ order: -1 }).select("order").lean();
  const newOrder = (maxOrderDoc ? maxOrderDoc.order : -1) + 1;

  const stableKey = `lesson-${String(course.slug).replace(/[^a-z0-9]/g, "-")}-${Date.now().toString(36)}-${crypto.randomBytes(3).toString("hex")}`;

  const lesson = await CourseLesson.create({
    courseId: course._id,
    moduleId: mod._id,
    creatorId: course.creatorId,
    title: String(input.title).trim(),
    description: String(input.description || "").trim(),
    lessonType,
    order: newOrder,
    stableKey,
    isPreview: Boolean(input.isPreview || false),
    publicationStatus: "draft",
    workflowStatus: "draft",
    body: String(input.body || ""),
    codingBlocks: [],
    quizQuestions: [],
  });

  const lessonCount = await CourseLesson.countDocuments({ courseId: course._id, isDeleted: false });
  await Course.updateOne({ _id: course._id }, { lessonCount, structuralVersion: course.structuralVersion + 1 });

  return { id: String(lesson._id), stableKey: lesson.stableKey, title: lesson.title, lessonType: lesson.lessonType, order: lesson.order };
};

// ─── CMS: deleteAdminCodingLesson ─────────────────────────────────────────────
const deleteAdminCodingLesson = async (lessonId) => {
  const lesson = await CourseLesson.findOne({ _id: lessonId, isDeleted: false })
    .select("+body").lean();
  if (!lesson) throw errorWith("Lesson not found.", 404, "LESSON_NOT_FOUND");

  const course = await Course.findOne({ _id: lesson.courseId, isDeleted: false })
    .select("_id isSystemOwned slug lessonCount structuralVersion").lean();
  if (!course) throw errorWith("Course not found.", 404, "COURSE_NOT_FOUND");
  if (!course.isSystemOwned && !CANONICAL_CODING_SLUGS.includes(course.slug)) {
    throw errorWith("Forbidden: lesson is not part of a system-owned Coding track.", 403, "NOT_SYSTEM_COURSE");
  }

  // Soft-delete; preserve enrollments, LearningEvents, CodingSubmissions (Amendment #2)
  await CourseLesson.updateOne({ _id: lesson._id }, { isDeleted: true });

  const lessonCount = await CourseLesson.countDocuments({ courseId: course._id, isDeleted: false });
  await Course.updateOne({ _id: course._id }, { lessonCount, structuralVersion: course.structuralVersion + 1 });

  return { deleted: true, lessonId };
};

// ─── CMS: reorderAdminCodingLessons ──────────────────────────────────────────
const reorderAdminCodingLessons = async (courseId, moduleId, input) => {
  const course = await Course.findOne({
    ...(mongoose.isValidObjectId(courseId) ? { _id: courseId } : { slug: courseId }),
    isDeleted: false,
  }).select("_id isSystemOwned slug").lean();
  if (!course) throw errorWith("Course not found.", 404, "COURSE_NOT_FOUND");
  if (!course.isSystemOwned && !CANONICAL_CODING_SLUGS.includes(course.slug)) {
    throw errorWith("Forbidden.", 403, "NOT_SYSTEM_COURSE");
  }

  const mod = await CourseModule.findOne({ _id: moduleId, courseId: course._id, isDeleted: false }).lean();
  if (!mod) throw errorWith("Module not found.", 404, "MODULE_NOT_FOUND");

  if (!Array.isArray(input.orderedIds) || input.orderedIds.length === 0) {
    throw errorWith("orderedIds array is required.", 422, "ORDERED_IDS_REQUIRED");
  }

  const existingLessons = await CourseLesson.find({ moduleId: mod._id, isDeleted: false }).select("_id").lean();
  const existingIds = new Set(existingLessons.map((l) => String(l._id)));

  for (const id of input.orderedIds) {
    if (!existingIds.has(String(id))) {
      throw errorWith(`Lesson ${id} does not belong to this module.`, 422, "INVALID_LESSON_ID");
    }
  }

  await Promise.all(
    input.orderedIds.map((id, idx) =>
      CourseLesson.updateOne({ _id: id, moduleId: mod._id }, { order: idx })
    )
  );

  return { reordered: true };
};

// ─── CMS: publishAdminCodingCourse ────────────────────────────────────────────
/**
 * Server-side runtime validation (Amendment #3): if course has runnable lessons
 * with unsupported runtimes, reject with RUNTIME_NOT_AVAILABLE.
 * Admin can still save as Draft even for unsupported runtimes.
 */
const publishAdminCodingCourse = async (courseId) => {
  const isOid = mongoose.isValidObjectId(courseId);
  const course = await Course.findOne({
    ...(isOid ? { _id: courseId } : { slug: courseId }),
    isDeleted: false,
  });
  if (!course) throw errorWith("Course not found.", 404, "COURSE_NOT_FOUND");
  if (!course.isSystemOwned && !CANONICAL_CODING_SLUGS.includes(course.slug)) {
    throw errorWith("Forbidden.", 403, "NOT_SYSTEM_COURSE");
  }

  // Validate all coding lesson runtimes before publish
  const runnableLessons = await CourseLesson.find({
    courseId: course._id,
    lessonType: "coding",
    isDeleted: false,
  }).select("codingBlocks title").lean();

  for (const lesson of runnableLessons) {
    for (const block of lesson.codingBlocks || []) {
      if (!SUPPORTED_RUNTIMES.has(String(block.language || "").toLowerCase())) {
        throw errorWith(
          `Lesson '${lesson.title}' uses runtime '${block.language}' which is not available. Use Save Draft instead.`,
          400,
          "RUNTIME_NOT_AVAILABLE"
        );
      }
    }
  }

  course.publicationStatus = "published";
  course.workflowStatus = "approved";
  if (!course.publishedAt) course.publishedAt = new Date();
  course.contentVersion += 1;
  await course.save();

  const curriculum = await curriculumForCourse(course._id);
  return serializeCourse(course.toObject(), { curriculum });
};

// ─── CMS: archiveAdminCodingCourse ────────────────────────────────────────────
/**
 * Soft-archive: sets publicationStatus='archived'.
 * Record remains visible to Admin (Amendment #2). No enrollments/analytics deleted.
 */
const archiveAdminCodingCourse = async (courseId) => {
  const isOid = mongoose.isValidObjectId(courseId);
  const course = await Course.findOne({
    ...(isOid ? { _id: courseId } : { slug: courseId }),
    isDeleted: false,
  });
  if (!course) throw errorWith("Course not found.", 404, "COURSE_NOT_FOUND");
  if (!course.isSystemOwned && !CANONICAL_CODING_SLUGS.includes(course.slug)) {
    throw errorWith("Forbidden.", 403, "NOT_SYSTEM_COURSE");
  }

  course.publicationStatus = "archived";
  course.contentVersion += 1;
  await course.save();

  return { archived: true, id: String(course._id), publicationStatus: course.publicationStatus };
};

// ─── CMS: bulkUpdateAdminCodingAccess ────────────────────────────────────────
/**
 * Validates every ID belongs to system/canonical Coding content (Amendment #16).
 * Does NOT accept arbitrary Course IDs from creator-owned content (Amendment #17).
 */
const bulkUpdateAdminCodingAccess = async (courseIds, accessLevel) => {
  if (!Array.isArray(courseIds) || courseIds.length === 0) {
    throw errorWith("courseIds array is required.", 422, "COURSE_IDS_REQUIRED");
  }
  if (!["free", "premium"].includes(accessLevel)) {
    throw errorWith("accessLevel must be 'free' or 'premium'.", 422, "INVALID_ACCESS_LEVEL");
  }

  // Validate all IDs belong to system/canonical coding content (Amendment #16 + #17)
  const courses = await Course.find({
    _id: { $in: courseIds },
    isDeleted: false,
    $or: [{ isSystemOwned: true }, { slug: { $in: CANONICAL_CODING_SLUGS } }],
  }).select("_id").lean();

  if (courses.length !== courseIds.length) {
    throw errorWith(
      "One or more course IDs are not system-owned Coding tracks. Bulk access update rejected.",
      422,
      "NOT_ALL_SYSTEM_COURSES"
    );
  }

  const monetizationType = accessLevel === "premium" ? "PREMIUM_INCLUDED" : "FREE";
  await Course.updateMany(
    { _id: { $in: courseIds } },
    { accessLevel, monetizationType }
  );

  return { updated: courses.length, accessLevel };
};

// ─── CMS: bulkPublishAdminCodingLessons ──────────────────────────────────────
const bulkPublishAdminCodingLessons = async (lessonIds) => {
  if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
    throw errorWith("lessonIds array is required.", 422, "LESSON_IDS_REQUIRED");
  }

  // Validate all lessons belong to system/canonical coding courses (Amendment #16)
  const lessons = await CourseLesson.find({ _id: { $in: lessonIds }, isDeleted: false })
    .select("courseId").lean();

  if (lessons.length !== lessonIds.length) {
    throw errorWith("One or more lesson IDs not found.", 422, "LESSON_NOT_FOUND");
  }

  const courseIds = [...new Set(lessons.map((l) => String(l.courseId)))];
  const ownerCount = await Course.countDocuments({
    _id: { $in: courseIds },
    isDeleted: false,
    $or: [{ isSystemOwned: true }, { slug: { $in: CANONICAL_CODING_SLUGS } }],
  });

  if (ownerCount !== courseIds.length) {
    throw errorWith(
      "One or more lessons belong to non-system courses. Bulk publish rejected.",
      422,
      "NOT_ALL_SYSTEM_LESSONS"
    );
  }

  // Validate runtimes before bulk publish (Amendment #3)
  const codingLessons = await CourseLesson.find({
    _id: { $in: lessonIds },
    lessonType: "coding",
    isDeleted: false,
  }).select("codingBlocks title").lean();

  for (const lesson of codingLessons) {
    for (const block of lesson.codingBlocks || []) {
      if (!SUPPORTED_RUNTIMES.has(String(block.language || "").toLowerCase())) {
        throw errorWith(
          `Lesson '${lesson.title}' uses runtime '${block.language}' which is not supported. Remove it from the bulk selection.`,
          400,
          "RUNTIME_NOT_AVAILABLE"
        );
      }
    }
  }

  await CourseLesson.updateMany(
    { _id: { $in: lessonIds } },
    { publicationStatus: "published", workflowStatus: "approved" }
  );

  return { published: lessons.length };
};

module.exports = {

  continueLearning,
  createCourse,
  curriculumForCourse,
  enroll,
  evaluateQuiz,
  findAvailableSlug,
  getCourseDetail,
  getLesson,
  listCourses,
  recordExerciseAttempt,
  recordProgress,
  replaceCurriculum,
  revealSolution,
  submitCourse,
  updateCourse,
  getAdminCodingCourses,
  updateAdminCodingCourse,
  getAdminCodingLesson,
  updateAdminCodingLesson,
  listAdminCodingMaterials,
  createAdminCodingMaterial,
  updateAdminCodingMaterial,
  deleteAdminCodingMaterial,
  listLearnerCodingResources,
  createSubmission,
  listSubmissions,
  getSubmission,
  // CMS - Track/Module/Lesson management
  createAdminCodingCourse,
  createAdminCodingModule,
  updateAdminCodingModule,
  deleteAdminCodingModule,
  reorderAdminCodingModules,
  createAdminCodingLesson,
  deleteAdminCodingLesson,
  reorderAdminCodingLessons,
  publishAdminCodingCourse,
  archiveAdminCodingCourse,
  bulkUpdateAdminCodingAccess,
  bulkPublishAdminCodingLessons,
  sanitizeValidationRules,
  // Phase 7 Canonical Mastery Helpers
  getEligibleCourseLessons,
  deriveLessonState,
  calculateEnrollmentProgress,
  resolveNextLesson,
  reconcileCourseCompletion,
};
