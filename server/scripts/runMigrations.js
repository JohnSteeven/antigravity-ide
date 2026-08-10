const mongoose = require("mongoose");
const connectDb = require("../config/db");
const MigrationRunner = require("../migrations/MigrationRunner");

const run = async () => {
  await connectDb();
  const runner = new MigrationRunner(mongoose.connection.db);
  const command = process.argv[2] || "up";
  if (command === "status") console.table(await runner.status());
  else if (command === "down") await runner.down(Number(process.argv[3] || 1));
  else await runner.up();
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exit(1);
});
