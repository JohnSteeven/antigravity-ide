/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ContentEntry.js  —  Enterprise Content Entry Model
 *  MyJourney CMS  |  Phase 9: Enterprise Content Modeling Engine
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Generic headless content entry storing dynamic JSON fields for any defined
 *  ContentType (Books, Events, Courses, Authors, Series, Topics, etc.).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const ContentEntrySchema = new mongoose.Schema(
  {
    contentTypeKey: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    views: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ContentEntrySchema.index({ contentTypeKey: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('ContentEntry', ContentEntrySchema);
