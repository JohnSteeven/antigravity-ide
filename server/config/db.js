const mongoose = require("mongoose");
const env = require("./env");
const seedCmsPermissionsAndRoles = require("./seeder");

const connectDb = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri);
  console.log("MongoDB connected");
  await seedCmsPermissionsAndRoles();
};

module.exports = connectDb;
