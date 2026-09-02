"use strict";

const {
  checkMongoReachable,
  checkPortAvailable,
  describeMongoTarget,
  resolveMongoConfig,
} = require("../config/runtimeDiagnostics");

const runPreflight = async ({
  mode = "full",
  source = process.env,
  portCheck = checkPortAvailable,
  mongoCheck = checkMongoReachable,
} = {}) => {
  const failures = [];
  const clientPort = Number(source.PARCEL_PORT || 1234);
  const serverPort = Number(source.SERVER_PORT || source.PORT || 5000);
  const ports = mode === "ui" ? [{ name: "Parcel", port: clientPort }] : [
    { name: "Parcel", port: clientPort },
    { name: "API", port: serverPort },
  ];

  for (const entry of ports) {
    const result = await portCheck({ port: entry.port });
    if (!result.available) {
      failures.push(`${entry.name} port ${entry.port} is already in use. Stop the existing project process before starting another instance.`);
    }
  }

  if (mode === "full") {
    const mongo = resolveMongoConfig(source);
    const result = await mongoCheck({ uri: mongo.uri, timeoutMs: 3000 });
    if (!result.reachable) {
      failures.push(`MongoDB is unavailable at ${describeMongoTarget(mongo.uri)}. Start MongoDB or configure MONGO_URI.`);
    }
  }

  return { ok: failures.length === 0, failures };
};

const main = async () => {
  require("dotenv").config();
  const mode = process.argv[2] === "ui" ? "ui" : "full";
  const result = await runPreflight({ mode });
  for (const failure of result.failures) {
    process.stderr.write(`[preflight] ${failure}\n`);
  }
  if (result.ok) {
    process.stdout.write(`[preflight] ${mode === "ui" ? "UI-only" : "Full-stack"} startup checks passed.\n`);
  } else {
    process.exitCode = 1;
  }
};

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`[preflight] Startup checks failed safely (${error.name || "Error"}).\n`);
    process.exitCode = 1;
  });
}

module.exports = { runPreflight };
