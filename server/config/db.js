const mongoose = require("mongoose");
const env = require("./env");
const seedCmsPermissionsAndRoles = require("./seeder");
const seedArticles = require("../scripts/seedArticles");

const connectDb = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 3000 });
    console.log("MongoDB connected");
    await seedCmsPermissionsAndRoles();
    if (process.env.SEED_DEMO_DATA === "true") {
      await seedArticles();
    }
    return mongoose.connection;
  } catch (error) {
    console.error("MongoDB connection failed; server startup aborted:", error.message);
    throw error;
  }
};

module.exports = connectDb;
