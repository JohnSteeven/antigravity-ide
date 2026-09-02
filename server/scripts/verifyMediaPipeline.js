const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDb = require("../config/db");
const Article = require("../models/Article");
const articleService = require("../services/articleService");
const { formatImageUrl } = require("../utils/imageUrlHelper");

async function runMediaVerification() {
  console.log("\n========================================================");
  console.log("Starting Enterprise Media & Image Pipeline Verification");
  console.log("========================================================\n");

  // 1. Verify Uploads Directory Structure
  const uploadsDir = path.join(__dirname, "../uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  console.log("✓ Step 1: Uploads directory verified on disk:", uploadsDir);

  const subFolders = ["articles", "covers", "gallery", "profile", "misc"];
  for (const folder of subFolders) {
    const p = path.join(uploadsDir, folder);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  }
  console.log("✓ Step 2: Sub-folders (articles, covers, gallery, profile, misc) verified.");

  // 2. Database & API Image URL Verification
  await connectDb();

  const { articles } = await articleService.getArticles({ limit: 100 });
  console.log(`\n✓ Step 3: Auditing ${articles.length} active articles from API Service...`);

  let invalidCount = 0;
  for (const article of articles) {
    if (!article.coverImage || typeof article.coverImage !== "string" || !article.coverImage.startsWith("http")) {
      console.error(`❌ Invalid image URL for article "${article.title}":`, article.coverImage);
      invalidCount++;
    }
  }

  if (invalidCount === 0) {
    console.log(`✓ Step 4: All ${articles.length} articles return fully formed HTTPS/HTTP image URLs.`);
  } else {
    throw new Error(`Found ${invalidCount} articles with invalid image URLs!`);
  }

  // 3. Verify Helper Formatting Logic
  const relativeTest = formatImageUrl("uploads/articles/test.jpg");
  if (relativeTest !== "http://localhost:5000/uploads/articles/test.jpg") {
    throw new Error(`URL Helper formatting failed: Expected 'http://localhost:5000/uploads/articles/test.jpg', got '${relativeTest}'`);
  }
  console.log("✓ Step 5: Centralized URL Helper relative path resolution verified.");

  console.log("\n========================================================");
  console.log("✓ ALL MEDIA PIPELINE VERIFICATION CHECKS PASSED (100%)");
  console.log("========================================================\n");

  await mongoose.connection.close();
  process.exit(0);
}

runMediaVerification().catch((err) => {
  console.error("\n❌ MEDIA PIPELINE VERIFICATION FAILED:", err.message);
  process.exit(1);
});
