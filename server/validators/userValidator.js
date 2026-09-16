const { body, param } = require("express-validator");
const { isDailyQuoteTimeSlot } = require("../config/notificationPreferences");

const ACCOUNT_PROFILE_FIELDS = new Set([
  "avatar",
  "coverImage",
  "bio",
  "location",
  "website",
  "skills",
]);

const PROFILE_ROOT_FIELDS = new Set([
  "firstName",
  "lastName",
  "username",
  "newsletter",
  "profile",
  "notificationPreferences",
]);

const ADMIN_USER_FIELDS = new Set(["firstName", "lastName", "username", "role", "status"]);

const rejectUnknownFields = (allowed, label) => body().custom((value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }
  const unknown = Object.keys(value).find((key) => !allowed.has(key));
  if (unknown) throw new Error(`Field '${unknown}' cannot be changed through this endpoint.`);
  return true;
});

const isHttpUrl = (value) => {
  if (value === "") return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const isSafeProfileImage = (value) => {
  if (value === "") return true;
  if (isHttpUrl(value)) return true;
  return /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value)
    && value.length <= 2_000_000;
};

const updateProfileValidator = [
  rejectUnknownFields(PROFILE_ROOT_FIELDS, "Profile update"),
  body("firstName").optional().trim().notEmpty().withMessage("First name cannot be empty."),
  body("lastName").optional().trim().notEmpty().withMessage("Last name cannot be empty."),
  body("username").optional().trim().isLength({ min: 3 }).withMessage("Username must be at least 3 characters."),
  body("newsletter").optional().isBoolean().withMessage("Newsletter preference must be a boolean."),
  body("profile")
    .optional()
    .custom((value) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("profile must be an object.");
      }
      const unknown = Object.keys(value).find((key) => !ACCOUNT_PROFILE_FIELDS.has(key));
      if (unknown) throw new Error(`Unknown profile field: ${unknown}`);
      return true;
    }),
  body("profile.bio").optional().trim().isLength({ max: 700 }).withMessage("Bio cannot exceed 700 characters."),
  body("profile.location").optional().trim().isLength({ max: 120 }).withMessage("Location cannot exceed 120 characters."),
  body("profile.website").optional().trim().custom(isHttpUrl).withMessage("Website must be an HTTP(S) URL."),
  body("profile.skills").optional().isArray({ max: 30 }).withMessage("Skills must be an array of strings."),
  body("profile.skills.*").optional().isString().trim().isLength({ min: 1, max: 60 }).withMessage("Each skill must be between 1 and 60 characters."),
  body("profile.avatar").optional().custom(isSafeProfileImage).withMessage("Avatar must be an HTTP(S) URL or a supported image upload."),
  body("profile.coverImage").optional().custom(isSafeProfileImage).withMessage("Cover image must be an HTTP(S) URL or a supported image upload."),
  body("notificationPreferences")
    .optional()
    .custom((value) => {
      if (typeof value !== "object" || value === null) {
        throw new Error("notificationPreferences must be an object.");
      }

      const allowedKeys = [
        "dailyQuote",
        "newArticles",
        "readingReminders",
        "weeklySummary"
      ];
      const actualKeys = Object.keys(value);
      for (const k of actualKeys) {
        if (!allowedKeys.includes(k)) {
          throw new Error(`Unknown preference key: ${k}`);
        }
      }

      if (value.dailyQuote !== undefined) {
        if (typeof value.dailyQuote !== "object" || value.dailyQuote === null) {
          throw new Error("dailyQuote must be an object.");
        }
        const dqKeys = Object.keys(value.dailyQuote);
        for (const k of dqKeys) {
          if (!["enabled", "time"].includes(k)) {
            throw new Error(`Unknown key in dailyQuote: ${k}`);
          }
        }
        if (value.dailyQuote.enabled !== undefined && typeof value.dailyQuote.enabled !== "boolean") {
          throw new Error("dailyQuote.enabled must be a boolean.");
        }
        if (value.dailyQuote.time !== undefined) {
          if (typeof value.dailyQuote.time !== "object" || value.dailyQuote.time === null) {
            throw new Error("dailyQuote.time must be an object.");
          }
          const tKeys = Object.keys(value.dailyQuote.time);
          for (const k of tKeys) {
            if (!["hour", "minute"].includes(k)) {
              throw new Error(`Unknown key in dailyQuote.time: ${k}`);
            }
          }
          const h = value.dailyQuote.time.hour;
          const m = value.dailyQuote.time.minute;
          if (!isDailyQuoteTimeSlot(h, m)) {
            throw new Error("Time slot must be one of: 08:00 AM, 09:00 AM, 06:00 PM, or 09:00 PM.");
          }
        }
      }

      if (value.newArticles !== undefined) {
        if (typeof value.newArticles !== "object" || value.newArticles === null) {
          throw new Error("newArticles must be an object.");
        }
        const keys = Object.keys(value.newArticles);
        for (const k of keys) {
          if (k !== "enabled") throw new Error(`Unknown key in newArticles: ${k}`);
        }
        if (typeof value.newArticles.enabled !== "boolean") {
          throw new Error("newArticles.enabled must be a boolean.");
        }
      }

      if (value.readingReminders !== undefined) {
        if (typeof value.readingReminders !== "object" || value.readingReminders === null) {
          throw new Error("readingReminders must be an object.");
        }
        const keys = Object.keys(value.readingReminders);
        for (const k of keys) {
          if (k !== "enabled") throw new Error(`Unknown key in readingReminders: ${k}`);
        }
        if (typeof value.readingReminders.enabled !== "boolean") {
          throw new Error("readingReminders.enabled must be a boolean.");
        }
      }

      if (value.weeklySummary !== undefined) {
        if (typeof value.weeklySummary !== "object" || value.weeklySummary === null) {
          throw new Error("weeklySummary must be an object.");
        }
        const keys = Object.keys(value.weeklySummary);
        for (const k of keys) {
          if (k !== "enabled") throw new Error(`Unknown key in weeklySummary: ${k}`);
        }
        if (typeof value.weeklySummary.enabled !== "boolean") {
          throw new Error("weeklySummary.enabled must be a boolean.");
        }
      }

      return true;
    }),
];

const updateUserValidator = [
  rejectUnknownFields(ADMIN_USER_FIELDS, "Admin user update"),
  body("firstName").optional().trim().notEmpty().withMessage("First name cannot be empty."),
  body("lastName").optional().trim().notEmpty().withMessage("Last name cannot be empty."),
  body("username").optional().trim().isLength({ min: 3 }).withMessage("Username must be at least 3 characters."),
  body("role")
    .optional()
    .isIn(["Admin", "Editor", "Reader"])
    .withMessage("Invalid role name. Must be Admin, Editor, or Reader."),
  body("status")
    .optional()
    .isIn(["ACTIVE", "SUSPENDED", "PENDING_VERIFICATION", "DISABLED"])
    .withMessage("Invalid status name. Must be ACTIVE, SUSPENDED, PENDING_VERIFICATION, or DISABLED."),
];

const challengeIdValidator = param("challengeId")
  .isMongoId()
  .withMessage("A valid identity-change challenge ID is required.");

const startIdentityChangeValidator = [
  rejectUnknownFields(new Set(["kind", "value", "reauth"]), "Identity change"),
  body("kind").isIn(["email", "mobile"]).withMessage("Identity type must be email or mobile."),
  body("value").isString().trim().isLength({ min: 3, max: 254 }).withMessage("A proposed identity value is required."),
  body("reauth").custom((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Reauthentication is required.");
    const unknown = Object.keys(value).find((key) => !["method", "credential"].includes(key));
    if (unknown) throw new Error(`Unknown reauthentication field: ${unknown}`);
    return true;
  }),
  body("reauth.method").isIn(["password", "totp"]).withMessage("Choose password or authenticator reauthentication."),
  body("reauth.credential").isString().isLength({ min: 1, max: 256 }).withMessage("A reauthentication credential is required."),
];

const resendIdentityChangeValidator = [challengeIdValidator];
const cancelIdentityChangeValidator = [challengeIdValidator];
const verifyIdentityChangeValidator = [
  challengeIdValidator,
  rejectUnknownFields(new Set(["code"]), "Identity verification"),
  body("code").isString().matches(/^\d{6}$/).withMessage("Enter the six-digit verification code."),
];

module.exports = {
  cancelIdentityChangeValidator,
  resendIdentityChangeValidator,
  startIdentityChangeValidator,
  updateProfileValidator,
  updateUserValidator,
  verifyIdentityChangeValidator,
};
