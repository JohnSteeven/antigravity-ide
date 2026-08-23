require("dotenv").config();

const requiredInProduction = [
  "CLIENT_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "MULTIPLAYER_GUEST_SECRET",
  "REQUEST_LOG_SALT",
];

if (process.env.NODE_ENV === "production") {
  if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
    throw new Error("MONGO_URI (or MONGODB_URI) is required in production.");
  }
  requiredInProduction.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`${key} is required in production.`);
    }
  });
  if (process.env.COOKIE_SECURE !== "true") {
    throw new Error("COOKIE_SECURE=true is required in production.");
  }
  if (process.env.CSRF_ENABLED === "false") {
    throw new Error("CSRF_ENABLED cannot be false in production.");
  }
  try {
    const clientUrl = new URL(process.env.CLIENT_URL);
    if (clientUrl.protocol !== "https:" || ["localhost", "127.0.0.1"].includes(clientUrl.hostname)) {
      throw new Error("unsafe");
    }
  } catch (error) {
    throw new Error("CLIENT_URL must be an explicit non-local HTTPS origin in production.");
  }
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.SERVER_PORT || process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:1234",
  mongoUri:
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    "mongodb://127.0.0.1:27017/myjourney",
  mongoServerSelectionTimeoutMs: Math.max(
    1000,
    Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 8000)
  ),
  jwtAccessSecret:
    process.env.JWT_ACCESS_SECRET || "development-access-secret-change-me",
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET || "development-refresh-secret-change-me",
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || "15m",
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS || 30),
  cookieSecure: process.env.COOKIE_SECURE === "true",
  csrfEnabled: process.env.CSRF_ENABLED !== undefined ? process.env.CSRF_ENABLED === "true" : (process.env.NODE_ENV !== "development"),
  smsProvider: process.env.SMS_PROVIDER || "console",
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || "MyJourney <hello@myjourney.com>",
    maxRetries: Number(process.env.MAX_EMAIL_RETRIES || 3),
    verificationTokenTtlHours: Number(process.env.VERIFICATION_TOKEN_TTL_HOURS || 24),
  },
  forgotPasswordLimit: Number(process.env.FORGOT_PASSWORD_LIMIT || 5),
  forgotPasswordWindowMs: Number(process.env.FORGOT_PASSWORD_WINDOW_MS || 60 * 60 * 1000),
  passwordHistoryLimit: Number(process.env.PASSWORD_HISTORY_LIMIT || 5),
  changePasswordRateLimit: Number(process.env.CHANGE_PASSWORD_RATE_LIMIT || 5),
  changePasswordWindowMs: Number(process.env.CHANGE_PASSWORD_WINDOW_MS || 15 * 60 * 1000),
  requestLogSalt: process.env.REQUEST_LOG_SALT || "development-request-log-salt-change-me",
  passwordMinLength: Number(process.env.PASSWORD_MIN_LENGTH || 8),
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    from: process.env.TWILIO_FROM_NUMBER,
  },
  multiplayer: {
    enabled: process.env.MULTIPLAYER_ENABLED !== "false",
    guestSecret: process.env.MULTIPLAYER_GUEST_SECRET || "development-multiplayer-secret-change-me",
    analyticsSalt: process.env.MULTIPLAYER_ANALYTICS_SALT || "development-analytics-salt-change-me",
    analyticsRetentionDays: Number(process.env.MULTIPLAYER_ANALYTICS_RETENTION_DAYS || 90),
    roomTtlHours: Number(process.env.MULTIPLAYER_ROOM_TTL_HOURS || 6),
    hostGraceSeconds: Number(process.env.MULTIPLAYER_HOST_GRACE_SECONDS || 45),
    redisUrl: process.env.REDIS_URL || "",
    requireRedis: process.env.MULTIPLAYER_REQUIRE_REDIS !== undefined
      ? process.env.MULTIPLAYER_REQUIRE_REDIS === "true"
      : process.env.NODE_ENV === "production",
  },
};

module.exports = env;
