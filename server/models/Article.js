const mongoose = require("mongoose");

const SeoSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    description: { type: String, default: "" },
    keywords: [{ type: String }],
    canonicalUrl: { type: String, default: "" },
    openGraphImage: { type: String, default: "" },
    metaRobots: { type: String, default: "index,follow" },
  },
  { _id: false }
);

const ArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "", trim: true },
    excerpt: { type: String, default: "" },

    // Content — stored as HTML (contenteditable editor output)
    body: { type: String, default: "" },

    // Cover image
    coverImage: { type: String, default: "" },

    // Gallery
    gallery: [{ type: String }],

    // Media attachments
    videoUrl: { type: String, default: "" },
    audioUrl: { type: String, default: "" },
    pdfAttachment: { type: String, default: "" },

    // Category-specific Experience Metadata
    mood: { type: String, default: "" },
    heroQuote: { type: String, default: "" },
    favoriteQuote: { type: String, default: "" },
    reflectionQuestions: [{ type: String }],
    takeaways: [{ type: String }],
    difficulty: { type: String, enum: ["", "beginner", "intermediate", "advanced"], default: "" },
    programmingLanguage: { type: String, default: "" },
    framework: { type: String, default: "" },
    version: { type: String, default: "" },
    githubUrl: { type: String, default: "" },
    npmPackage: { type: String, default: "" },
    objectives: [{ type: String }],
    prerequisites: [{ type: String }],
    estimatedTime: { type: String, default: "" },
    location: { type: String, default: "" },
    budget: { type: String, default: "" },
    weather: { type: String, default: "" },
    duration: { type: String, default: "" },
    season: { type: String, default: "" },
    bestTime: { type: String, default: "" },
    tips: { type: String, default: "" },
    reporter: { type: String, default: "" },
    source: { type: String, default: "" },
    isBreaking: { type: Boolean, default: false },
    isLive: { type: Boolean, default: false },

    // Status
    status: {
      type: String,
      enum: ["draft", "published", "archived", "scheduled"],
      default: "draft",
      index: true,
    },

    // Homepage / listing flags
    isFeatured: { type: Boolean, default: false, index: true },
    isMustRead: { type: Boolean, default: false, index: true },
    isTrending: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },

    // Publishing dates
    publishedAt: { type: Date, default: null },
    scheduledAt: { type: Date, default: null },
    updatedAt: { type: Date },

    // Reading time (minutes)
    readingTimeMin: { type: Number, default: 1 },
    // Legacy string format kept for frontend compatibility
    readingTime: { type: String, default: "1 min read" },

    // Author
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    author: { type: String, default: "Noble John Steeven", trim: true },

    // Taxonomy
    category: { type: String, trim: true, index: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", index: true },
    categorySlug: { type: String, trim: true, index: true },
    subcategory: { type: String, default: "", trim: true },
    tags: [{ type: String, trim: true }],

    // Engagement counters (denormalised for performance)
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 },
    saved: { type: Number, default: 0 },
    rating: { type: Number, default: 4.0 },

    // SEO block
    seo: { type: SeoSchema, default: () => ({}) },

    // Soft delete & auditing
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

ArticleSchema.index({ isDeleted: 1, status: 1, publishedAt: -1 });

// Compound indexes for common queries
ArticleSchema.index({ status: 1, publishedAt: -1 });
ArticleSchema.index({ status: 1, isFeatured: 1, publishedAt: -1 });
ArticleSchema.index({ status: 1, isMustRead: 1, publishedAt: -1 });
ArticleSchema.index({ status: 1, isTrending: 1 });
ArticleSchema.index({ status: 1, isPinned: 1 });
ArticleSchema.index({ status: 1, category: 1, publishedAt: -1 });

// Text search index
ArticleSchema.index(
  { title: "text", description: "text", body: "text", tags: "text", category: "text", author: "text" },
  { weights: { title: 10, description: 5, tags: 4, category: 3, body: 1 } }
);

// Auto-generate slug from title if not provided
ArticleSchema.pre("validate", function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  next();
});

// Auto-calculate reading time from body
ArticleSchema.pre("save", function (next) {
  if (this.isModified("body") && this.body) {
    const plainText = this.body.replace(/<[^>]+>/g, " ");
    const wordCount = plainText.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.round(wordCount / 200));
    this.readingTimeMin = minutes;
    this.readingTime = `${minutes} min read`;
  }

  // Set publishedAt when first published
  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }

  // Auto-generate categorySlug
  if (this.isModified("category") && this.category) {
    this.categorySlug = this.category
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  next();
});

// Virtual: id as string (matches frontend expectations)
ArticleSchema.virtual("id").get(function () {
  return this._id.toString();
});

ArticleSchema.set("toJSON", { virtuals: true });
ArticleSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Article", ArticleSchema);
