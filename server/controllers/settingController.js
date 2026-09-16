const mongoose = require("mongoose");
const settingService = require("../services/settingService");
const Article = require("../models/Article");
const Course = require("../models/Course");

const ALLOWED_PUBLIC_KEYS = Object.freeze(["homepage", "about", "projects", "site", "contact"]);

const FORBIDDEN_LIFE_KEYS = Object.freeze([
  "life",
  "lifeentries",
  "privatelife",
  "lifegoals",
  "readerlife",
  "userlife",
  "journal",
  "reflections",
]);

const containsForbiddenLifeKeys = (obj) => {
  if (!obj || typeof obj !== "object") return false;
  for (const key of Object.keys(obj)) {
    const normalizedKey = key.toLowerCase();
    if (FORBIDDEN_LIFE_KEYS.some((forbidden) => normalizedKey === forbidden || normalizedKey.includes("lifeentry") || normalizedKey.includes("privatelife"))) {
      return true;
    }
    if (typeof obj[key] === "object" && containsForbiddenLifeKeys(obj[key])) {
      return true;
    }
  }
  return false;
};

const validateReferencedItems = async (value) => {
  const articleIds = [];
  if (Array.isArray(value.featured)) articleIds.push(...value.featured);
  if (Array.isArray(value.featuredArticles)) articleIds.push(...value.featuredArticles);

  for (const id of articleIds) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return `Invalid article ID: ${id}`;
    }
    const doc = await Article.findOne({ _id: id, isDeleted: false });
    if (!doc || doc.status !== "published") {
      return `Referenced article ${id} does not exist or is not published.`;
    }
  }

  if (Array.isArray(value.featuredStories)) {
    for (const id of value.featuredStories) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return `Invalid story ID: ${id}`;
      }
      const doc = await Article.findOne({ _id: id, isDeleted: false, contentType: "story" });
      if (!doc || doc.status !== "published") {
        return `Referenced story ${id} does not exist or is not published.`;
      }
    }
  }

  if (Array.isArray(value.featuredCourses)) {
    for (const id of value.featuredCourses) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return `Invalid course ID: ${id}`;
      }
      const doc = await Course.findById(id);
      if (!doc || doc.publicationStatus !== "published") {
        return `Referenced course ${id} does not exist or is not published.`;
      }
    }
  }

  return null;
};

const validateProjectsValue = (projects) => {
  if (!Array.isArray(projects)) {
    return "Projects setting must be an array.";
  }
  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    if (!p || typeof p !== "object") {
      return `Project at index ${i} must be an object.`;
    }
    if (!p.title || typeof p.title !== "string" || !p.title.trim()) {
      return `Project at index ${i} must have a valid title.`;
    }
    if (p.title.length > 200) {
      return `Project title at index ${i} exceeds 200 characters.`;
    }
  }
  return null;
};

class SettingController {
  async getPublicSetting(req, res, next) {
    try {
      const { key } = req.params;
      if (!ALLOWED_PUBLIC_KEYS.includes(key)) {
        return res.status(404).json({ message: "Setting not found or access denied." });
      }
      const value = await settingService.getSettingByKey(key);
      res.json({ success: true, key, value: value || null });
    } catch (err) {
      next(err);
    }
  }

  async getSetting(req, res, next) {
    try {
      const { key } = req.params;
      const value = await settingService.getSettingByKey(key);
      res.json({ success: true, key, value });
    } catch (err) {
      next(err);
    }
  }

  async updateSetting(req, res, next) {
    try {
      const { key } = req.params;
      const { value } = req.body;

      if (key === "homepage") {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          return res.status(422).json({ message: "Homepage setting must be an object." });
        }
        if (containsForbiddenLifeKeys(value)) {
          return res.status(400).json({ message: "Private Life data cannot be placed in public homepage configuration." });
        }
        const refError = await validateReferencedItems(value);
        if (refError) {
          return res.status(422).json({ message: refError });
        }
      } else if (key === "projects") {
        const projError = validateProjectsValue(value);
        if (projError) {
          return res.status(422).json({ message: projError });
        }
      }

      const setting = await settingService.updateSetting(key, value, req.user?._id);
      res.json({ success: true, setting });
    } catch (err) {
      next(err);
    }
  }

  async testSmtp(req, res, next) {
    try {
      const { testEmail } = req.body;
      const recipient = testEmail || req.user?.email || "test@example.com";
      const nodemailer = require("nodemailer");
      const env = require("../config/env");

      if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) {
        return res.status(400).json({
          success: false,
          message: "SMTP is running in Development Fallback mode because SMTP_HOST, SMTP_USER, or SMTP_PASS are blank in .env.",
        });
      }

      const transporter = nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port,
        secure: env.smtp.secure,
        auth: { user: env.smtp.user, pass: env.smtp.pass },
      });

      await transporter.verify();
      await transporter.sendMail({
        from: env.smtp.from,
        to: recipient,
        subject: "MyJourney — SMTP Configuration Test",
        text: "This is a test email sent from the MyJourney CMS to confirm SMTP server connectivity.",
        html: "<div style='font-family:sans-serif;padding:20px;background:#f8fafc'><h2>MyJourney SMTP Test</h2><p>Your SMTP server connection is verified and functioning correctly.</p></div>",
      });

      res.json({ success: true, message: `SMTP connection verified and test email sent to ${recipient}!` });
    } catch (err) {
      res.status(500).json({ success: false, message: `SMTP Test Failed: ${err.message}` });
    }
  }
}

module.exports = new SettingController();
