"use strict";

const mongoose = require("mongoose");

const getHealth = (req, res) => {
  res.json({ ok: true, service: "myjourney-api" });
};

const getReadiness = (req, res) => {
  const mongoReady = mongoose.connection.readyState === 1;
  res.status(mongoReady ? 200 : 503).json({
    ready: mongoReady,
    service: "myjourney-api",
    checks: { mongodb: mongoReady ? "ready" : "unavailable" },
  });
};

module.exports = { getHealth, getReadiness };
