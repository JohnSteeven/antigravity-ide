const mongoose = require("mongoose");
const Article = require("../models/Article");
const Category = require("../models/Category");
const User = require("../models/User");
const premiumArticles = require("../../src/data/premiumArticles.json");
const storyFixtures = require("../../src/data/storyFixtures.cjs");
const launchStories = require("../data/launchStories");
const { normalizeStorySections, normalizeStoryLayout, calculateStoryReadingTime } = require("../utils/storyContent");

const assertFixtureEnvironment = () => {
  if (!["development", "test"].includes(process.env.NODE_ENV)) {
    throw new Error("Article/Story fixtures require NODE_ENV=development or NODE_ENV=test. Seeding is disabled in every other environment.");
  }
};

async function seedArticles() {
  assertFixtureEnvironment();
  console.log("Starting Article Seeding Script...");

  // Find default admin or first user as author
  let authorUser = await User.findOne({ role: { $in: ["Admin", "admin"] } });
  if (!authorUser) {
    authorUser = await User.findOne({});
  }

  const authorId = authorUser ? authorUser._id : new mongoose.Types.ObjectId();
  const authorName = authorUser ? `${authorUser.firstName} ${authorUser.lastName}`.trim() : "Noble John Steeven";

  try {
    const productionStories = Array.isArray(launchStories) && launchStories.length > 0 ? launchStories : storyFixtures;

    // Archive obsolete legacy stories so database foreign keys and saved records are preserved
    const archivedConfig = require("../data/launchStories/archived.json");
    if (archivedConfig && Array.isArray(archivedConfig.archivedStories)) {
      for (const item of archivedConfig.archivedStories) {
        const isReusedInActiveCatalog = productionStories.some((s) => s.slug === item.slug);
        if (!isReusedInActiveCatalog) {
          await Article.updateMany(
            { slug: item.slug },
            { $set: { status: "archived", isFeatured: false, isTrending: false, isMustRead: false, isPinned: false } }
          );
        }
      }
    }

    // Ensure any legacy story in the database not part of canonical launch stories is archived
    const canonicalStorySlugs = productionStories.map((s) => s.slug);
    await Article.updateMany(
      {
        $or: [
          { contentType: "story" },
          { storyLayout: { $exists: true, $ne: "" } },
          { category: "Stories" },
        ],
        slug: { $nin: canonicalStorySlugs },
      },
      { $set: { status: "archived", isFeatured: false, isTrending: false, isMustRead: false, isPinned: false } }
    );

    const developmentContent = [...premiumArticles.filter((item) => item.contentType !== "story"), ...productionStories];
    for (const art of developmentContent) {
      // Find matching category to map categoryId
      const categorySlug = art.category.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
      const categoryModel = await Category.findOne({ slug: categorySlug });

      const { relatedStories, ...artFields } = art;

      const mappedArticle = {
        ...artFields,
        title: art.title,
        slug: art.slug,
        description: art.description,
        body: art.body,
        coverImage: art.coverImage,
        gallery: art.gallery || [],
        contentType: (art.contentType === "story" || Boolean(art.storyLayout) || Array.isArray(art.storySections)) ? "story" : (art.contentType || "article"),
        storyThemes: art.storyThemes || [],
        storyFormat: art.storyFormat || "",
        storyOrigin: art.storyOrigin || "",
        introLocation: art.introLocation || "",
        introTime: art.introTime || "",
        reflection: art.reflection || "",
        takeaway: art.takeaway || "",
        storyLayout: normalizeStoryLayout(art.storyLayout),
        storySections: Array.isArray(art.storySections) ? normalizeStorySections(art.storySections) : undefined,
        coverImageAlt: art.coverImageAlt || "",
        status: art.status || "published",
        isFeatured: art.featured !== undefined ? art.featured : false,
        isMustRead: art.mustRead !== undefined ? art.mustRead : false,
        isTrending: art.trending !== undefined ? art.trending : false,
        isPinned: art.pinned !== undefined ? art.pinned : false,
        publishedAt: art.publishedAt ? new Date(art.publishedAt) : new Date(),
        updatedAt: art.updatedAt ? new Date(art.updatedAt) : new Date(),
        readingTimeMin: (art.contentType === "story" || Boolean(art.storyLayout) || Array.isArray(art.storySections))
          ? calculateStoryReadingTime(art)
          : art.readingTimeMin,
        readingTime: (art.contentType === "story" || Boolean(art.storyLayout) || Array.isArray(art.storySections))
          ? `${calculateStoryReadingTime(art)} min read`
          : (art.readingTime || "1 min read"),
        authorId,
        author: authorName,
        category: art.category,
        categoryId: categoryModel ? categoryModel._id : undefined,
        categorySlug,
        subcategory: art.subcategory || "",
        tags: art.tags || [],
        views: art.views || 0,
        likes: art.likes || 0,
        bookmarks: art.bookmarks || 0,
        rating: art.rating || 4.5,
        isDeleted: false,
        ...(Array.isArray(relatedStories) && relatedStories.length > 0 && relatedStories.every((r) => mongoose.Types.ObjectId.isValid(r))
          ? { relatedStories }
          : {}),
      };

      await Article.findOneAndUpdate(
        { slug: art.slug },
        { $set: mappedArticle },
        { upsert: true, new: true }
      );

      console.log(`Seeded Article: "${art.title}"`);
    }

    // Pass 2: Resolve relatedStories slugs to ObjectIds
    for (const art of developmentContent) {
      if (Array.isArray(art.relatedStories) && art.relatedStories.length > 0) {
        const slugList = art.relatedStories.filter((s) => typeof s === "string");
        if (slugList.length > 0) {
          const relatedDocs = await Article.find({ slug: { $in: slugList } }).select("_id slug").lean();
          const relatedIds = relatedDocs.map((d) => d._id);
          if (relatedIds.length > 0) {
            await Article.updateOne({ slug: art.slug }, { $set: { relatedStories: relatedIds } });
          }
        }
      }
    }
    console.log("Article Seeding completed successfully.");
  } catch (err) {
    console.error("Article Seeding failed:", err);
    throw err;
  }
}

const runDirectly = async () => {
  // Check before importing the runtime connector or opening a database.
  assertFixtureEnvironment();
  const connectDb = require("../config/db");
  try {
    await connectDb({ runSeeders: false });
    await seedArticles();
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  runDirectly().catch(() => {
    console.error("Article fixture seeding failed. Use an explicit development/test environment and inspect its database configuration.");
    process.exitCode = 1;
  });
}

module.exports = seedArticles;
module.exports.runDirectly = runDirectly;
