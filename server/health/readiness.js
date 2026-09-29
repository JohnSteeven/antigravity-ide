"use strict";

const mongoose = require("mongoose");
const { redisManager } = require("../redis/redisClient");
const { defaultJobQueue } = require("../jobs/jobQueue");

const getHealth = (req, res) => {
  res.json({ ok: true, service: "myjourney-api" });
};

const getReadiness = (req, res) => {
  const mongoReady = mongoose.connection.readyState === 1;
  const redisHealth = redisManager.getHealth();
  const queueHealth = defaultJobQueue.getHealth();

  // If Redis is explicitly required in production, readiness depends on Redis
  const redisRequired = redisManager.isRequired();
  const redisConfigured = redisManager.isConfigured();
  const redisReady = !redisRequired || redisHealth.status === "ready";
  const queueReady = queueHealth.status !== "draining";

  const allReady = mongoReady && redisReady && queueReady;

  const checks = {
    mongodb: mongoReady ? "ready" : "unavailable",
  };

  if (redisConfigured || redisRequired) {
    checks.redis = redisHealth.status;
    checks.queue = queueHealth.status;
  }

  res.status(allReady ? 200 : 503).json({
    ready: allReady,
    service: "myjourney-api",
    checks,
  });
};

module.exports = { getHealth, getReadiness };
