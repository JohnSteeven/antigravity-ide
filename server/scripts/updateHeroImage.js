const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/myjourney";

const Schema = mongoose.Schema;
const CmsSchema = new Schema({
  site: {
    brand: String,
    hero: {
      eyebrow: String,
      title: String,
      description: String,
      primaryLabel: String,
      secondaryLabel: String,
      image: String,
    },
    storyIntro: {
      subtitle: String,
      text: String,
      cta: String,
    },
    quote: {
      text: String,
      author: String,
      image: String,
    },
  },
}, { strict: false });

const Cms = mongoose.model("Cms", CmsSchema, "cms");

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    const doc = await Cms.findOne();
    if (doc) {
      doc.site.hero.image = "https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&w=1800&q=80";
      doc.markModified("site");
      await doc.save();
      console.log("Successfully updated hero image to golden misty mountains!");
    } else {
      console.log("No CMS document found to update.");
    }
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
