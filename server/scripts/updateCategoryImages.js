const mongoose = require("mongoose");
const connectDb = require("../config/db");
const Category = require("../models/Category");

const images = [
  { slug: "life", heroImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=1800&q=85" },
  { slug: "reflections", heroImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1800&q=85" },
  { slug: "incidents", heroImage: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1800&q=85" },
  { slug: "lessons", heroImage: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1800&q=85" },
  { slug: "travel", heroImage: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1800&q=85" },
  { slug: "coding", heroImage: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1800&q=85" }
];

async function run() {
  console.log("Updating category hero images in DB...");
  await connectDb();
  try {
    for (const item of images) {
      const res = await Category.updateOne({ slug: item.slug }, { $set: { heroImage: item.heroImage } });
      console.log(`Updated ${item.slug} image:`, res);
    }
    console.log("Finished updating hero images.");
  } catch (err) {
    console.error("Error updating hero images:", err);
  } finally {
    mongoose.connection.close();
  }
}
run();
