const mongoose = require("mongoose");
const env = require("./env");
const seedCmsPermissionsAndRoles = require("./seeder");
const seedArticles = require("../scripts/seedArticles");

const connectDb = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  console.log("MongoDB connected");
  await seedCmsPermissionsAndRoles();
  if (process.env.SEED_DEMO_DATA === "true") {
    await seedArticles();
  }
};

module.exports = connectDb;
