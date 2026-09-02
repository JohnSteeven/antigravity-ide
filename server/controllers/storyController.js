const Article = require("../models/Article");
const articleService = require("../services/articleService");
const {
  stripHtml,
  normalizeStoryLayout,
  normalizeStorySections,
  calculateStoryReadingTime,
  validateStorySections,
} = require("../utils/storyContent");
const entitlementService = require("../services/entitlementService");
const { ENTITLEMENTS } = require("../premium/catalog");
const { serializePublicContent } = require("../premium/contentPreview");

const slugify = (value = "") => String(value)
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const STORY_FIELDS = [
  "title", "slug", "description", "body", "coverImage", "coverImageAlt", "coverImageCaption", "author",
  "status", "scheduledAt", "publishedAt", "storyLayout", "storySections", "reflection",
  "takeaway", "introLocation", "introTime", "storyOrigin", "storyFormat", "isFeatured",
  "isMustRead", "isTrending", "isPinned", "seo", "accessLevel",
];

const pickStoryFields = (input = {}) => STORY_FIELDS.reduce((result, field) => {
  if (input[field] !== undefined) result[field] = input[field];
  return result;
}, {});

const prepareStory = (input, existing = {}) => {
  const merged = { ...existing, ...pickStoryFields(input) };
  const sections = input.storySections !== undefined
    ? normalizeStorySections(input.storySections)
    : normalizeStorySections(existing.storySections || []);
  const layout = normalizeStoryLayout(input.storyLayout !== undefined ? input.storyLayout : existing.storyLayout);
  const status = input.status !== undefined ? input.status : (existing.status || "draft");
  const readingTimeMin = calculateStoryReadingTime({ ...merged, storySections: sections });

  return {
    ...pickStoryFields(input),
    contentType: "story",
    category: existing.category || "Stories",
    categorySlug: existing.categorySlug || "stories",
    slug: slugify(input.slug !== undefined ? input.slug : (existing.slug || input.title || existing.title)),
    storyLayout: layout,
    storySections: sections,
    status,
    readingTimeMin,
    readingTime: `${readingTimeMin} min read`,
  };
};

const withStoryRuntimeMetadata = (story = {}) => {
  const normalizedLayout = normalizeStoryLayout(story.storyLayout);
  const readingTimeMin = calculateStoryReadingTime(story);
  return {
    ...story,
    storyLayout: normalizedLayout,
    readingTimeMin,
    readingTime: `${readingTimeMin} min read`,
  };
};

const validatePublishableStory = (story) => {
  const errors = validateStorySections(story.storySections, { publishing: story.status === "published" });
  const hasStructuredContent = Array.isArray(story.storySections) && story.storySections.length > 0;
  const hasMeaningfulStructuredContent = hasStructuredContent && stripHtml(story.storySections.map((section) => [section.heading, section.chapterTitle, section.body, section.quote].join(" ")).join(" ")).length >= 20;
  const hasLegacyBody = stripHtml(story.body || "").length >= 20;
  if (story.status === "published" && hasStructuredContent && !hasMeaningfulStructuredContent) {
    errors.push("Structured Stories need meaningful text before publishing.");
  } else if (story.status === "published" && !hasStructuredContent && !hasLegacyBody) {
    errors.push("A published Story needs at least one section or a meaningful legacy body.");
  }
  if (story.status === "published" && story.coverImage && !String(story.coverImageAlt || "").trim()) {
    errors.push("Listing / rail image alt text is required.");
  }
  return errors;
};

class StoryController {
  async getStories(req, res, next) {
    try {
      const query = { ...req.query, contentType: "story", status: "published" };
      const data = await articleService.getArticles(query);
      res.json({ ...data, articles: data.articles.map((story) => serializePublicContent(withStoryRuntimeMetadata(story), { listing: true })) });
    } catch (err) {
      next(err);
    }
  }

  async getStoryBySlug(req, res, next) {
    try {
      const article = await articleService.getArticleBySlug(req.params.slug);
      if (!article || article.status !== "published") {
        return res.status(404).json({ message: "Story not found." });
      }
      if (article.contentType && article.contentType !== "story") {
        return res.status(400).json({ redirect: true, slug: article.slug, message: "Content is an article" });
      }
      const resolution = req.user
        ? await entitlementService.resolveForUser(req.user._id || req.user.id)
        : null;
      const canAccessPremium = entitlementService.hasEntitlement(resolution, ENTITLEMENTS.PREMIUM_CONTENT);
      res.set({ "Cache-Control": "private, no-store", Vary: "Cookie, Authorization" });
      return res.json({ article: serializePublicContent(withStoryRuntimeMetadata(article), { canAccessPremium }) });
    } catch (err) {
      return next(err);
    }
  }

  async createStory(req, res, next) {
    try {
      const storyData = prepareStory(req.body);
      const errors = validatePublishableStory(storyData);
      if (errors.length) return res.status(422).json({ message: "Story validation failed.", errors });

      storyData.author = storyData.author
        || [req.user?.firstName, req.user?.lastName].filter(Boolean).join(" ")
        || "Noble John Steeven";
      if (storyData.status === "published") storyData.publishedAt = storyData.publishedAt || new Date();

      const article = await articleService.createArticle(storyData, req.user._id);
      return res.status(201).json({ article, message: "Story created successfully." });
    } catch (err) {
      return next(err);
    }
  }

  async updateStory(req, res, next) {
    try {
      const existingDoc = await Article.findOne({ _id: req.params.id, isDeleted: false }).lean();
      if (!existingDoc) return res.status(404).json({ message: "Story not found." });
      if (existingDoc.contentType && existingDoc.contentType !== "story") {
        return res.status(400).json({ message: "This record is an Article, not a Story." });
      }

      const updateData = prepareStory(req.body, existingDoc);
      const merged = { ...existingDoc, ...updateData };
      const errors = validatePublishableStory(merged);
      if (errors.length) return res.status(422).json({ message: "Story validation failed.", errors });
      if (updateData.status === "published" && !existingDoc.publishedAt) updateData.publishedAt = new Date();

      const article = await articleService.updateArticle(req.params.id, updateData, req.user._id);
      return res.json({ article, message: "Story updated successfully." });
    } catch (err) {
      return next(err);
    }
  }

  async updateStoryStatus(req, res, next) {
    try {
      const status = String(req.body.status || "");
      if (!["draft", "published", "archived", "scheduled"].includes(status)) {
        return res.status(422).json({ message: "Invalid Story status." });
      }
      const existingDoc = await Article.findOne({ _id: req.params.id, isDeleted: false }).lean();
      if (!existingDoc || (existingDoc.contentType && existingDoc.contentType !== "story")) {
        return res.status(404).json({ message: "Story not found." });
      }
      const updateData = prepareStory({ status }, existingDoc);
      const errors = validatePublishableStory({ ...existingDoc, ...updateData });
      if (errors.length) return res.status(422).json({ message: "Story validation failed.", errors });
      if (status === "published" && !existingDoc.publishedAt) updateData.publishedAt = new Date();

      const article = await articleService.updateArticle(req.params.id, updateData, req.user._id);
      return res.json({ article, message: `Story ${status}.` });
    } catch (err) {
      return next(err);
    }
  }
}

const storyController = new StoryController();

module.exports = storyController;
module.exports.prepareStory = prepareStory;
module.exports.withStoryRuntimeMetadata = withStoryRuntimeMetadata;
