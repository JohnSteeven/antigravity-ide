const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const sanitizeHtml = require("sanitize-html");
const env = require("../config/env");

// Fields that contain intentional HTML — must not be stripped
const HTML_FIELDS = new Set(["body", "contentHtml", "description"]);

// Allowed HTML for rich-text article content
const ARTICLE_HTML_OPTIONS = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    "h1", "h2", "h3", "h4", "h5", "h6",
    "img", "figure", "figcaption",
    "iframe", "video", "audio", "source",
    "blockquote", "pre", "code",
    "table", "thead", "tbody", "tr", "th", "td",
    "details", "summary",
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    "*": ["class", "id"],
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "width", "height", "loading"],
    iframe: ["src", "width", "height", "frameborder", "allowfullscreen", "allow"],
    video: ["src", "controls", "width", "height", "poster"],
    audio: ["src", "controls"],
    source: ["src", "type"],
  },
  allowedSchemes: ["http", "https"],
  allowedSchemesByTag: {
    img: ["http", "https"]
  },
  allowedIframeHostnames: [
    "www.youtube.com",
    "www.youtube-nocookie.com",
    "player.vimeo.com",
  ],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: attribs.target === "_blank"
        ? { ...attribs, rel: "noopener noreferrer" }
        : attribs,
    }),
  },
  exclusiveFilter: (frame) => frame.tag === "iframe" && !frame.attribs.src,
};

const decodeHtmlEntities = (str) => {
  if (!str || typeof str !== "string") return str;
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'");
};

const sanitizeRichHtml = (value) => typeof value === "string"
  ? sanitizeHtml(value, ARTICLE_HTML_OPTIONS)
  : value;

const sanitizePlainText = (value) => {
  if (typeof value === "string") {
    // Only strip NoSQL injection operators; allow normal text/HTML through plain fields
    const sanitized = sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
    return decodeHtmlEntities(sanitized);
  }
  if (Array.isArray(value)) return value.map(sanitizePlainText);
  if (value && typeof value === "object") {
    return Object.keys(value).reduce((acc, key) => {
      if (!key.startsWith("$") && !key.includes(".")) {
        acc[key] = sanitizePlainText(value[key]);
      }
      return acc;
    }, {});
  }
  return value;
};

const sanitizeRequestObject = (value, depth = 0) => Object.entries(value || {}).reduce((acc, [key, child]) => {
  if (key.startsWith("$") || key.includes(".")) return acc;
  if (typeof child === "string") {
    const isRichHtml = HTML_FIELDS.has(key)
      && (key !== "description" || depth === 0);
    acc[key] = isRichHtml ? sanitizeRichHtml(child) : sanitizePlainText(child);
  } else if (Array.isArray(child)) {
    acc[key] = child.map((item) => item && typeof item === "object"
      ? sanitizeRequestObject(item, depth + 1)
      : sanitizePlainText(item));
  } else if (child && typeof child === "object") {
    acc[key] = sanitizeRequestObject(child, depth + 1);
  } else {
    acc[key] = child;
  }
  return acc;
}, {});

const sanitizeRequest = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeRequestObject(req.body);
  }
  req.params = sanitizePlainText(req.params);
  req.query = sanitizePlainText(req.query);
  next();
};

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // In development, use a very high limit to avoid 429 errors during CMS usage
  max: env.nodeEnv === 'production' ? 300 : 50000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.nodeEnv !== 'production', // completely skip in development
});

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: env.nodeEnv === 'production' ? 30 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Please wait." },
});

const otpAccountLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: env.nodeEnv === "production" ? 5 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const accountKey = String(
      req.body?.userId || req.body?.identifier || req.body?.email || req.body?.challengeId || req.ip || "unknown"
    ).trim().toLowerCase();
    return `otp_${crypto.createHash("sha256").update(accountKey).digest("hex")}`;
  },
  message: { message: "Too many OTP requests. Please wait before trying again." },
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

const emailRateLimiter = rateLimit({
  windowMs: env.forgotPasswordWindowMs || 60 * 60 * 1000,
  max: env.forgotPasswordLimit || 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = String(req.body?.email || req.body?.identifier || "").toLowerCase().trim();
    return email ? `email_${email}` : req.ip;
  },
  message: { message: "Too many password reset attempts for this account. Please wait 1 hour before trying again." },
});

const changePasswordLimiter = rateLimit({
  windowMs: env.changePasswordWindowMs || 15 * 60 * 1000,
  max: env.changePasswordRateLimit || 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id ? `change_pass_user_${req.user.id}` : req.ip;
  },
  message: { message: "Too many password change attempts. Please wait 15 minutes before trying again." },
});

module.exports = {
  authLimiter,
  changePasswordLimiter,
  csrfProtection,
  emailRateLimiter,
  globalLimiter,
  issueCsrfToken,
  otpAccountLimiter,
  sanitizeRichHtml,
  sanitizeRequest,
};
