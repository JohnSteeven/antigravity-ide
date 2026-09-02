"use strict";

require("dotenv").config();

const packageJson = require("../../package.json");
const {
  checkMongoReachable,
  checkPortAvailable,
  describeMongoTarget,
  resolveMongoConfig,
} = require("../config/runtimeDiagnostics");

const report = (status, message) => process.stdout.write(`[doctor] ${status} ${message}\n`);

const main = async () => {
  let blockers = 0;
  const declaredNode = packageJson.engines?.node;
  report(declaredNode ? "OK" : "WARN", declaredNode
    ? `Node ${process.version} (declared support: ${declaredNode}).`
    : `Node ${process.version}; package.json does not yet declare a supported Node range.`);

  const ports = [
    { name: "Parcel", port: Number(process.env.PARCEL_PORT || 1234) },
    { name: "API", port: Number(process.env.SERVER_PORT || process.env.PORT || 5000) },
  ];
  for (const entry of ports) {
    const result = await checkPortAvailable({ port: entry.port });
    if (result.available) report("OK", `${entry.name} port ${entry.port} is available.`);
    else {
      blockers += 1;
      report("BLOCKED", `${entry.name} port ${entry.port} is already in use.`);
    }
  }

  const mongo = resolveMongoConfig();
  report("INFO", `MongoDB target comes from ${mongo.source}: ${describeMongoTarget(mongo.uri)}.`);
  const mongoResult = await checkMongoReachable({ uri: mongo.uri, timeoutMs: 3000 });
  if (mongoResult.reachable) report("OK", "MongoDB is reachable.");
  else {
    blockers += 1;
    report("BLOCKED", `MongoDB is unreachable (${mongoResult.errorName}).`);
  }

  const requiredKeys = process.env.NODE_ENV === "production"
    ? ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET", "MULTIPLAYER_GUEST_SECRET"]
    : [];
  const missing = requiredKeys.filter((key) => !process.env[key]);
  if (missing.length) {
    blockers += missing.length;
    report("BLOCKED", `Missing required production variables: ${missing.join(", ")}.`);
  } else {
    report("OK", "Required variables for the current environment are present.");
  }

  if (blockers) {
    report("RESULT", `${blockers} blocking diagnostic(s) found.`);
    process.exitCode = 1;
  } else {
    report("RESULT", "No startup blockers found.");
  }
};

main().catch((error) => {
  report("BLOCKED", `Doctor failed safely (${error.name || "Error"}).`);
  process.exitCode = 1;
});
