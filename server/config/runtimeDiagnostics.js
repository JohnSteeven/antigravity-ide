"use strict";

const net = require("net");

const DEFAULT_MONGO_URI = "mongodb://127.0.0.1:27017/myjourney";

const resolveMongoConfig = (source = process.env) => {
  if (source.MONGO_URI) return { uri: source.MONGO_URI, source: "MONGO_URI" };
  if (source.MONGODB_URI) return { uri: source.MONGODB_URI, source: "MONGODB_URI" };
  return { uri: DEFAULT_MONGO_URI, source: "development default" };
};

const describeMongoTarget = (uri) => {
  const value = String(uri || "").trim();
  const match = value.match(/^mongodb(?:\+srv)?:\/\/(?:[^@/]+@)?([^/?]+)(?:\/([^?]+))?/i);
  if (!match) return "the configured MongoDB target";
  const hosts = match[1];
  const database = match[2] || "(default database)";
  return `${hosts}/${database}`;
};

const probePort = ({ port, host }) =>
  new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    let settled = false;
    const finish = (inUse) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(inUse);
    };
    socket.unref();
    socket.setTimeout(500);
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
    socket.once("timeout", () => finish(false));
  });

const checkPortAvailable = async ({ port }) => {
  const results = await Promise.all([
    probePort({ port, host: "127.0.0.1" }),
    probePort({ port, host: "::1" }),
  ]);
  return { available: !results.some(Boolean) };
};

const checkMongoReachable = async ({ uri, timeoutMs = 3000, mongooseModule } = {}) => {
  const mongoose = mongooseModule || require("mongoose");
  const connection = mongoose.createConnection(uri, {
    serverSelectionTimeoutMS: timeoutMs,
    maxPoolSize: 1,
  });
  try {
    await connection.asPromise();
    return { reachable: true };
  } catch (error) {
    return { reachable: false, errorName: error.name || "ConnectionError" };
  } finally {
    await connection.close().catch(() => {});
  }
};

module.exports = {
  DEFAULT_MONGO_URI,
  checkMongoReachable,
  checkPortAvailable,
  describeMongoTarget,
  resolveMongoConfig,
};
