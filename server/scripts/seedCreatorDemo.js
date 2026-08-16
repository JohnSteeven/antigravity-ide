/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  seedCreatorDemo.js — Realistic Development Creator + Learn Fixture Seeder
 *  MyJourney Platform | Development & Test Data Only
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Usage:
 *    node server/scripts/seedCreatorDemo.js          (seed / upsert fixtures)
 *    node server/scripts/seedCreatorDemo.js --reset  (clean up demo fixtures)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const crypto = require("crypto");
const mongoose = require("mongoose");
const connectDb = require("../config/db");
const env = require("../config/env");

const User = require("../models/User");
const Topic = require("../models/Topic");
const CreatorApplication = require("../models/CreatorApplication");
const CreatorProfile = require("../models/CreatorProfile");
const Course = require("../models/Course");
const CourseModule = require("../models/CourseModule");
const CourseLesson = require("../models/CourseLesson");
const Article = require("../models/Article");
const LearningResource = require("../models/LearningResource");
const PodcastSeries = require("../models/PodcastSeries");
const PodcastEpisode = require("../models/PodcastEpisode");
const CreatorVideo = require("../models/CreatorVideo");
const ExamDefinition = require("../models/ExamDefinition");
const ProtectedMediaAsset = require("../models/ProtectedMediaAsset");
const UserFollow = require("../models/UserFollow");
const CreatorAnalyticsAggregate = require("../models/CreatorAnalyticsAggregate");
const CreatorReviewEvent = require("../models/CreatorReviewEvent");

const { DEVELOPMENT_FIXTURES, assertFixtureEnvironment } = require("../creators/fixtures");
const { normalizeStoryLayout, normalizeStorySections, calculateStoryReadingTime } = require("../utils/storyContent");

const FIXTURE_USER_EMAIL_PREFIX = "fixture.creator.";
const FIXTURE_FOLLOWER_EMAIL_PREFIX = "fixture.follower.";
const FIXTURE_EMAIL_DOMAIN = "@myjourney.test";
const FIXTURE_TAG = "[DEV_FIXTURE]";

// Deterministic safe password hash for demo accounts (cannot be used for login)
const UNUSABLE_PASSWORD_HASH = "$2b$10$" + "X".repeat(53);

/**
 * Generate stable deterministic creatorKey for a fixture persona
 */
const getStableCreatorKey = (personaKey) => `demo-creator-${personaKey}`;

/**
 * Clean up only recognized development fixtures
 */
async function resetCreatorDemoFixtures() {
  assertFixtureEnvironment();

  console.info("[Seed:CreatorDemo] 🧹 Starting cleanup of recognized development demo fixtures...");

  const personaKeys = DEVELOPMENT_FIXTURES.personas.map((p) => p.key);
  const creatorSlugs = DEVELOPMENT_FIXTURES.personas.map((p) => p.slug);
  const stableCreatorKeys = personaKeys.map(getStableCreatorKey);
  const fixtureEmails = [
    ...personaKeys.map((k) => `${FIXTURE_USER_EMAIL_PREFIX}${k}${FIXTURE_EMAIL_DOMAIN}`),
    ...Array.from({ length: 15 }, (_, i) => `${FIXTURE_FOLLOWER_EMAIL_PREFIX}${i + 1}${FIXTURE_EMAIL_DOMAIN}`),
  ];

  // 1. Find fixture users and profiles
  const fixtureUsers = await User.find({ email: { $in: fixtureEmails } }).select("_id email").lean();
  const fixtureUserIds = fixtureUsers.map((u) => u._id);

  const fixtureProfiles = await CreatorProfile.find({
    $or: [{ creatorKey: { $in: stableCreatorKeys } }, { slug: { $in: creatorSlugs } }, { userId: { $in: fixtureUserIds } }],
  }).select("_id creatorKey slug").lean();
  const fixtureProfileIds = fixtureProfiles.map((p) => p._id);
  const allCreatorKeys = [...new Set([...stableCreatorKeys, ...fixtureProfiles.map((p) => p.creatorKey)])];

  // 2. Delete dependent child records
  const courseSlugs = DEVELOPMENT_FIXTURES.content.filter((c) => c.contentType === "course").map((c) => c.slug);
  const fixtureCourses = await Course.find({
    $or: [{ creatorId: { $in: fixtureProfileIds } }, { slug: { $in: courseSlugs } }],
  }).select("_id").lean();
  const fixtureCourseIds = fixtureCourses.map((c) => c._id);

  await CourseLesson.deleteMany({
    $or: [{ courseId: { $in: fixtureCourseIds } }, { creatorId: { $in: fixtureProfileIds } }],
  });
  await CourseModule.deleteMany({
    $or: [{ courseId: { $in: fixtureCourseIds } }, { creatorId: { $in: fixtureProfileIds } }],
  });
  await Course.deleteMany({ _id: { $in: fixtureCourseIds } });

  // 3. Delete articles and stories
  const articleSlugs = DEVELOPMENT_FIXTURES.content.filter((c) => ["article", "story"].includes(c.contentType)).map((c) => c.slug);
  await Article.deleteMany({
    $or: [{ creatorProfileId: { $in: fixtureProfileIds } }, { slug: { $in: articleSlugs } }],
  });

  // 4. Delete podcasts
  const podcastSeriesSlugs = DEVELOPMENT_FIXTURES.content.filter((c) => c.contentType === "podcast").map((c) => c.slug);
  const fixturePodcastSeries = await PodcastSeries.find({
    $or: [{ creatorId: { $in: fixtureProfileIds } }, { slug: { $in: podcastSeriesSlugs } }],
  }).select("_id").lean();
  const fixturePodcastSeriesIds = fixturePodcastSeries.map((s) => s._id);

  const podcastEpisodeSlugs = DEVELOPMENT_FIXTURES.content
    .filter((c) => c.contentType === "podcast" && Array.isArray(c.episodes))
    .flatMap((c) => c.episodes.map((ep) => ep.slug));

  await PodcastEpisode.deleteMany({
    $or: [{ seriesId: { $in: fixturePodcastSeriesIds } }, { creatorId: { $in: fixtureProfileIds } }, { slug: { $in: podcastEpisodeSlugs } }],
  });
  await PodcastSeries.deleteMany({ _id: { $in: fixturePodcastSeriesIds } });

  // 5. Delete resources
  const resourceSlugs = DEVELOPMENT_FIXTURES.content.filter((c) => c.contentType === "resource").map((c) => c.slug);
  await LearningResource.deleteMany({
    $or: [{ creatorId: { $in: fixtureProfileIds } }, { slug: { $in: resourceSlugs } }],
  });

  // 6. Delete videos
  const videoSlugs = DEVELOPMENT_FIXTURES.content.filter((c) => c.contentType === "video").map((c) => c.slug);
  await CreatorVideo.deleteMany({
    $or: [{ creatorId: { $in: fixtureProfileIds } }, { slug: { $in: videoSlugs } }],
  });

  // 7. Delete exams
  const examSlugs = (DEVELOPMENT_FIXTURES.exams || []).map((c) => c.slug);
  await ExamDefinition.deleteMany({
    $or: [{ creatorId: { $in: fixtureProfileIds } }, { slug: { $in: examSlugs } }],
  });

  // 8. Delete protected media assets created for fixtures
  await ProtectedMediaAsset.deleteMany({ creatorId: { $in: fixtureProfileIds } });

  // 9. Delete follows
  await UserFollow.deleteMany({
    $or: [{ followerId: { $in: fixtureUserIds } }, { targetType: "creator", targetId: { $in: allCreatorKeys } }],
  });

  // 10. Delete analytics
  await CreatorAnalyticsAggregate.deleteMany({ creatorId: { $in: fixtureProfileIds } });

  // 11. Delete creator applications and review events
  const fixtureApps = await CreatorApplication.find({ userId: { $in: fixtureUserIds } }).select("_id").lean();
  const fixtureAppIds = fixtureApps.map((a) => a._id);
  await CreatorReviewEvent.deleteMany({ applicationId: { $in: fixtureAppIds } });
  await CreatorApplication.deleteMany({ _id: { $in: fixtureAppIds } });

  // 12. Delete creator profiles
  await CreatorProfile.deleteMany({ _id: { $in: fixtureProfileIds } });

  // 13. Delete fixture users
  await User.deleteMany({ _id: { $in: fixtureUserIds } });

  console.info("[Seed:CreatorDemo] ✅ Reset completed. Only recognized fixture records were removed.");
}

/**
 * Seed or update all development Creator + Learn fixtures idempotently
 */
async function seedCreatorDemoFixtures() {
  assertFixtureEnvironment();

  console.info("[Seed:CreatorDemo] 🚀 Seeding realistic development Creator catalog...");

  const results = {
    creatorsCreatedOrUpdated: 0,
    applicationsCreatedOrUpdated: 0,
    topicsCreatedOrUpdated: 0,
    coursesCreatedOrUpdated: 0,
    modulesCreatedOrUpdated: 0,
    lessonsCreatedOrUpdated: 0,
    articlesCreatedOrUpdated: 0,
    storiesCreatedOrUpdated: 0,
    resourcesCreatedOrUpdated: 0,
    podcastsCreatedOrUpdated: 0,
    episodesCreatedOrUpdated: 0,
    videosCreatedOrUpdated: 0,
    examsCreatedOrUpdated: 0,
    followsCreatedOrUpdated: 0,
    analyticsCreatedOrUpdated: 0,
  };

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Seed Topics
  // ──────────────────────────────────────────────────────────────────────────
  const topicMap = new Map(); // slug -> Topic Document

  for (const topicData of DEVELOPMENT_FIXTURES.topics) {
    const topicDoc = await Topic.findOneAndUpdate(
      { slug: topicData.slug },
      {
        $set: {
          name: topicData.name,
          slug: topicData.slug,
          description: topicData.description,
          status: "active",
        },
      },
      { upsert: true, new: true, runValidators: true }
    );
    topicMap.set(topicData.slug, topicDoc);
    results.topicsCreatedOrUpdated++;
  }
  console.info(`[Seed:CreatorDemo] ✅ Synced ${topicMap.size} Topics.`);

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Create Demo Follower Users (for deterministic follow graphs)
  // ──────────────────────────────────────────────────────────────────────────
  const demoFollowerUsers = [];
  for (let i = 1; i <= 15; i++) {
    const followerEmail = `${FIXTURE_FOLLOWER_EMAIL_PREFIX}${i}${FIXTURE_EMAIL_DOMAIN}`;
    const followerUser = await User.findOneAndUpdate(
      { email: followerEmail },
      {
        $set: {
          firstName: "Demo",
          lastName: `Learner ${i}`,
          username: `demo_learner_${i}`,
          email: followerEmail,
          mobile: `+9199000000${String(i).padStart(2, "0")}`,
          passwordHash: UNUSABLE_PASSWORD_HASH,
          role: "Reader",
          status: "ACTIVE",
          verified: { email: true, mobile: true },
        },
      },
      { upsert: true, new: true, runValidators: true }
    );
    demoFollowerUsers.push(followerUser);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Seed Creators (Users, Applications, Profiles, Review Events)
  // ──────────────────────────────────────────────────────────────────────────
  const creatorProfileMap = new Map(); // persona.key -> CreatorProfile Document
  const creatorUserMap = new Map();    // persona.key -> User Document

  for (const persona of DEVELOPMENT_FIXTURES.personas) {
    const email = `${FIXTURE_USER_EMAIL_PREFIX}${persona.key}${FIXTURE_EMAIL_DOMAIN}`;
    const nameParts = persona.displayName.split(" ");
    const firstName = nameParts[0] || persona.displayName;
    const lastName = nameParts.slice(1).join(" ") || "Creator";

    // 3a. User
    const creatorUser = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          firstName,
          lastName,
          username: `creator_${persona.key.replace(/-/g, "_")}`,
          email,
          mobile: `+9198000000${String(results.creatorsCreatedOrUpdated + 1).padStart(2, "0")}`,
          passwordHash: UNUSABLE_PASSWORD_HASH,
          role: "Reader",
          status: "ACTIVE",
          verified: { email: true, mobile: true },
        },
      },
      { upsert: true, new: true, runValidators: true }
    );
    creatorUserMap.set(persona.key, creatorUser);

    // 3b. Creator Application
    const applicationStatus = persona.applicationStatus || "active";
    const appDoc = await CreatorApplication.findOneAndUpdate(
      { userId: creatorUser._id },
      {
        $set: {
          userId: creatorUser._id,
          status: applicationStatus,
          legalName: `${persona.displayName} (Demo Persona)`,
          displayName: persona.displayName,
          headline: persona.headline,
          biography: persona.biography,
          country: "India",
          languages: persona.languages || ["English"],
          specialties: persona.specialties || [],
          creatorTypes: persona.creatorTypes || ["educator"],
          intendedTopics: (persona.topics || []).slice(0, 5),
          intendedFormats: persona.intendedFormats || ["course", "article"],
          motivation: `Development fixture persona representing ${persona.headline}.`,
          termsAcceptedAt: new Date("2026-01-01T00:00:00.000Z"),
          contentRightsAcceptedAt: new Date("2026-01-01T00:00:00.000Z"),
          submittedAt: new Date("2026-01-01T00:00:00.000Z"),
          reviewedAt: new Date("2026-01-02T00:00:00.000Z"),
          applicantMessage: applicationStatus === "active" ? "Welcome to the MyJourney Creator community." : "Your application is being processed.",
        },
      },
      { upsert: true, new: true, runValidators: true }
    );
    results.applicationsCreatedOrUpdated++;

    // 3c. Creator Review Event history (APPLIED -> UNDER_REVIEW -> APPROVED -> ACTIVE)
    await CreatorReviewEvent.findOneAndUpdate(
      { applicationId: appDoc._id, toStatus: applicationStatus },
      {
        $set: {
          applicationId: appDoc._id,
          actorId: creatorUser._id,
          fromStatus: "under_review",
          toStatus: applicationStatus,
          publicMessage: `${FIXTURE_TAG} Automated approval transition for development demo profile.`,
          occurredAt: new Date("2026-01-02T00:00:00.000Z"),
        },
      },
      { upsert: true, new: true }
    );

    // 3d. Creator Profile (Only if status is approved or active)
    if (persona.profileStatus) {
      const stableKey = getStableCreatorKey(persona.key);
      const profileDoc = await CreatorProfile.findOneAndUpdate(
        { $or: [{ creatorKey: stableKey }, { slug: persona.slug }, { userId: creatorUser._id }] },
        {
          $set: {
            creatorKey: stableKey,
            userId: creatorUser._id,
            applicationId: appDoc._id,
            slug: persona.slug,
            displayName: persona.displayName,
            headline: persona.headline,
            biography: persona.biography,
            specialties: persona.specialties || [],
            languages: persona.languages || ["English"],
            creatorTypes: persona.creatorTypes || ["educator"],
            status: persona.profileStatus,
            isFeatured: Boolean(persona.isFeatured),
            moduleOrder: persona.moduleOrder || ["courses", "videos", "articles", "stories", "podcasts", "resources", "about"],
            verifiedAt: new Date("2026-01-02T00:00:00.000Z"),
          },
        },
        { upsert: true, new: true, runValidators: true }
      );
      creatorProfileMap.set(persona.key, profileDoc);
      results.creatorsCreatedOrUpdated++;
    }
  }
  console.info(`[Seed:CreatorDemo] ✅ Synced ${results.creatorsCreatedOrUpdated} Creator Profiles & ${results.applicationsCreatedOrUpdated} Applications.`);

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Seed Content (Courses, Modules, Lessons, Articles, Stories, Podcasts, Resources, Videos, Exams)
  // ──────────────────────────────────────────────────────────────────────────
  const createdContentIds = new Map(); // contentKey -> ObjectId
  const allContentItems = [...DEVELOPMENT_FIXTURES.content, ...(DEVELOPMENT_FIXTURES.exams || [])];

  for (const item of allContentItems) {
    const creator = creatorProfileMap.get(item.owner);
    const creatorUser = creatorUserMap.get(item.owner);
    if (!creator || !creatorUser) continue;

    const topicIds = (item.topics || [])
      .map((t) => topicMap.get(t.toLowerCase().replace(/[^a-z0-9]+/g, "-"))?._id)
      .filter(Boolean);

    // 4a. Course
    if (item.contentType === "course") {
      const courseDoc = await Course.findOneAndUpdate(
        { slug: item.slug },
        {
          $set: {
            creatorId: creator._id,
            title: item.title,
            slug: item.slug,
            subtitle: item.subtitle || "",
            description: item.description,
            topicIds,
            language: item.language || "English",
            level: item.level || "beginner",
            accessLevel: item.accessLevel || "free",
            estimatedDurationMinutes: item.estimatedDurationMinutes || 120,
            learningOutcomes: item.learningOutcomes || [],
            publicationStatus: item.publicationStatus || "published",
            workflowStatus: item.workflowStatus || "published",
            rightsConfirmedAt: new Date("2026-01-01T00:00:00.000Z"),
            moduleCount: (item.modules || []).length,
            lessonCount: (item.modules || []).reduce((acc, m) => acc + (m.lessons || []).length, 0),
            publishedAt: new Date("2026-01-03T00:00:00.000Z"),
            isFeatured: Boolean(item.isFeatured),
            isDeleted: false,
          },
        },
        { upsert: true, new: true, runValidators: true }
      );
      createdContentIds.set(item.key, { contentType: "course", id: courseDoc._id });
      results.coursesCreatedOrUpdated++;

      // Seed Course Modules & Lessons
      for (const modData of item.modules || []) {
        const modDoc = await CourseModule.findOneAndUpdate(
          { courseId: courseDoc._id, stableKey: modData.stableKey },
          {
            $set: {
              courseId: courseDoc._id,
              creatorId: creator._id,
              title: modData.title,
              description: modData.description || "",
              order: modData.order,
              stableKey: modData.stableKey,
              isDeleted: false,
            },
          },
          { upsert: true, new: true, runValidators: true }
        );
        results.modulesCreatedOrUpdated++;

        for (const lesData of modData.lessons || []) {
          await CourseLesson.findOneAndUpdate(
            { courseId: courseDoc._id, stableKey: lesData.stableKey },
            {
              $set: {
                courseId: courseDoc._id,
                moduleId: modDoc._id,
                creatorId: creator._id,
                stableKey: lesData.stableKey,
                title: lesData.title,
                description: lesData.description || "",
                lessonType: lesData.lessonType || "text",
                body: lesData.body || `Overview and learning guide for ${lesData.title}.`,
                durationSeconds: lesData.durationSeconds || 300,
                order: lesData.order,
                isPreview: Boolean(lesData.isPreview),
                completionMode: "manual",
                isDeleted: false,
              },
            },
            { upsert: true, new: true, runValidators: true }
          );
          results.lessonsCreatedOrUpdated++;
        }
      }
    }

    // 4b. Article / Story
    else if (["article", "story"].includes(item.contentType)) {
      const isStory = item.contentType === "story";
      const normalizedSections = isStory && Array.isArray(item.storySections)
        ? normalizeStorySections(item.storySections)
        : undefined;
      const storyLayout = isStory ? normalizeStoryLayout(item.storyLayout || "classic-reader") : undefined;
      const readingMinutes = isStory ? calculateStoryReadingTime(item) : 3;

      const articleDoc = await Article.findOneAndUpdate(
        { slug: item.slug },
        {
          $set: {
            title: item.title,
            slug: item.slug,
            description: item.description || "",
            excerpt: item.description ? item.description.slice(0, 300) : "",
            accessLevel: item.accessLevel || "free",
            body: item.body || (isStory ? "" : `<p>${item.description || item.title}</p>`),
            contentType: item.contentType,
            category: item.category || "Life",
            storyLayout,
            storySections: normalizedSections,
            readingTimeMin: readingMinutes,
            readingTime: `${readingMinutes} min read`,
            status: item.publicationStatus || "published",
            authorId: creatorUser._id,
            author: creator.displayName,
            creatorProfileId: creator._id,
            creatorWorkflowStatus: item.workflowStatus || "published",
            contentRightsConfirmedAt: new Date("2026-01-01T00:00:00.000Z"),
            publishedAt: new Date("2026-01-03T00:00:00.000Z"),
            isDeleted: false,
          },
        },
        { upsert: true, new: true, runValidators: true }
      );
      createdContentIds.set(item.key, { contentType: item.contentType, id: articleDoc._id });
      if (isStory) results.storiesCreatedOrUpdated++;
      else results.articlesCreatedOrUpdated++;
    }

    // 4c. Learning Resource
    else if (item.contentType === "resource") {
      // Create a placeholder ProtectedMediaAsset for honest delivery metadata
      const assetDoc = await ProtectedMediaAsset.findOneAndUpdate(
        { creatorId: creator._id, originalName: `${item.slug}.pdf` },
        {
          $set: {
            creatorId: creator._id,
            uploadedBy: creatorUser._id,
            mediaKind: "resource",
            provider: "unconfigured",
            originalName: `${item.slug}.pdf`,
            mimeType: "application/pdf",
            sizeBytes: item.sizeBytes || 102400,
            accessLevel: item.accessLevel || "free",
            scanStatus: "unavailable",
            deliveryStatus: "pending",
            rightsConfirmedAt: new Date("2026-01-01T00:00:00.000Z"),
            status: "active",
          },
        },
        { upsert: true, new: true }
      );

      const resourceDoc = await LearningResource.findOneAndUpdate(
        { slug: item.slug },
        {
          $set: {
            creatorId: creator._id,
            title: item.title,
            slug: item.slug,
            description: item.description,
            resourceType: item.resourceType || "pdf",
            topicIds,
            language: item.language || "English",
            assetId: assetDoc._id,
            sizeBytes: item.sizeBytes || 102400,
            accessLevel: item.accessLevel || "free",
            publicationStatus: item.publicationStatus || "published",
            workflowStatus: item.workflowStatus || "published",
            rightsConfirmedAt: new Date("2026-01-01T00:00:00.000Z"),
            publishedAt: new Date("2026-01-03T00:00:00.000Z"),
          },
        },
        { upsert: true, new: true, runValidators: true }
      );
      createdContentIds.set(item.key, { contentType: "resource", id: resourceDoc._id });
      results.resourcesCreatedOrUpdated++;
    }

    // 4d. Podcast Series & Episodes
    else if (item.contentType === "podcast") {
      const seriesDoc = await PodcastSeries.findOneAndUpdate(
        { slug: item.slug },
        {
          $set: {
            creatorId: creator._id,
            title: item.title,
            slug: item.slug,
            description: item.description,
            topicIds,
            language: item.language || "English",
            accessLevel: item.accessLevel || "free",
            publicationStatus: item.publicationStatus || "published",
            workflowStatus: item.workflowStatus || "published",
            rightsConfirmedAt: new Date("2026-01-01T00:00:00.000Z"),
            publishedAt: new Date("2026-01-03T00:00:00.000Z"),
          },
        },
        { upsert: true, new: true, runValidators: true }
      );
      results.podcastsCreatedOrUpdated++;

      for (const ep of item.episodes || []) {
        const episodeDoc = await PodcastEpisode.findOneAndUpdate(
          { slug: ep.slug },
          {
            $set: {
              title: ep.title,
              slug: ep.slug,
              description: ep.description || "",
              creatorId: creator._id,
              seriesId: seriesDoc._id,
              topicIds,
              language: item.language || "English",
              durationSeconds: ep.durationSeconds || 1200,
              seasonNumber: ep.seasonNumber || 1,
              episodeNumber: ep.episodeNumber || 1,
              showNotes: ep.showNotes || `Show notes for ${ep.title}.`,
              transcript: ep.showNotes || "",
              isPublished: true,
              accessLevel: ep.accessLevel || "free",
              publicationStatus: "published",
              workflowStatus: "published",
              rightsConfirmedAt: new Date("2026-01-01T00:00:00.000Z"),
              publishedAt: new Date("2026-01-03T00:00:00.000Z"),
            },
          },
          { upsert: true, new: true, runValidators: true }
        );
        createdContentIds.set(`ep-${ep.slug}`, { contentType: "podcast", id: episodeDoc._id });
        results.episodesCreatedOrUpdated++;
      }
      createdContentIds.set(item.key, { contentType: "podcast", id: seriesDoc._id });
    }

    // 4e. Video
    else if (item.contentType === "video") {
      const videoAssetDoc = await ProtectedMediaAsset.findOneAndUpdate(
        { creatorId: creator._id, originalName: `${item.slug}.mp4` },
        {
          $set: {
            creatorId: creator._id,
            uploadedBy: creatorUser._id,
            mediaKind: "video",
            provider: "unconfigured",
            originalName: `${item.slug}.mp4`,
            mimeType: "video/mp4",
            sizeBytes: 15000000,
            accessLevel: item.accessLevel || "free",
            scanStatus: "unavailable",
            deliveryStatus: "pending",
            rightsConfirmedAt: new Date("2026-01-01T00:00:00.000Z"),
            status: "active",
          },
        },
        { upsert: true, new: true }
      );

      const videoDoc = await CreatorVideo.findOneAndUpdate(
        { slug: item.slug },
        {
          $set: {
            creatorId: creator._id,
            title: item.title,
            slug: item.slug,
            description: item.description,
            topicIds,
            language: item.language || "English",
            durationSeconds: item.durationSeconds || 300,
            mediaAssetId: videoAssetDoc._id,
            accessLevel: item.accessLevel || "free",
            publicationStatus: item.publicationStatus || "published",
            workflowStatus: item.workflowStatus || "published",
            rightsConfirmedAt: new Date("2026-01-01T00:00:00.000Z"),
            publishedAt: new Date("2026-01-03T00:00:00.000Z"),
            isDeleted: false,
          },
        },
        { upsert: true, new: true, runValidators: true }
      );
      createdContentIds.set(item.key, { contentType: "video", id: videoDoc._id });
      results.videosCreatedOrUpdated++;
    }

    // 4f. Exam Definition
    else if (item.contentType === "exam") {
      const examDoc = await ExamDefinition.findOneAndUpdate(
        { slug: item.slug },
        {
          $set: {
            creatorId: creator._id,
            title: item.title,
            slug: item.slug,
            description: item.description,
            examCategory: item.examCategory || "Government Exams",
            jurisdiction: item.jurisdiction || "National",
            subjectLabels: item.subjectLabels || ["Aptitude"],
            topicIds,
            accessLevel: item.accessLevel || "free",
            status: "published",
            publishedAt: new Date("2026-01-03T00:00:00.000Z"),
          },
        },
        { upsert: true, new: true, runValidators: true }
      );
      createdContentIds.set(item.key, { contentType: "exam", id: examDoc._id });
      results.examsCreatedOrUpdated++;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Link Suggested Featured Content on Creator Profiles
  // ──────────────────────────────────────────────────────────────────────────
  for (const persona of DEVELOPMENT_FIXTURES.personas) {
    if (!persona.suggestedFeatured) continue;
    const profile = creatorProfileMap.get(persona.key);
    if (!profile) continue;

    const featuredRef = createdContentIds.get(persona.suggestedFeatured.key);
    if (featuredRef) {
      await CreatorProfile.findByIdAndUpdate(profile._id, {
        $set: {
          featuredContent: [{ contentType: featuredRef.contentType, contentId: featuredRef.id }],
        },
      });
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Seed Follow Graph (No self-follows, no duplicate follows, sync counts)
  // ──────────────────────────────────────────────────────────────────────────
  for (const followSpec of DEVELOPMENT_FIXTURES.follows || []) {
    const creator = creatorProfileMap.get(followSpec.creatorKey);
    const creatorUser = creatorUserMap.get(followSpec.creatorKey);
    if (!creator || !creatorUser) continue;

    const targetFollowerCount = Math.min(followSpec.followerCount || 0, demoFollowerUsers.length);
    for (let i = 0; i < targetFollowerCount; i++) {
      const follower = demoFollowerUsers[i];
      // Prevent self-follow
      if (String(follower._id) === String(creatorUser._id)) continue;

      await UserFollow.findOneAndUpdate(
        { followerId: follower._id, targetType: "creator", targetId: creator.creatorKey },
        {
          $set: {
            followerId: follower._id,
            targetType: "creator",
            targetId: creator.creatorKey,
          },
        },
        { upsert: true, new: true }
      );
      results.followsCreatedOrUpdated++;
    }

    // Sync follower count
    const actualCount = await UserFollow.countDocuments({ targetType: "creator", targetId: creator.creatorKey });
    await CreatorProfile.updateOne({ _id: creator._id }, { $set: { "metrics.followerCount": actualCount } });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Seed Realistic Bounded Analytics
  // ──────────────────────────────────────────────────────────────────────────
  const sampleDay = new Date();
  sampleDay.setUTCHours(0, 0, 0, 0);

  for (const [key, contentRef] of createdContentIds.entries()) {
    const matchingItem = DEVELOPMENT_FIXTURES.content.find((c) => c.key === key);
    if (!matchingItem) continue;
    const creator = creatorProfileMap.get(matchingItem.owner);
    if (!creator) continue;

    const isCourse = contentRef.contentType === "course";
    const isPodcast = contentRef.contentType === "podcast";
    const isVideo = contentRef.contentType === "video";

    await CreatorAnalyticsAggregate.findOneAndUpdate(
      { creatorId: creator._id, contentId: contentRef.id, day: sampleDay },
      {
        $set: {
          creatorId: creator._id,
          contentId: contentRef.id,
          contentType: contentRef.contentType,
          day: sampleDay,
          metrics: {
            rawEvents: isCourse ? 42 : 28,
            qualifiedEvents: isCourse ? 36 : 24,
            views: 45,
            qualifiedReads: (!isCourse && !isPodcast && !isVideo) ? 22 : 0,
            qualifiedWatches: isVideo ? 18 : 0,
            qualifiedListens: isPodcast ? 15 : 0,
            lessonCompletions: isCourse ? 12 : 0,
            courseProgressions: isCourse ? 8 : 0,
            meaningfulSaves: 5,
            qualifiedDurationSeconds: isVideo || isPodcast ? 7200 : 0,
          },
        },
      },
      { upsert: true, new: true }
    );
    results.analyticsCreatedOrUpdated++;
  }

  console.info("[Seed:CreatorDemo] ✨ Seeding completed successfully.");
  return results;
}

// ────────────────────────────────────────────────────────────────────────────
// Command-line Execution Handler
// ────────────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const isReset = process.argv.includes("--reset");

  const run = async () => {
    try {
      assertFixtureEnvironment();
      await connectDb();
      if (isReset) {
        await resetCreatorDemoFixtures();
      } else {
        const stats = await seedCreatorDemoFixtures();
        console.table(stats);
      }
    } catch (err) {
      console.error("[Seed:CreatorDemo] ❌ Execution failed:", err.message);
      process.exitCode = 1;
    } finally {
      await mongoose.connection.close();
      console.info("[Seed:CreatorDemo] 🔌 Database connection closed.");
    }
  };

  run();
}

module.exports = {
  resetCreatorDemoFixtures,
  seedCreatorDemoFixtures,
};
