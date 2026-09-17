"use strict";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  seedPhase5Articles.js  —  Phase 5 Canonical Article Seeder Foundation
 *  MyJourney Platform  |  Phase 5 Step 1
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Responsibilities:
 *  - Creates or upserts NEW canonical Phase 5 articles (bootstrap material).
 *  - Migration responsibility (old records) is kept strictly separate in
 *    server/migrations/013-phase5-article-catalog-reset.js.
 *  - Applies the configured editorial byline: "MyJourney Editorial".
 *  - Protects Stories, News, and Coding by never overwriting them.
 *  - Requires non-production environment (NODE_ENV=development or test).
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require("mongoose");
const connectDb = require("../config/db");
const Article = require("../models/Article");
const Category = require("../models/Category");
const User = require("../models/User");
const { EDITORIAL_BYLINE } = require("../config/constants");
const { phase5Catalog, validatePhase5ArticleBlueprint } = require("../data/phase5Articles");

const assertFixtureEnvironment = () => {
  if (!["development", "test"].includes(process.env.NODE_ENV)) {
    throw new Error(
      "Phase 5 article seeding requires NODE_ENV=development or NODE_ENV=test. Seeding is disabled in every other environment."
    );
  }
};

const parseArgs = (args = process.argv.slice(2)) => {
  return {
    dryRun: args.includes("--dry-run"),
  };
};

async function seedPhase5Articles(options = {}) {
  assertFixtureEnvironment();
  const { dryRun } = options;

  console.info(`[Phase 5 Seeder] Starting canonical article catalog seeder (dryRun: ${Boolean(dryRun)})...`);

  // Ensure author user
  let authorUser = await User.findOne({ role: { $in: ["Admin", "admin"] } });
  if (!authorUser) authorUser = await User.findOne({});
  const authorId = authorUser ? authorUser._id : new mongoose.Types.ObjectId();

  const allArticles = Object.values(phase5Catalog).flat();

  if (allArticles.length === 0) {
    console.info("[Phase 5 Seeder] Catalog structure initialized. No batch articles loaded for Step 1.");
    return {
      status: "scaffold_ready",
      totalCatalogArticles: 0,
      dryRun: Boolean(dryRun),
    };
  }

  let createdCount = 0;
  let updatedCount = 0;

  for (const blueprint of allArticles) {
    const validation = validatePhase5ArticleBlueprint(blueprint);
    if (!validation.valid) {
      throw new Error(`Invalid blueprint for article "${blueprint.title}": ${validation.errors.join(", ")}`);
    }

    if (dryRun) continue;

    const categorySlug = blueprint.category.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    const categoryDoc = await Category.findOne({ slug: categorySlug });

    const articlePayload = {
      ...blueprint,
      author: EDITORIAL_BYLINE,
      authorId,
      contentType: "article",
      categoryId: categoryDoc?._id || undefined,
      categorySlug,
      status: blueprint.status || "published",
      isArchived: false,
      publishedAt: blueprint.publishedAt || new Date(),
    };

    const existing = await Article.findOne({ slug: blueprint.slug });
    if (existing) {
      // Guard: Never overwrite a Story record
      if (existing.contentType === "story") {
        console.warn(`[Phase 5 Seeder] Skipping slug "${blueprint.slug}" — matches existing Story record.`);
        continue;
      }
      await Article.updateOne({ _id: existing._id }, { $set: articlePayload, $unset: { storyLayout: 1 } });
      updatedCount++;
    } else {
      await Article.create(articlePayload);
      createdCount++;
    }
  }

  console.info(`[Phase 5 Seeder] Complete. Created: ${createdCount}, Updated: ${updatedCount}`);
  return {
    status: "success",
    created: createdCount,
    updated: updatedCount,
    dryRun: Boolean(dryRun),
  };
}

async function run() {
  const { dryRun } = parseArgs();
  await connectDb({ runSeeders: false });
  try {
    await seedPhase5Articles({ dryRun });
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  run().catch((err) => {
    console.error("[Phase 5 Seeder] Failed:", err.message);
    process.exitCode = 1;
  });
}

module.exports = {
  assertFixtureEnvironment,
  parseArgs,
  seedPhase5Articles,
};
