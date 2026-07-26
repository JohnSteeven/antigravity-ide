const mongoose = require("mongoose");
const env = require("./server/config/env");
const Article = require("./server/models/Article");

async function run() {
  try {
    await mongoose.connect(env.mongoUri);
    console.log("Connected to DB");
    const articles = await Article.find({ body: /remove-image-btn/i });
    console.log(`Found ${articles.length} articles with remove-image-btn.`);
    articles.forEach(art => {
      console.log("ID:", art._id);
      console.log("SLUG:", art.slug);
      console.log("TITLE:", art.title);
      console.log("BODY CONTAINING remove-image-btn:", JSON.stringify(art.body));
    });
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
