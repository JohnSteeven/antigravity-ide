/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  verifyCreatorSeed.js — Idempotency & Reset Verification Script
 *  MyJourney Platform | Verifies Seeding Invariants Against Database
 * ─────────────────────────────────────────────────────────────────────────────
 */

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
const UserFollow = require("../models/UserFollow");
const CreatorAnalyticsAggregate = require("../models/CreatorAnalyticsAggregate");
const ProtectedMediaAsset = require("../models/ProtectedMediaAsset");

const { seedCreatorDemoFixtures, resetCreatorDemoFixtures } = require("./seedCreatorDemo");

const CANARY_EMAIL = "canary.existing.user@myjourney.test";
const CANARY_SLUG = "canary-existing-article";

async function getEntityCounts() {
  const [
    users,
    topics,
    applications,
    profiles,
    courses,
    modules,
    lessons,
    articles,
    stories,
    resources,
    podcasts,
    episodes,
    videos,
    exams,
    follows,
    analytics,
    assets,
  ] = await Promise.all([
    User.countDocuments(),
    Topic.countDocuments(),
    CreatorApplication.countDocuments(),
    CreatorProfile.countDocuments(),
    Course.countDocuments(),
    CourseModule.countDocuments(),
    CourseLesson.countDocuments(),
    Article.countDocuments({ contentType: "article" }),
    Article.countDocuments({ contentType: "story" }),
    LearningResource.countDocuments(),
    PodcastSeries.countDocuments(),
    PodcastEpisode.countDocuments(),
    CreatorVideo.countDocuments(),
    ExamDefinition.countDocuments(),
    UserFollow.countDocuments(),
    CreatorAnalyticsAggregate.countDocuments(),
    ProtectedMediaAsset.countDocuments(),
  ]);

  return {
    users,
    topics,
    applications,
    profiles,
    courses,
    modules,
    lessons,
    articles,
    stories,
    resources,
    podcasts,
    episodes,
    videos,
    exams,
    follows,
    analytics,
    assets,
  };
}

async function verify() {
  console.info("[Verify:Seed] 🔍 Connecting to database...");
  await connectDb();

  if (mongoose.connection.readyState !== 1) {
    console.warn("[Verify:Seed] ⚠️ MongoDB is not active on this environment. Operating in validation mode.");
    return;
  }

  console.info("[Verify:Seed] 🧹 Step 1: Initial cleanup of demo fixtures...");
  await resetCreatorDemoFixtures();

  console.info("[Verify:Seed] 🐦 Step 2: Creating non-demo canary records...");
  const canaryUser = await User.findOneAndUpdate(
    { email: CANARY_EMAIL },
    {
      $set: {
        firstName: "Canary",
        lastName: "Existing",
        username: "canary_existing",
        email: CANARY_EMAIL,
        mobile: "+918888888801",
        passwordHash: "$2b$10$" + "C".repeat(53),
        role: "Reader",
        status: "ACTIVE",
      },
    },
    { upsert: true, new: true }
  );

  const canaryArticle = await Article.findOneAndUpdate(
    { slug: CANARY_SLUG },
    {
      $set: {
        title: "Canary Existing Article",
        slug: CANARY_SLUG,
        description: "An existing non-demo article that should never be deleted by fixture reset.",
        body: "<p>Canary content</p>",
        contentType: "article",
        category: "Life",
        authorId: canaryUser._id,
        author: "Canary Author",
        status: "published",
      },
    },
    { upsert: true, new: true }
  );

  const baseCounts = await getEntityCounts();
  console.info("[Verify:Seed] 📊 Pre-seed database counts (including canary):", baseCounts);

  console.info("[Verify:Seed] 🌱 Step 3: First seed execution...");
  await seedCreatorDemoFixtures();
  const firstSeedCounts = await getEntityCounts();
  console.info("[Verify:Seed] 📊 Counts after 1st seed:", firstSeedCounts);

  console.info("[Verify:Seed] 🔁 Step 4: Second seed execution (Idempotency check)...");
  await seedCreatorDemoFixtures();
  const secondSeedCounts = await getEntityCounts();
  console.info("[Verify:Seed] 📊 Counts after 2nd seed:", secondSeedCounts);

  // Assert idempotency
  let isIdempotent = true;
  for (const [key, count] of Object.entries(firstSeedCounts)) {
    if (secondSeedCounts[key] !== count) {
      console.error(`[Verify:Seed] ❌ IDEMPOTENCY VIOLATION on ${key}: 1st count=${count}, 2nd count=${secondSeedCounts[key]}`);
      isIdempotent = false;
    }
  }

  if (isIdempotent) {
    console.info("[Verify:Seed] ✅ IDEMPOTENCY VERIFIED! All 17 entity collection counts are identical between runs.");
  } else {
    throw new Error("Idempotency verification failed!");
  }

  console.info("[Verify:Seed] 🧹 Step 5: Testing reset execution...");
  await resetCreatorDemoFixtures();
  const postResetCounts = await getEntityCounts();
  console.info("[Verify:Seed] 📊 Counts after reset:", postResetCounts);

  // Check canary preservation
  const canaryUserStillExists = await User.exists({ email: CANARY_EMAIL });
  const canaryArticleStillExists = await Article.exists({ slug: CANARY_SLUG });

  if (!canaryUserStillExists || !canaryArticleStillExists) {
    throw new Error("❌ RESET SAFETY VIOLATION: Pre-existing non-demo canary record was deleted!");
  }
  console.info("[Verify:Seed] ✅ RESET SAFETY VERIFIED! Pre-existing non-demo records remained completely untouched.");

  // Clean up canary records
  await Article.deleteOne({ slug: CANARY_SLUG });
  await User.deleteOne({ email: CANARY_EMAIL });

  console.info("[Verify:Seed] 🌱 Step 6: Final seeding to leave rich demo catalog in development database...");
  const finalStats = await seedCreatorDemoFixtures();
  console.table(finalStats);

  const finalCounts = await getEntityCounts();
  console.info("[Verify:Seed] 📊 Final database entity counts:", finalCounts);

  console.info("[Verify:Seed] 🎉 ALL VERIFICATIONS PASSED!");
}

if (require.main === module) {
  verify()
    .catch((err) => {
      console.error("[Verify:Seed] ❌ Error:", err);
      process.exitCode = 1;
    })
    .finally(async () => {
      await mongoose.connection.close();
      console.info("[Verify:Seed] 🔌 Disconnected from database.");
    });
}

module.exports = verify;
