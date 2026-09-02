const mongoose = require("mongoose");
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/myjourney";

const Schema = mongoose.Schema;
const CategorySchema = new Schema({
  name: String,
  slug: String,
  description: String,
  longDescription: String,
  icon: String,
  sortOrder: Number,
  heroImage: String,
  subcategories: [String],
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }
});

const Category = mongoose.model("Category", CategorySchema, "categories");

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    // Update Coding sortOrder to 7
    const coding = await Category.findOne({ slug: "coding" });
    if (coding) {
      coding.sortOrder = 7;
      await coding.save();
      console.log("Updated Coding sortOrder to 7.");
    }

    // Insert or update News category
    const news = await Category.findOne({ slug: "news" });
    const newsData = {
      name: "News",
      slug: "news",
      description: "Live world news and global updates.",
      longDescription: "Real-time updates and breaking news coverage from reputable international sources covering world events, culture, science, and technology.",
      icon: "globe",
      sortOrder: 6,
      heroImage: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1800&q=85",
      subcategories: ["World News", "Technology", "Science", "Business", "Culture"],
      isActive: true,
      isDeleted: false
    };

    if (news) {
      Object.assign(news, newsData);
      await news.save();
      console.log("Updated existing News category in DB.");
    } else {
      await Category.create(newsData);
      console.log("Inserted new News category into DB.");
    }

    console.log("Database category migration completed successfully!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
