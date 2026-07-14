const mongoose = require("mongoose");
const connectDb = require("../config/db");
const User = require("../models/User");

async function run() {
  await connectDb();
  console.log("Checking Admin roles...");

  const users = await User.find({}, "email username role verified");
  console.log("\nAll Users in DB:");
  console.table(users.map(u => ({
    email: u.email,
    username: u.username,
    role: u.role,
    emailVerified: u.verified?.email,
    mobileVerified: u.verified?.mobile
  })));

  await mongoose.connection.close();
  process.exit(0);
}

run();
