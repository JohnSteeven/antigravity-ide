const mongoose = require("mongoose");
const connectDb = require("../config/db");
const Article = require("../models/Article");

const CATEGORY_DEFAULT_IMAGES = {
  life: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1200&q=80",
  incidents: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
  travel: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
  technology: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
  writing: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
  philosophy: "https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&w=1200&q=80",
  default: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1200&q=80",
};

async function normalizeArticleImages() {
  console.log("\n========================================================");
  console.log("Starting Article Image Normalization & Self-Healing Script");
  console.log("========================================================\n");

  await connectDb();

  const articles = await Article.find({ isDeleted: false });
  console.log(`Found ${articles.length} active articles to audit...`);

  let updatedCount = 0;

  for (const article of articles) {
    if (!article.coverImage || !article.coverImage.trim()) {
      const catKey = (article.category || "").toLowerCase().trim();
      const fallbackUrl = CATEGORY_DEFAULT_IMAGES[catKey] || CATEGORY_DEFAULT_IMAGES.default;
      article.coverImage = fallbackUrl;
      await article.save();
      console.log(`✓ Restored coverImage for "${article.title}" (${article.category || 'Default'}) -> ${fallbackUrl}`);
      updatedCount++;
    }
  }

  console.log(`\n========================================================`);
  console.log(`✓ Self-Healing Complete: ${updatedCount} articles updated with valid cover images.`);
  console.log(`========================================================\n`);

  await mongoose.connection.close();
  process.exit(0);
}

normalizeArticleImages().catch((err) => {
  console.error("❌ Image Normalization Failed:", err);
  process.exit(1);
});
