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

  const payload = {
    ready: allReady,
    service: "myjourney-api",
    checks,
  };

  const isApiReadiness = req.path === "/api/readiness" || (req.originalUrl && req.originalUrl.includes("/api/readiness"));
  if (isApiReadiness || req.query?.verbose === "true") {
    payload.providers = {
      cloudflareR2: Boolean(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY)
        ? "ready"
        : "unconfigured",
      muxVideo: Boolean(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET)
        ? "ready"
        : "unconfigured",
      razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
        ? "ready"
        : "unconfigured",
      ai: Boolean(process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY)
        ? "ready"
        : "unconfigured",
    };
  }

  res.status(allReady ? 200 : 503).json(payload);
};

module.exports = { getHealth, getReadiness };
