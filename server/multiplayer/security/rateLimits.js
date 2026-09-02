const rateLimit = require("express-rate-limit");

const response = (message) => ({
  error: {
    code: "MULTIPLAYER_RATE_LIMITED",
    message,
    retryable: true,
  },
});

const createRoomLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json(response("Too many rooms were created from this connection. Try again shortly.")),
});

const joinRoomLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json(response("Too many join attempts. Wait a moment and try again.")),
});

const resumeRoomLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json(response("Too many reconnect attempts. Wait a moment and try again.")),
});

module.exports = { createRoomLimiter, joinRoomLimiter, resumeRoomLimiter };
