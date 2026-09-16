const mongoose = require("mongoose");
const connectDb = require("../config/db");
const User = require("../models/User");
const { buildIdentityNormalizationReport } = require("../services/identityNormalizationReport");

const run = async () => {
  await connectDb({ runSeeders: false });
  const users = await User.find({}).select("email mobile verified.email verified.mobile").lean();
  const report = buildIdentityNormalizationReport(users);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  process.stderr.write(`Identity normalization dry run failed: ${error.message}\n`);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
