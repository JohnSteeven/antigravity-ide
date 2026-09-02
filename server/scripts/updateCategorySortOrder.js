const mongoose = require("mongoose");
const connectDb = require("../config/db");
const Category = require("../models/Category");

const order = [
  { slug: "life", sortOrder: 1 },
  { slug: "reflections", sortOrder: 2 },
  { slug: "incidents", sortOrder: 3 },
  { slug: "lessons", sortOrder: 4 },
  { slug: "travel", sortOrder: 5 },
  { slug: "coding", sortOrder: 6 }
];

async function run() {
  console.log("Starting category sortOrder updates...");
  await connectDb();
  try {
    for (const item of order) {
      const res = await Category.updateOne({ slug: item.slug }, { $set: { sortOrder: item.sortOrder } });
      console.log(`Updated ${item.slug} sortOrder to ${item.sortOrder}:`, res);
    }
    console.log("Finished updating sortOrders successfully.");
  } catch (err) {
    console.error("Error updating sortOrders:", err);
  } finally {
    mongoose.connection.close();
  }
}
run();
