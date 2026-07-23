const mongoose = require("mongoose");
const connectDb = require("../config/db");
const User = require("../models/User");

async function run() {
  try {
    await connectDb();
    const users = await User.find({});
    console.log("Users in DB:");
    users.forEach(u => {
      console.log(`- ID: ${u._id}, Email: ${u.email}, Username: ${u.username}, Role: ${u.role}, Status: ${u.status}, Verified Email: ${u.verified?.email}, Verified Mobile: ${u.verified?.mobile}`);
    });
  } catch (error) {
    console.error("Error inspecting database:", error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

run();
