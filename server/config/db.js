const mongoose = require("mongoose");
const env = require("./env");
const seedCmsPermissionsAndRoles = require("./seeder");
const seedArticles = require("../scripts/seedArticles");
const { describeMongoTarget } = require("./runtimeDiagnostics");

const connectDb = async ({ runSeeders = true } = {}) => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: env.mongoServerSelectionTimeoutMs,
    });
    console.log("MongoDB connected");
    if (runSeeders) {
      await seedCmsPermissionsAndRoles();
      if (process.env.SEED_DEMO_DATA === "true") {
        await seedArticles();
      }
    }
    return mongoose.connection;
  } catch (error) {
    const target = describeMongoTarget(env.mongoUri);
    console.error(
      `MongoDB is unavailable at ${target}. Start MongoDB or configure MONGO_URI. Server startup aborted. (${error.name || "ConnectionError"})`
    );
    throw error;
  }
};

module.exports = connectDb;
