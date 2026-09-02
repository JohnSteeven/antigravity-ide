const express = require("express");
const net = require("net");
const request = require("supertest");
const mongoose = require("mongoose");

const {
  checkMongoReachable,
  checkPortAvailable,
  describeMongoTarget,
  resolveMongoConfig,
} = require("../config/runtimeDiagnostics");
const { getHealth, getReadiness } = require("../health/readiness");
const { clearStaleParcelTemp } = require("../scripts/clearParcelTemp");
const { runPreflight } = require("../scripts/startupPreflight");

describe("runtime diagnostics and health contracts", () => {
  test("detects an occupied port across the local socket boundary", async () => {
    const server = net.createServer();
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address();

    await expect(checkPortAvailable({ port })).resolves.toEqual({ available: false });
    await new Promise((resolve) => server.close(resolve));
    await expect(checkPortAvailable({ port })).resolves.toEqual({ available: true });
  });

  test("Parcel cleanup removes only old project-prefixed regular files", () => {
    const unlinkSync = jest.fn();
    const stats = {
      "myjourney.old.css.1.tmp": { isFile: () => true, mtimeMs: 1 },
      "myjourney.active.css.2.tmp": { isFile: () => true, mtimeMs: 9_500 },
      "myjourney.folder": { isFile: () => false, mtimeMs: 1 },
      "other-project.old.css.1.tmp": { isFile: () => true, mtimeMs: 1 },
    };
    const fsModule = {
      readdirSync: jest.fn(() => Object.keys(stats)),
      statSync: jest.fn((filePath) => stats[filePath.split(/[\\/]/).pop()]),
      unlinkSync,
    };

    expect(clearStaleParcelTemp({
      fsModule,
      tempDirectory: "temp",
      projectName: "myjourney",
      now: 10_000,
      minimumAgeMs: 1_000,
    })).toEqual({ removed: 1, skipped: 2 });
    expect(unlinkSync).toHaveBeenCalledTimes(1);
    expect(unlinkSync.mock.calls[0][0]).toMatch(/myjourney\.old\.css\.1\.tmp$/);
  });

  test("resolves Mongo environment precedence without exposing credentials", () => {
    expect(resolveMongoConfig({ MONGO_URI: "mongodb://primary/db", MONGODB_URI: "mongodb://alias/db" })).toEqual({
      uri: "mongodb://primary/db",
      source: "MONGO_URI",
    });
    expect(resolveMongoConfig({ MONGODB_URI: "mongodb://alias/db" })).toEqual({
      uri: "mongodb://alias/db",
      source: "MONGODB_URI",
    });
    expect(describeMongoTarget("mongodb+srv://secret-user:secret-pass@cluster.example.com/myjourney?retryWrites=true"))
      .toBe("cluster.example.com/myjourney");
  });

  test("Mongo reachability closes its diagnostic connection on failure", async () => {
    const close = jest.fn().mockResolvedValue(undefined);
    const fakeMongoose = {
      createConnection: jest.fn(() => ({
        asPromise: jest.fn().mockRejectedValue(Object.assign(new Error("unavailable"), { name: "MongoServerSelectionError" })),
        close,
      })),
    };
    await expect(checkMongoReachable({ uri: "mongodb://hidden/db", mongooseModule: fakeMongoose }))
      .resolves.toEqual({ reachable: false, errorName: "MongoServerSelectionError" });
    expect(close).toHaveBeenCalledTimes(1);
  });

  test("UI-only preflight never checks or connects to MongoDB", async () => {
    const mongoCheck = jest.fn();
    const result = await runPreflight({
      mode: "ui",
      source: { PARCEL_PORT: "1234" },
      portCheck: jest.fn().mockResolvedValue({ available: true }),
      mongoCheck,
    });

    expect(result).toEqual({ ok: true, failures: [] });
    expect(mongoCheck).not.toHaveBeenCalled();
  });

  test("full preflight reports a sanitized Mongo blocker", async () => {
    const result = await runPreflight({
      mode: "full",
      source: { MONGO_URI: "mongodb://secret:password@127.0.0.1:27017/myjourney" },
      portCheck: jest.fn().mockResolvedValue({ available: true }),
      mongoCheck: jest.fn().mockResolvedValue({ reachable: false }),
    });

    expect(result.ok).toBe(false);
    expect(result.failures).toEqual([
      "MongoDB is unavailable at 127.0.0.1:27017/myjourney. Start MongoDB or configure MONGO_URI.",
    ]);
    expect(result.failures.join(" ")).not.toContain("secret");
    expect(result.failures.join(" ")).not.toContain("password");
  });

  test("liveness stays healthy while readiness reflects Mongo state", async () => {
    const app = express();
    app.get("/health", getHealth);
    app.get("/readiness", getReadiness);
    const originalState = mongoose.connection.readyState;

    Object.defineProperty(mongoose.connection, "readyState", { configurable: true, value: 0 });
    await request(app).get("/health").expect(200, { ok: true, service: "myjourney-api" });
    await request(app).get("/readiness").expect(503, {
      ready: false,
      service: "myjourney-api",
      checks: { mongodb: "unavailable" },
    });

    Object.defineProperty(mongoose.connection, "readyState", { configurable: true, value: 1 });
    await request(app).get("/readiness").expect(200, {
      ready: true,
      service: "myjourney-api",
      checks: { mongodb: "ready" },
    });

    Object.defineProperty(mongoose.connection, "readyState", { configurable: true, value: originalState });
  });
});
