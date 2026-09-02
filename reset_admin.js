const mongoose = require("mongoose");
const connectDb = require("./server/config/db");
const User = require("./server/models/User");

async function run() {
  await connectDb();
  await User.deleteOne({ email: "admin@myjourney.com" });
  console.log("Deleted admin account.");
  await mongoose.connection.close();
}
run().catch(console.error);
