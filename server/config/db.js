const mongoose = require("mongoose");
const env = require("./env");
const seedCmsPermissionsAndRoles = require("./seeder");
const seedArticles = require("../scripts/seedArticles");

const connectDb = async () => {
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log("MongoDB connected");
    await seedCmsPermissionsAndRoles();
    if (process.env.SEED_DEMO_DATA === "true") {
      await seedArticles();
    }
  } catch (error) {
    console.warn("MongoDB connection unavailable. Operating in in-memory mode:", error.message);
  }
};

module.exports = connectDb;
