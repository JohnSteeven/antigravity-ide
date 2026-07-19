const mongoose = require("mongoose");
const connectDb = require("../config/db");
const Article = require("../models/Article");
const Category = require("../models/Category");
const User = require("../models/User");
const premiumArticles = require("../../src/data/premiumArticles.json");

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
    for (const art of premiumArticles) {
      // Find matching category to map categoryId
      const categorySlug = art.category.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
      const categoryModel = await Category.findOne({ slug: categorySlug });
      
      const mappedArticle = {
        title: art.title,
        slug: art.slug,
        description: art.description,
        body: art.body,
        coverImage: art.coverImage,
        gallery: art.gallery || [],
        status: art.status || "published",
        isFeatured: art.featured !== undefined ? art.featured : false,
        isMustRead: art.mustRead !== undefined ? art.mustRead : false,
        isTrending: art.trending !== undefined ? art.trending : false,
        isPinned: art.pinned !== undefined ? art.pinned : false,
        publishedAt: art.publishedAt ? new Date(art.publishedAt) : new Date(),
        updatedAt: art.updatedAt ? new Date(art.updatedAt) : new Date(),
        readingTime: art.readingTime || "5 min read",
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
        // Custom premium storytelling metadata fields (optional)
        difficulty: art.difficulty || undefined,
        location: art.location || undefined,
        weather: art.weather || undefined,
        budget: art.budget || undefined,
        bestTime: art.bestTime || undefined,
        tips: art.tips || undefined,
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
