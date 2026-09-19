const crypto = require("crypto");
const mongoose = require("mongoose");
const Course = require("../models/Course");
const CourseModule = require("../models/CourseModule");
const CourseLesson = require("../models/CourseLesson");
const CourseEnrollment = require("../models/CourseEnrollment");
const LearningEvent = require("../models/LearningEvent");
const Topic = require("../models/Topic");
const { resolveLearnAccess } = require("./accessPolicy");
const { serializeCourse, serializeLesson, serializeLessonMetadata } = require("./serializers");
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
  const [curriculum, enrollment] = await Promise.all([
    curriculumForCourse(course._id),
    userId ? CourseEnrollment.findOne({ userId, courseId: course._id }).select("status currentLessonId completedLessonCount lastActivityAt lessonProgress completedAt").lean() : null,
  ]);
  return serializeCourse(course, { curriculum, enrollment });
};

const getLesson = async ({ courseSlug, lessonId, userId = null, creatorId = null, admin = false }) => {
  // Studio preview authority is limited to the authenticated Creator's own
  // Course. Free access and preview flags never bypass that ownership check.
  const courseScope = admin ? {} : creatorId ? { creatorId } : { publicationStatus: "published" };
  const course = await Course.findOne({ slug: courseSlug, ...courseScope, isDeleted: false }).lean();
  if (!course) throw errorWith("Course not found.", 404, "COURSE_NOT_FOUND");
  const owner = creatorId && String(course.creatorId) === String(creatorId);
  const lesson = await CourseLesson.findOne({ _id: lessonId, courseId: course._id, isDeleted: false })
    .select("+body +mediaAssetId +transcript +captions +resourceIds")
    .lean();
  if (!lesson) throw errorWith("Lesson not found.", 404, "LESSON_NOT_FOUND");
  const access = lesson.isPreview
    ? { allowed: true, reason: "preview" }
    : await resolveLearnAccess({ userId, accessLevel: course.accessLevel, owner, admin });
  if (!access.allowed) throw errorWith("MyJourney Premium is required for this lesson.", 403, "PREMIUM_REQUIRED");

  let progress = null;
  if (userId && !owner && !admin) {
    try {
      const enrollment = await CourseEnrollment.findOne({ userId, courseId: course._id }).select("lessonProgress").lean();
      const lp = enrollment?.lessonProgress?.find((item) => item.lessonStableKey === lesson.stableKey);
      if (lp) {
        progress = {
          exercisePassed: Boolean(lp.exercisePassed),
          quizPassed: Boolean(lp.quizPassed),
          solutionViewed: Boolean(lp.solutionViewed),
          completed: Boolean(lp.completedAt),
          exerciseAttempts: lp.exerciseAttempts || 0,
        };
      }
    } catch {
      progress = null;
    }
  }

  return { course: serializeCourse(course), lesson: serializeLesson(lesson, { allowed: true }), accessReason: access.reason, progress };
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
  const access = await resolveLearnAccess({ userId, accessLevel: course.accessLevel });
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
  const [course, lesson] = await Promise.all([
    Course.findOne({ ...courseQuery, publicationStatus: "published", isDeleted: false }).lean(),
    CourseLesson.findOne({ _id: lessonId, isDeleted: false }).lean(),
  ]);
  if (!course || !lesson) throw errorWith("Course Lesson not found.", 404, "LESSON_NOT_FOUND");
  await ensureCourseAccess(course, userId);

  const enrollment = await CourseEnrollment.findOne({ userId, courseId: course._id });
  if (!enrollment) throw errorWith("Enroll in this Course before recording progress.", 403, "ENROLLMENT_REQUIRED");

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
  if (passed === true) {
    progress.exercisePassed = true;
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

  const lesson = await CourseLesson.findOne({ _id: lessonId, courseId: course._id, isDeleted: false })
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
  progress.lastActivityAt = new Date();
  if (passed) {
    progress.quizPassed = true;
  }
  enrollment.lastActivityAt = new Date();
  await enrollment.save();

  return { success: true, passed, score: scorePercent, correctCount, totalQuestions: total, results };
};

const revealSolution = async ({ courseSlug, courseId, lessonId, userId, blockId }) => {
  const courseQuery = courseId ? { _id: courseId } : { slug: courseSlug };
  const course = await Course.findOne({ ...courseQuery, publicationStatus: "published", isDeleted: false }).lean();
  if (!course) throw errorWith("Course not found.", 404, "COURSE_NOT_FOUND");
  await ensureCourseAccess(course, userId);

  const lesson = await CourseLesson.findOne({ _id: lessonId, courseId: course._id, isDeleted: false })
    .select("+codingBlocks.solutionCode")
    .lean();
  if (!lesson) throw errorWith("Lesson not found.", 404, "LESSON_NOT_FOUND");

  const block = (lesson.codingBlocks || []).find((b) => !blockId || String(b.id) === String(blockId));
  if (!block) throw errorWith("Coding block not found.", 404, "CODING_BLOCK_NOT_FOUND");

  const enrollment = await CourseEnrollment.findOne({ userId, courseId: course._id });
  if (!enrollment) throw errorWith("Enroll in this Course before viewing solutions.", 403, "ENROLLMENT_REQUIRED");

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
  if (completed && !progress.completedAt) progress.completedAt = new Date();

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
  enrollment.completedLessonCount = enrollment.lessonProgress.filter((item) => item.completedAt).length;
  if (course.lessonCount > 0 && enrollment.completedLessonCount >= course.lessonCount) {
    enrollment.status = "completed";
    enrollment.completedAt = enrollment.completedAt || new Date();
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

const continueLearning = async (userId, limit = 8) => CourseEnrollment.find({ userId, status: { $in: ["active", "completed"] } })
  .select("courseId status currentLessonId completedLessonCount lastActivityAt completedAt")
  .populate({ path: "courseId", select: "title slug coverImage lessonCount accessLevel creatorId", populate: { path: "creatorId", select: "displayName slug" } })
  .sort({ lastActivityAt: -1 })
  .limit(Math.min(20, Math.max(1, Number(limit) || 8)))
  .lean();

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
};
