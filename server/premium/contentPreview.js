const ACCESS_LEVELS = Object.freeze({ FREE: "free", PREMIUM: "premium" });
const { sanitizeRichHtml } = require("../middleware/security");

// Premium previews are excerpt-only. This one policy is shared by Articles and
// Stories so full bodies cannot leak through inconsistent component rules.
const PREVIEW_POLICY = Object.freeze({ mode: "excerpt_only" });

const resolveAccessLevel = (content = {}) => content.accessLevel === ACCESS_LEVELS.PREMIUM
  ? ACCESS_LEVELS.PREMIUM
  : ACCESS_LEVELS.FREE;

const publicFields = [
  "_id", "id", "title", "slug", "description", "excerpt", "coverImage",
  "coverImageAlt", "author", "publishedAt", "readingTimeMin", "readingTime",
  "category", "categorySlug", "tags", "contentType", "storyLayout", "status",
  "isFeatured", "isMustRead", "isTrending", "isPinned", "views", "likes",
  "bookmarks", "saved", "rating", "accessLevel",
];

const toPlainObject = (content) => {
  if (!content) return null;
  return typeof content.toObject === "function" ? content.toObject({ virtuals: true }) : { ...content };
};

const pickPublicFields = (source) => publicFields.reduce((result, field) => {
  if (source[field] !== undefined) result[field] = source[field];
  return result;
}, {});

const sanitizePublicDetail = (source) => {
  const result = { ...source };
  [
    "__v", "authorId", "createdBy", "updatedBy", "deletedAt", "isDeleted",
    "creatorWorkflowStatus", "contentRightsConfirmedAt",
  ].forEach((field) => delete result[field]);
  result.body = sanitizeRichHtml(result.body || "");
  if (Array.isArray(result.storySections)) {
    result.storySections = result.storySections.map((section) => ({
      ...section,
      body: sanitizeRichHtml(section.body || ""),
    }));
  }
  return result;
};

const createPremiumPreview = (content) => {
  const source = toPlainObject(content);
  const preview = pickPublicFields(source);
  return {
    ...preview,
    accessLevel: ACCESS_LEVELS.PREMIUM,
    premiumRequired: true,
    previewMode: PREVIEW_POLICY.mode,
    body: "",
    storySections: [],
  };
};

const serializePublicContent = (content, { canAccessPremium = false, listing = false } = {}) => {
  const source = toPlainObject(content);
  if (!source) return null;
  source.accessLevel = resolveAccessLevel(source);
  if (listing && source.accessLevel !== ACCESS_LEVELS.PREMIUM) {
    return { ...pickPublicFields(source), accessLevel: ACCESS_LEVELS.FREE, premiumRequired: false };
  }
  if (source.accessLevel !== ACCESS_LEVELS.PREMIUM) return sanitizePublicDetail(source);
  if (canAccessPremium && !listing) return { ...sanitizePublicDetail(source), premiumRequired: false };
  return createPremiumPreview(source);
};

module.exports = {
  ACCESS_LEVELS,
  PREVIEW_POLICY,
  createPremiumPreview,
  resolveAccessLevel,
  serializePublicContent,
};
