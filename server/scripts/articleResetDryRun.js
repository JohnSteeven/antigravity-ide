"use strict";

const mongoose = require("mongoose");
const connectDb = require("../config/db");
const migration013 = require("../migrations/013-phase5-article-catalog-reset");

const run = async () => {
  await connectDb({ runSeeders: false });
  try {
    const report = await migration013.plan(mongoose.connection.db);
    process.stdout.write(`\n=== PHASE 5 ARTICLE RESET DRY-RUN REPORT ===\n`);
    process.stdout.write(JSON.stringify(report, null, 2));
    process.stdout.write(`\n===========================================\n\n`);
  } finally {
    await mongoose.disconnect();
  }
};

if (require.main === module) {
  run().catch(async (error) => {
    process.stderr.write(`Article reset dry-run failed: ${error.message}\n`);
    await mongoose.disconnect().catch(() => {});
    process.exitCode = 1;
  });
}

module.exports = { run };
