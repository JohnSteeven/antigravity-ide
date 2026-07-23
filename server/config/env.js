require("dotenv").config();

const requiredInProduction = [
  "MONGO_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
];

if (process.env.NODE_ENV === "production") {
  requiredInProduction.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`${key} is required in production.`);
    }
  });
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.SERVER_PORT || process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:1234",
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/myjourney",
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
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    from: process.env.TWILIO_FROM_NUMBER,
  },
};

module.exports = env;
