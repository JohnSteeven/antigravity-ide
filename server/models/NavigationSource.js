/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  NavigationSource.js  —  Dynamic Navigation Source Model
 *  MyJourney CMS  |  Phase 10: Navigation Intelligence Engine
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Stores dynamic navigation source contracts (Latest Articles, Content Types,
 *  Auto Category Expansion, Page Directory) for automated menu expansion.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const NavigationSourceSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['query', 'auto_expansion', 'taxonomy', 'content_type', 'popular'],
      default: 'auto_expansion',
    },
    targetType: {
      type: String,
      default: 'Article',
    },
    limit: {
      type: Number,
      default: 5,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('NavigationSource', NavigationSourceSchema);
