const mongoose = require("mongoose");
const MONGO_URI = "mongodb://127.0.0.1:27017/myjourney";

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB!");

  const Category = mongoose.model("Category", new mongoose.Schema({}, { strict: false }), "categories");
  const Article = mongoose.model("Article", new mongoose.Schema({}, { strict: false }), "articles");

  const categories = await Category.find({});
  const articles = await Article.find({ isDeleted: false });

  console.log("Starting migration of articles with missing categoryId...");
  let count = 0;
  for (const article of articles) {
    if (!article.categoryId && article.category) {
      const cat = categories.find(c => c.name.toLowerCase() === article.category.toLowerCase());
      if (cat) {
        article.categoryId = cat._id;
        article.categorySlug = cat.slug;
        await Article.updateOne({ _id: article._id }, { $set: { categoryId: cat._id, categorySlug: cat.slug } });
        console.log(`Updated article "${article.title}" with categoryId: ${cat._id} and categorySlug: "${cat.slug}"`);
        count++;
      }
    }
  }

  console.log(`Migration completed! Updated ${count} articles.`);
  await mongoose.disconnect();
}

run().catch(console.error);
