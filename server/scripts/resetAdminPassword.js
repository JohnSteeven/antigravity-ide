const mongoose = require("mongoose");
const connectDb = require("../config/db");
const User = require("../models/User");
const bcrypt = require("bcrypt");

async function run() {
  console.log("Resetting admin user account...");
  await connectDb();

  const adminEmail = "admin@myjourney.com";
  let user = await User.findOne({ $or: [{ email: adminEmail }, { username: "admin" }] });

  const newHash = await bcrypt.hash("Password123!", 12);

  if (!user) {
    user = await User.create({
      firstName: "Default",
      lastName: "Administrator",
      username: "admin",
      email: adminEmail,
      countryCode: "+91",
      mobile: "+919999999999",
      passwordHash: newHash,
      role: "Admin",
      verified: { email: true, mobile: true },
      failedLoginAttempts: 0,
      lockUntil: null,
    });
    console.log("Created fresh admin user!");
  } else {
    user.passwordHash = newHash;
    user.role = "Admin";
    user.verified = { email: true, mobile: true };
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();
    console.log("Reset and unlocked existing admin user!");
  }

  // Test bcrypt compare
  const isMatch = await bcrypt.compare("Password123!", user.passwordHash);
  console.log("Verification test bcrypt match:", isMatch);

  await mongoose.connection.close();
  process.exit(0);
}

run().catch((err) => {
  console.error("Failed to reset admin password:", err);
  process.exit(1);
});
