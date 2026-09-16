const mongoose = require("mongoose");
const MigrationRunner = require("../migrations/MigrationRunner");

const parseArguments = (args = []) => {
  const [command = "up", count, ...extra] = args;
  if (!["up", "status", "validate", "down"].includes(command)
    || extra.length || (command !== "down" && count !== undefined)
    || (command === "down" && count !== undefined && (!/^[1-9]\d*$/.test(count) || !Number.isSafeInteger(Number(count))))) {
    throw new Error("Usage: migrate [up|status|validate|down [positive integer count]]. Unknown commands never apply migrations.");
  }
  return { command, count: command === "down" ? Number(count || 1) : undefined };
};

const run = async (args = process.argv.slice(2)) => {
  const { command, count } = parseArguments(args);
  const connectDb = require("../config/db");
  try {
    await connectDb({ runSeeders: false });
    const runner = new MigrationRunner(mongoose.connection.db);
    if (command === "status") console.table(await runner.status());
    else if (command === "validate") {
      const result = await runner.validate();
      console.table(result.checks.map((check) => ({ migration: check.name, status: check.status, missingIndexes: check.missingIndexes.join(", ") })));
      if (!result.valid) process.exitCode = 2;
    }
    else if (command === "down") await runner.down(count);
    else await runner.up();
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  run().catch((error) => {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  });
}

module.exports = { parseArguments, run };
