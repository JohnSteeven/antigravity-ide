const mongoose = require("mongoose");
const MONGO_URI = "mongodb://127.0.0.1:27017/myjourney";

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB!");

  const Category = mongoose.model("Category", new mongoose.Schema({}, { strict: false }), "categories");
  const Article = mongoose.model("Article", new mongoose.Schema({}, { strict: false }), "articles");

  const categories = await Category.find({});
  console.log("\n=== CATEGORIES ===");
  categories.forEach(c => {
    console.log(`- Name: "${c.name}", Slug: "${c.slug}", ID: ${c._id}`);
  });

  const articles = await Article.find({ isDeleted: false });
  console.log("\n=== ARTICLES ===");
  articles.forEach(a => {
    console.log(`- Title: "${a.title}", Category: "${a.category}", CategoryId: ${a.categoryId}, Status: "${a.status}"`);
  });

  await mongoose.disconnect();
}

run().catch(console.error);
