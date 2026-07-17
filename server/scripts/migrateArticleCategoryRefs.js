const mongoose = require("mongoose");
const connectDb = require("../config/db");
const Article = require("../models/Article");
const Category = require("../models/Category");

async function migrate() {
  console.log("Starting Article Category Migration...");
  await connectDb();
  console.log("Connected to MongoDB.");

  try {
    const categories = await Category.find({});
    console.log(`Loaded ${categories.length} categories.`);

    const categoryMap = {};
    categories.forEach((cat) => {
      categoryMap[cat.slug.toLowerCase()] = cat;
      categoryMap[cat.name.toLowerCase()] = cat;
    });

    const articles = await Article.find({ isDeleted: false });
    console.log(`Found ${articles.length} articles to check.`);

    let updatedCount = 0;
    let warningCount = 0;

    for (const article of articles) {
      const categoryName = article.category;
      if (!categoryName) {
        console.warn(`Article "${article.title}" (${article._id}) has no category string. Skipping.`);
        warningCount++;
        continue;
      }

      const categoryKey = categoryName.toLowerCase().trim();
      const matchedCategory = categoryMap[categoryKey];

      if (matchedCategory) {
        article.categoryId = matchedCategory._id;
        article.category = matchedCategory.name;
        article.categorySlug = matchedCategory.slug;
        await article.save();
        updatedCount++;
      } else {
        console.warn(`Could not find Category matching "${categoryName}" for article "${article.title}" (${article._id})`);
        warningCount++;
      }
    }

    console.log(`Migration complete! Updated ${updatedCount} articles. Warnings: ${warningCount}`);
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await mongoose.connection.close();
    console.log("Disconnected from MongoDB.");
  }
}

migrate();
