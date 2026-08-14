const ACCESS_LEVELS = Object.freeze({ FREE: "free", PREMIUM: "premium" });

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

const createPremiumPreview = (content) => {
  const source = toPlainObject(content);
  const preview = publicFields.reduce((result, field) => {
    if (source[field] !== undefined) result[field] = source[field];
    return result;
  }, {});
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
  if (source.accessLevel !== ACCESS_LEVELS.PREMIUM) return source;
  if (canAccessPremium && !listing) return { ...source, premiumRequired: false };
  return createPremiumPreview(source);
};

module.exports = {
  ACCESS_LEVELS,
  PREVIEW_POLICY,
  createPremiumPreview,
  resolveAccessLevel,
  serializePublicContent,
};
