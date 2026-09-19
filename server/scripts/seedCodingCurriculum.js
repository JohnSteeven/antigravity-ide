/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  seedCodingCurriculum.js — Idempotent Seeder for Phase 6 Coding Tracks
 *  MyJourney Platform | Interactive Coding Curriculum
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Curricula:
 *    1. HTML Foundations (12 lessons, FREE)
 *    2. CSS Foundations (13 lessons, FREE)
 *    3. JavaScript Foundations (15 lessons, PREMIUM_INCLUDED)
 *    4. Python Foundations (15 lessons, PREMIUM_INCLUDED)
 *
 *  Author:
 *    System-owned author: "MyJourney Learning" (slug: myjourney-learning)
 *
 *  Usage:
 *    node server/scripts/seedCodingCurriculum.js
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const crypto = require("crypto");
const mongoose = require("mongoose");
const connectDb = require("../config/db");

const User = require("../models/User");
const CreatorApplication = require("../models/CreatorApplication");
const CreatorProfile = require("../models/CreatorProfile");
const Course = require("../models/Course");
const CourseModule = require("../models/CourseModule");
const CourseLesson = require("../models/CourseLesson");

const { canonicalCourses } = require("../data/phase6Courses");

const SYSTEM_LEARNING_USERNAME = "myjourney-learning";
const SYSTEM_LEARNING_EMAIL = "learning@myjourney.internal";
const SYSTEM_LEARNING_MOBILE = "+10000000001";
const UNUSABLE_PASSWORD_HASH = "$2b$10$" + "X".repeat(53);

/**
 * Ensures system curriculum author account and creator profile exist.
 */
async function ensureSystemAuthor() {
  let user = await User.findOne({ username: SYSTEM_LEARNING_USERNAME });
  if (!user) {
    user = await User.create({
      firstName: "MyJourney",
      lastName: "Learning",
      username: SYSTEM_LEARNING_USERNAME,
      email: SYSTEM_LEARNING_EMAIL,
      mobile: SYSTEM_LEARNING_MOBILE,
      passwordHash: UNUSABLE_PASSWORD_HASH,
      role: "Admin",
      status: "ACTIVE",
    });
  }

  let application = await CreatorApplication.findOne({ userId: user._id });
  if (!application) {
    application = await CreatorApplication.create({
      userId: user._id,
      status: "approved",
      legalName: "MyJourney System",
      displayName: "MyJourney Learning",
      headline: "Curated technical curriculum & interactive coding system",
      biography: "Official curated coding and technical curriculum for MyJourney.",
      motivation: "System-managed foundational coding tracks.",
      termsAcceptedAt: new Date(),
      contentRightsAcceptedAt: new Date(),
      submittedAt: new Date(),
      reviewedAt: new Date(),
      reviewedBy: user._id,
    });
  }

  let creatorProfile = await CreatorProfile.findOne({ slug: SYSTEM_LEARNING_USERNAME });
  if (!creatorProfile) {
    creatorProfile = await CreatorProfile.create({
      creatorKey: `system-creator-${SYSTEM_LEARNING_USERNAME}`,
      userId: user._id,
      applicationId: application._id,
      slug: SYSTEM_LEARNING_USERNAME,
      displayName: "MyJourney Learning",
      headline: "Curated technical curriculum & interactive coding system",
      biography: "Official curated coding and technical curriculum for MyJourney. All exercises and projects run safely client-side.",
      specialties: ["HTML", "CSS", "JavaScript", "Python", "Web Development"],
      languages: ["English"],
      creatorTypes: ["educator", "developer"],
      status: "approved",
      verifiedAt: new Date(),
      verifiedBy: user._id,
      permissions: {
        canPublishWithoutReview: true,
        canScheduleDirectly: true,
      },
    });
  }

  return { user, creatorProfile };
}

/**
 * Splits course lessons into balanced logical modules.
 */
function partitionLessonsIntoModules(lessons, courseSlug) {
  const total = lessons.length;
  if (total <= 6) {
    return [
      {
        title: "Course Curriculum",
        description: "Foundational concepts, exercises, and assessments.",
        lessons,
      },
    ];
  }

  if (total <= 13) {
    const mid = Math.ceil(total / 2);
    return [
      {
        title: "Part 1: Core Fundamentals",
        description: "Essential concepts, syntax, and foundational patterns.",
        lessons: lessons.slice(0, mid),
      },
      {
        title: "Part 2: Advanced Topics & Projects",
        description: "Real-world implementations, layouts, and capstone challenges.",
        lessons: lessons.slice(mid),
      },
    ];
  }

  // 14+ lessons: 3 modules
  const chunk1 = Math.ceil(total / 3);
  const chunk2 = Math.ceil((total - chunk1) / 2);
  return [
    {
      title: "Module 1: Syntax & Foundations",
      description: "Getting started with core language features and execution.",
      lessons: lessons.slice(0, chunk1),
    },
    {
      title: "Module 2: Structures & Techniques",
      description: "Data structures, functions, and programmatic control.",
      lessons: lessons.slice(chunk1, chunk1 + chunk2),
    },
    {
      title: "Module 3: Problem Solving & Capstone",
      description: "Algorithms, practical DOM/runtime interaction, and final project.",
      lessons: lessons.slice(chunk1 + chunk2),
    },
  ];
}

/**
 * Upserts all canonical Phase 6 coding courses.
 */
async function seedCodingCurriculum() {
  const { creatorProfile } = await ensureSystemAuthor();
  const summary = {
    coursesCreatedOrUpdated: 0,
    modulesCreated: 0,
    lessonsCreated: 0,
  };

  for (const courseDef of canonicalCourses) {
    let course = await Course.findOne({ slug: courseDef.slug });
    const accessLevel = courseDef.monetizationType === "FREE" ? "free" : "premium";

    if (!course) {
      course = new Course({
        creatorId: creatorProfile._id,
        slug: courseDef.slug,
        title: courseDef.title,
        subtitle: courseDef.tagline,
        description: courseDef.description,
        language: "en",
        level: courseDef.level || "beginner",
        accessLevel,
        monetizationType: courseDef.monetizationType,
        coverImage: courseDef.coverImage || "",
        coverImageAlt: courseDef.title,
        estimatedDurationMinutes: (courseDef.estimatedHours || 10) * 60,
        learningOutcomes: courseDef.learningOutcomes || courseDef.learningObjectives || [],
        prerequisites: courseDef.prerequisites || [],
        publicationStatus: "published",
        workflowStatus: "published",
        rightsConfirmedAt: new Date(),
        publishedAt: new Date(),
        contentVersion: 1,
        structuralVersion: 1,
      });
    } else {
      course.title = courseDef.title;
      course.subtitle = courseDef.subtitle || courseDef.tagline || "";
      course.description = courseDef.description;
      course.accessLevel = accessLevel;
      course.monetizationType = courseDef.monetizationType;
      course.coverImage = courseDef.coverImage || course.coverImage;
      course.learningOutcomes = courseDef.learningOutcomes || courseDef.learningObjectives || [];
      course.prerequisites = courseDef.prerequisites || [];
      course.publicationStatus = "published";
      course.workflowStatus = "published";
      course.publishedAt = course.publishedAt || new Date();
      course.contentVersion += 1;
      course.structuralVersion += 1;
    }

    await course.save();

    // Remove existing modules and lessons for this course to ensure clean idempotency
    await Promise.all([
      CourseLesson.deleteMany({ courseId: course._id }),
      CourseModule.deleteMany({ courseId: course._id }),
    ]);

    const moduleDefs = courseDef.modules || partitionLessonsIntoModules(courseDef.lessons, courseDef.slug);
    let totalLessonsCount = 0;

    for (let mIdx = 0; mIdx < moduleDefs.length; mIdx += 1) {
      const mDef = moduleDefs[mIdx];
      const moduleDoc = await CourseModule.create({
        courseId: course._id,
        creatorId: creatorProfile._id,
        title: mDef.title,
        description: mDef.description,
        order: mIdx,
        stableKey: `${courseDef.slug}-mod-${mIdx + 1}`,
      });
      summary.modulesCreated += 1;

      for (let lIdx = 0; lIdx < mDef.lessons.length; lIdx += 1) {
        const lessonDef = mDef.lessons[lIdx];
        const isFirstLessonOfCourse = mIdx === 0 && lIdx === 0;

        const codingBlocks = (lessonDef.codingBlocks || []).map((b, bIdx) => ({
          id: crypto.randomUUID(),
          blockType: b.blockType || "starter_code",
          title: b.title || "Interactive Code Exercise",
          content: b.content || "",
          language: b.language || "javascript",
          starterCode: b.starterCode || "",
          instructions: b.instructions || "",
          expectedOutput: b.expectedOutput || "",
          hints: b.hints || [],
          validationRules: b.validationRules || null,
          solutionCode: b.solutionCode || "",
          tests: b.tests || [],
          order: bIdx,
        }));

        const quizQuestions = (lessonDef.quizQuestions || []).map((q, qIdx) => ({
          id: crypto.randomUUID(),
          question: q.question,
          options: (q.options || []).map((opt) => ({
            id: crypto.randomUUID(),
            text: typeof opt === "string" ? opt : (opt.text || ""),
          })),
          explanation: q.explanation || "",
          correctOptionIndex: Number(q.correctOptionIndex ?? 0),
          order: qIdx,
        }));

        await CourseLesson.create({
          courseId: course._id,
          moduleId: moduleDoc._id,
          creatorId: creatorProfile._id,
          stableKey: `${courseDef.slug}-l-${lessonDef.slug || lIdx + 1}`,
          title: lessonDef.title,
          description: lessonDef.title,
          lessonType: lessonDef.lessonFormat || "coding",
          body: lessonDef.explanation || "",
          codingBlocks,
          quizQuestions,
          durationSeconds: 900,
          order: lIdx,
          isPreview: isFirstLessonOfCourse,
          completionMode: "manual",
        });

        summary.lessonsCreated += 1;
        totalLessonsCount += 1;
      }
    }

    course.moduleCount = moduleDefs.length;
    course.lessonCount = totalLessonsCount;
    await course.save();

    summary.coursesCreatedOrUpdated += 1;
  }

  return summary;
}

if (require.main === module) {
  (async () => {
    try {
      console.info("[Seed:CodingCurriculum] 🚀 Connecting to MongoDB...");
      await connectDb();
      console.info("[Seed:CodingCurriculum] 📚 Seeding Phase 6 Coding Curriculum...");
      const summary = await seedCodingCurriculum();
      console.info("[Seed:CodingCurriculum] ✅ Seeding complete:", summary);
      process.exit(0);
    } catch (err) {
      console.error("[Seed:CodingCurriculum] ❌ Seeding failed:", err);
      process.exit(1);
    }
  })();
}

module.exports = {
  seedCodingCurriculum,
  ensureSystemAuthor,
  SYSTEM_LEARNING_USERNAME,
};
