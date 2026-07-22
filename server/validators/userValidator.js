const { body } = require("express-validator");

const updateProfileValidator = [
  body("firstName").optional().trim().notEmpty().withMessage("First name cannot be empty."),
  body("lastName").optional().trim().notEmpty().withMessage("Last name cannot be empty."),
  body("username").optional().trim().isLength({ min: 3 }).withMessage("Username must be at least 3 characters."),
  body("email").optional().trim().isEmail().normalizeEmail().withMessage("Must be a valid email address."),
  body("mobile").optional().trim().isLength({ min: 8, max: 18 }).withMessage("Must be a valid mobile number."),
  body("profile.bio").optional().trim().isLength({ max: 700 }).withMessage("Bio cannot exceed 700 characters."),
  body("profile.skills").optional().isArray().withMessage("Skills must be an array of strings."),
  body("profile.avatar").optional().trim().isURL().withMessage("Avatar must be a valid URL."),
  body("profile.coverImage").optional().trim().isURL().withMessage("Cover image must be a valid URL."),
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
        "weeklySummary",
        "sentQuotes",
        "lastQuoteSentAt",
        "lastActiveAt",
        "lastReadingReminderSentAt",
        "lastWeeklySummarySentAt"
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
          const isValidSlot = (h === 8 && m === 0) || (h === 9 && m === 0) || (h === 18 && m === 0) || (h === 21 && m === 0);
          if (!isValidSlot) {
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

module.exports = {
  updateProfileValidator,
};
