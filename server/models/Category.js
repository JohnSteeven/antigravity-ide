/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Category.js  —  Advanced Category Lifecycle Model
 *  MyJourney Platform  |  Advanced Dynamic Category System
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Full lifecycle without destructive side effects.
 *  Disabling, hiding, archiving, or unlisting a category:
 *    - Hides it from specified public surfaces
 *    - Never deletes articles, comments, analytics, or relationships
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
  {
    // ── Core Identity ──────────────────────────────────────────────────────────
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    longDescription: { type: String, default: '' },
    icon: { type: String, default: 'book' },
    heroImage: { type: String, default: '' },
    accentColor: { type: String, default: '' },           // hex color e.g. #426c67
    layoutTemplate: { type: String, default: 'default' }, // 'default' | 'magazine' | 'minimal' | 'full-width'

    // ── Sort & Feature ─────────────────────────────────────────────────────────
    sortOrder: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },

    // ── Lifecycle Status ──────────────────────────────────────────────────────
    // status: overall publication state
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },

    // isActive: quick visibility toggle (on/off) without changing status
    isActive: { type: Boolean, default: true, index: true },

    // ── Granular Visibility Controls ──────────────────────────────────────────
    // Where does this category appear publicly?
    visibility: {
      type: String,
      enum: ['public', 'unlisted', 'private'],
      default: 'public',
    },
    showOnHomepage: { type: Boolean, default: true },
    showInNavigation: { type: Boolean, default: true },
    showInFooter: { type: Boolean, default: false },
    showInSearch: { type: Boolean, default: true },
    includeInSitemap: { type: Boolean, default: true },

    // ── Content Rules ─────────────────────────────────────────────────────────
    allowArticles: { type: Boolean, default: true },
    allowComments: { type: Boolean, default: true },

    // ── SEO ───────────────────────────────────────────────────────────────────
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    seoKeywords: [{ type: String }],

    // ── Relations ─────────────────────────────────────────────────────────────
    subcategories: [{ type: String, trim: true }],
    parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },

    // ── Soft Delete ───────────────────────────────────────────────────────────
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },

    // ── Audit ─────────────────────────────────────────────────────────────────
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    publishedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound indexes for efficient public-facing queries
CategorySchema.index({ isDeleted: 1, isActive: 1, status: 1, sortOrder: 1 });
CategorySchema.index({ isDeleted: 1, isActive: 1, showOnHomepage: 1 });
CategorySchema.index({ isDeleted: 1, isActive: 1, showInNavigation: 1 });
CategorySchema.index({ isDeleted: 1, isActive: 1, showInSearch: 1 });
CategorySchema.index({ isDeleted: 1, status: 1, visibility: 1 });

module.exports = mongoose.model('Category', CategorySchema);
