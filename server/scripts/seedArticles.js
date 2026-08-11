const mongoose = require("mongoose");
const connectDb = require("../config/db");
const Article = require("../models/Article");
const Category = require("../models/Category");
const User = require("../models/User");
const premiumArticles = require("../../src/data/premiumArticles.json");
const storyFixtures = require("../../src/data/storyFixtures.cjs");
const { normalizeStorySections, normalizeStoryLayout, calculateStoryReadingTime } = require("../utils/storyContent");

async function seedArticles() {
  console.log("Starting Article Seeding Script...");
  
  // Find default admin or first user as author
  let authorUser = await User.findOne({ role: { $in: ["Admin", "admin"] } });
  if (!authorUser) {
    authorUser = await User.findOne({});
  }
  
  const authorId = authorUser ? authorUser._id : new mongoose.Types.ObjectId();
  const authorName = authorUser ? `${authorUser.firstName} ${authorUser.lastName}`.trim() : "Noble John Steeven";

  try {
    const developmentContent = [...premiumArticles.filter((item) => item.contentType !== "story"), ...storyFixtures];
    for (const art of developmentContent) {
      // Find matching category to map categoryId
      const categorySlug = art.category.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
      const categoryModel = await Category.findOne({ slug: categorySlug });
      
      const mappedArticle = {
        ...art,
        title: art.title,
        slug: art.slug,
        description: art.description,
        body: art.body,
        coverImage: art.coverImage,
        gallery: art.gallery || [],
        contentType: art.contentType || "article",
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
        readingTimeMin: art.contentType === "story" ? calculateStoryReadingTime(art) : art.readingTimeMin,
        readingTime: art.contentType === "story" ? `${calculateStoryReadingTime(art)} min read` : (art.readingTime || "1 min read"),
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
      };

      await Article.findOneAndUpdate(
        { slug: art.slug },
        { $set: mappedArticle },
        { upsert: true, new: true }
      );
      
      console.log(`Seeded Article: "${art.title}"`);
    }
    console.log("Article Seeding completed successfully.");
  } catch (err) {
    console.error("Article Seeding failed:", err);
    throw err;
  }
}

// Support running directly from command line
if (require.main === module) {
  const runDirectly = async () => {
    try {
      await connectDb();
      await seedArticles();
    } catch (err) {
      console.error(err);
    } finally {
      await mongoose.connection.close();
      console.log("Disconnected from MongoDB.");
    }
  };
  runDirectly();
}

module.exports = seedArticles;
