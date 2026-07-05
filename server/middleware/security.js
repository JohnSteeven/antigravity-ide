const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const sanitizeHtml = require("sanitize-html");
const env = require("../config/env");

const sanitizeValue = (value) => {
  if (typeof value === "string") {
    return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === "object") {
    return Object.keys(value).reduce((acc, key) => {
      if (!key.startsWith("$") && !key.includes(".")) {
        acc[key] = sanitizeValue(value[key]);
      }
      return acc;
    }, {});
  }

  return value;
};

const sanitizeRequest = (req, res, next) => {
  req.body = sanitizeValue(req.body);
  req.params = sanitizeValue(req.params);
  req.query = sanitizeValue(req.query);
  next();
};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Please wait." },
});

const issueCsrfToken = (req, res) => {
  const token = crypto.randomBytes(32).toString("hex");
  res.cookie("csrfToken", token, {
    sameSite: "lax",
    secure: env.cookieSecure,
    path: "/",
  });
  res.json({ csrfToken: token });
};

const csrfProtection = (req, res, next) => {
  if (!env.csrfEnabled || ["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const cookieToken = req.cookies.csrfToken;
  const headerToken = req.get("x-csrf-token");

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ message: "CSRF validation failed." });
  }

  next();
};

module.exports = {
  authLimiter,
  csrfProtection,
  globalLimiter,
  issueCsrfToken,
  sanitizeRequest,
};
