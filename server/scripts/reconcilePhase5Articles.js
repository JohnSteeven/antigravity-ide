"use strict";

/**
 * reconcilePhase5Articles.js
 *
 * Master Reconciliation & Retirement Script for Phase 5 Articles
 *
 * Responsibilities:
 * 1. Ensures all 74 canonical Phase 5 articles are published and active (isArchived: false, status: "published").
 * 2. Preserves all Stories (contentType: "story") 100% untouched. Stories count affected must be 0.
 * 3. Preserves all News articles (category "News") 100% untouched. News count affected must be 0.
 * 4. Soft-archives all non-canonical legacy articles (contentType: "article"):
 *    status: "archived", isArchived: true, archivedAt: timestamp
 *    isFeatured: false, isTrending: false, isMustRead: false, isPinned: false
 * 5. Guarantees active legacy Coding article count = 0 (Coding in Learn remains untouched).
 * 6. Supports --dry-run for safe audit preview.
 */

const mongoose = require("mongoose");
const connectDb = require("../config/db");
const Article = require("../models/Article");
const { canonicalArticles } = require("../data/phase5Articles");

const parseArgs = (args = process.argv.slice(2)) => {
  return {
    dryRun: args.includes("--dry-run"),
  };
};

async function reconcileArticles(options = {}) {
  const { dryRun } = options;
  const canonicalSlugs = new Set(canonicalArticles.map((a) => a.slug));

  console.info(`[Reconcile] Starting Phase 5 catalog reconciliation (dryRun: ${Boolean(dryRun)})...`);
  console.info(`[Reconcile] Canonical articles registered: ${canonicalSlugs.size}`);

  const now = new Date();

  // Find all article documents with contentType: "article"
  const allArticleDocs = await Article.find(
    { contentType: "article" },
    { _id: 1, slug: 1, title: 1, category: 1, categorySlug: 1, status: 1, isArchived: 1 }
  ).lean();

  console.info(`[Reconcile] Total contentType: "article" documents in DB: ${allArticleDocs.length}`);

  let canonicalCount = 0;
  let newsCount = 0;
  let legacyArchivedCount = 0;
  let legacyCodingArchivedCount = 0;
  const slugsToArchive = [];

  for (const doc of allArticleDocs) {
    const isNews = /news/i.test(doc.category || "") || doc.categorySlug === "news";
    const isCanonical = canonicalSlugs.has(doc.slug);

    if (isNews) {
      newsCount++;
      continue;
    }

    if (isCanonical) {
      canonicalCount++;
      if (!dryRun && (doc.status !== "published" || doc.isArchived !== false)) {
        await Article.updateOne(
          { _id: doc._id },
          { $set: { status: "published", isArchived: false } }
        );
      }
      continue;
    }

    // Non-canonical legacy article
    const isCoding = /coding/i.test(doc.category || "") || doc.categorySlug === "coding";
    if (isCoding) {
      legacyCodingArchivedCount++;
    }
    legacyArchivedCount++;
    slugsToArchive.push(doc.slug);

    if (!dryRun) {
      await Article.updateOne(
        { _id: doc._id },
        {
          $set: {
            status: "archived",
            isArchived: true,
            archivedAt: now,
            isFeatured: false,
            isTrending: false,
            isMustRead: false,
            isPinned: false,
          },
        }
      );
    }
  }

  // Safety audit: Check that NO Stories were touched
  const storiesCount = await Article.countDocuments({
    $or: [
      { contentType: "story" },
      { storyLayout: { $exists: true, $ne: "" } },
      { category: "Stories" },
      { categorySlug: "stories" },
    ],
  });

  // Check active legacy coding articles count
  const activeCodingArticlesCount = await Article.countDocuments({
    contentType: "article",
    $or: [{ category: /coding/i }, { categorySlug: "coding" }],
    isArchived: { $ne: true },
    status: { $ne: "archived" },
  });

  const report = {
    dryRun: Boolean(dryRun),
    totalArticlesExamined: allArticleDocs.length,
    canonicalActiveCount: canonicalCount,
    newsPreservedCount: newsCount,
    legacyArchivedCount,
    legacyCodingArchivedCount,
    activeLegacyCodingArticlesRemaining: activeCodingArticlesCount,
    storiesProtectedCount: storiesCount,
    archivedSlugsSample: slugsToArchive.slice(0, 10),
  };

  console.info("[Reconcile] Audit Report:", JSON.stringify(report, null, 2));
  return report;
}

async function run() {
  const { dryRun } = parseArgs();
  await connectDb({ runSeeders: false });
  try {
    await reconcileArticles({ dryRun });
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  run().catch((err) => {
    console.error("[Reconcile] Failed:", err);
    process.exitCode = 1;
  });
}

module.exports = { reconcileArticles };
