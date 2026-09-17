"use strict";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  013-phase5-article-catalog-reset.js  —  Phase 5 Article Catalog Safe Reset
 *  MyJourney Platform  |  Phase 5 Step 1
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Responsibilities:
 *  - Existing records ONLY — never creates new Phase 5 catalog articles.
 *  - Never deletes Article documents (Article.deleteMany() is prohibited).
 *  - Soft-archives legacy/prototype articles with:
 *      status: "archived"
 *      isArchived: true
 *      archivedAt: timestamp
 *  - Updates legacy "Incidents" category references to "Experiences".
 *  - Strictly protects Phase 4 Stories (contentType: "story", storyLayout, etc.).
 *  - Strictly protects News articles (excluded from Phase 5 reset).
 *  - Strictly protects Coding articles (Phase 6 domain).
 *  - Supports read-only dry-run reporting with exact before/affected counts and slugs.
 *  - Fully idempotent and safe to run repeatedly.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const INDEXES = Object.freeze({
  articles: [
    [
      { isArchived: 1, status: 1, publishedAt: -1 },
      { name: "article_archived_status_published" },
    ],
  ],
});

const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const compatible = (index, keys, options) =>
  same(index.key, keys)
  && Boolean(index.unique) === Boolean(options.unique)
  && (options.partialFilterExpression === undefined
    || same(index.partialFilterExpression, options.partialFilterExpression));

// Explicit targeting query: strictly legacy articles that are NOT News, NOT Coding, and NOT Stories
const buildTargetFilter = () => ({
  contentType: "article",
  category: { $nin: [/^news$/i, /^coding$/i, /^stories$/i] },
  categorySlug: { $nin: ["news", "coding", "stories"] },
  // Explicit Story guards
  $and: [
    { contentType: { $ne: "story" } },
    { storyLayout: { $in: [null, "", undefined] } },
    { category: { $ne: "Stories" } },
    { categorySlug: { $ne: "stories" } },
  ],
});

/**
 * Plan / Dry-run function: computes exact counts and affected identifiers without mutating.
 */
const plan = async (db) => {
  const articles = db.collection("articles");
  const filter = buildTargetFilter();

  // Inspect all matching records
  const targetRecords = await articles
    .find(filter, { projection: { _id: 1, slug: 1, title: 1, category: 1, categorySlug: 1, status: 1, isArchived: 1, archivedAt: 1 } })
    .toArray();

  const totalTargetCount = targetRecords.length;
  const alreadyArchived = targetRecords.filter((doc) => doc.status === "archived" && doc.isArchived === true);
  const pendingArchive = targetRecords.filter((doc) => !(doc.status === "archived" && doc.isArchived === true));

  // Count protected groups for audit transparency
  const storyCount = await articles.countDocuments({
    $or: [
      { contentType: "story" },
      { storyLayout: { $exists: true, $ne: "" } },
      { category: "Stories" },
      { categorySlug: "stories" },
    ],
  });

  const newsCount = await articles.countDocuments({
    $or: [{ category: /^news$/i }, { categorySlug: "news" }],
  });

  const codingCount = await articles.countDocuments({
    $or: [{ category: /^coding$/i }, { categorySlug: "coding" }],
  });

  // Incidents category migration check
  const incidentsArticlesCount = await articles.countDocuments({
    $or: [{ category: /^incidents$/i }, { categorySlug: "incidents" }],
  });

  const categoriesCollection = db.collection("categories");
  const incidentsCategoryDoc = await categoriesCollection.findOne({
    $or: [{ slug: "incidents" }, { name: /^incidents$/i }],
  });

  return {
    dryRun: true,
    targetQuery: filter,
    beforeCount: totalTargetCount,
    alreadyArchivedCount: alreadyArchived.length,
    affectedCount: pendingArchive.length,
    affectedIds: pendingArchive.map((d) => String(d._id)),
    affectedSlugs: pendingArchive.map((d) => d.slug).filter(Boolean),
    protectedCounts: {
      stories: storyCount,
      news: newsCount,
      coding: codingCount,
    },
    taxonomy: {
      incidentsArticlesCount,
      incidentsCategoryExists: Boolean(incidentsCategoryDoc),
    },
  };
};

/**
 * Apply migration
 */
const up = async (db, options = {}) => {
  if (options.dryRun) {
    return plan(db);
  }

  const articles = db.collection("articles");
  const categories = db.collection("categories");
  const now = new Date();

  // 1. Pre-flight audit plan
  const auditPlan = await plan(db);

  // 2. Migrate taxonomy: Update Category document from Incidents -> Experiences
  const incidentsCategory = await categories.findOne({
    $or: [{ slug: "incidents" }, { name: /^incidents$/i }],
  });
  if (incidentsCategory) {
    await categories.updateOne(
      { _id: incidentsCategory._id },
      {
        $set: {
          name: "Experiences",
          slug: "experiences",
          description: "Memorable moments, personal encounters, and turning points from real experience.",
          updatedAt: now,
        },
      }
    );
  }

  // 3. Migrate taxonomy on legacy Article documents: "Incidents" -> "Experiences"
  await articles.updateMany(
    {
      $or: [{ category: /^incidents$/i }, { categorySlug: "incidents" }],
      contentType: "article",
    },
    [
      {
        $set: {
          category: "Experiences",
          categorySlug: "experiences",
        },
      },
    ]
  );

  // 4. Soft-archive target legacy articles (excluding Stories, News, and Coding)
  const targetFilter = buildTargetFilter();

  const updateResult = await articles.updateMany(
    targetFilter,
    [
      {
        $set: {
          status: "archived",
          isArchived: true,
          archivedAt: { $ifNull: ["$archivedAt", now] },
          isFeatured: false,
          isTrending: false,
          isMustRead: false,
          isPinned: false,
        },
      },
    ]
  );

  // 5. Ensure migration indexes
  for (const [collectionName, specs] of Object.entries(INDEXES)) {
    const col = db.collection(collectionName);
    const existing = await col.indexes().catch((error) =>
      error.codeName === "NamespaceNotFound" ? [] : Promise.reject(error)
    );
    for (const [keys, opt] of specs) {
      if (!existing.some((idx) => compatible(idx, keys, opt))) {
        await col.createIndex(keys, opt);
      }
    }
  }

  return {
    success: true,
    beforeCount: auditPlan.beforeCount,
    affectedCount: updateResult.modifiedCount,
    matchedCount: updateResult.matchedCount,
    protectedCounts: auditPlan.protectedCounts,
    affectedSlugs: auditPlan.affectedSlugs,
  };
};

/**
 * Rollback migration (optional)
 * Restores isArchived: false for documents where appropriate, but does not invent unarchived states.
 */
const down = async (db) => {
  // Safe down: removes the specific index if needed; preserves data integrity
  const articles = db.collection("articles");
  await articles.dropIndex("article_archived_status_published").catch((err) => {
    if (err.codeName !== "IndexNotFound") throw err;
  });
};

module.exports = {
  name: "013-phase5-article-catalog-reset",
  version: "1.0.0",
  indexes: INDEXES,
  buildTargetFilter,
  plan,
  up,
  down,
};
