const mongoose = require("mongoose");
const connectDb = require("../config/db");
const User = require("../models/User");
const bcrypt = require("bcrypt");

async function run() {
  console.log("Starting Admin Bootstrap Script...");

  await connectDb();
  console.log("Connected to MongoDB.");

  const adminEmail = "admin@myjourney.com";
  const defaultPassword = "Password123!";

  try {
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log(`\n[Info] Administrator account already exists:`);
      console.log(`- Username: ${existingAdmin.username}`);
      console.log(`- Email: ${existingAdmin.email}`);
      console.log(`- Role: ${existingAdmin.role}`);
      console.log(`\nYou can log in with this email and its password.`);

      // Let's also ensure it is verified & has admin role
      let changed = false;
      if (!existingAdmin.verified.email || !existingAdmin.verified.mobile) {
        existingAdmin.verified.email = true;
        existingAdmin.verified.mobile = true;
        changed = true;
      }
      if (existingAdmin.role !== "Admin") {
        existingAdmin.role = "Admin";
        changed = true;
      }
      if (changed) {
        await existingAdmin.save();
        console.log("[Update] Ensured admin account is fully verified and has Admin role.");
      }
      process.exit(0);
    }

    // Create the first admin
    const passwordHash = await bcrypt.hash(defaultPassword, 12);
    const newAdmin = await User.create({
      firstName: "Default",
      lastName: "Administrator",
      username: "admin",
      email: adminEmail,
      countryCode: "+91",
      mobile: "+919999999999",
      passwordHash,
      role: "Admin",
      verified: {
        email: true,
        mobile: true,
      },
      profile: {
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
        bio: "Default administrator account for MyJourney platform management.",
      },
    });

    console.log(`\n[Success] Created the first Administrator account!`);
    console.log(`Use the following credentials to log in:`);
    console.log(`----------------------------------------`);
    console.log(`Email / Username: ${adminEmail} (or "admin")`);
    console.log(`Password:         ${defaultPassword}`);
    console.log(`Role:             ${newAdmin.role}`);
    console.log(`----------------------------------------`);

  } catch (error) {
    console.error("[Error] Bootstrapping admin failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("Disconnected from MongoDB.");
  }
}

run();
