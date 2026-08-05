/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  EditorialComment.js  —  Editorial Review Comment Model
 *  MyJourney CMS  |  Stage 2 — Phase 11: Enterprise Editorial Workflow
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Editorial review notes and comments attached to items during workflow review.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const EditorialCommentSchema = new mongoose.Schema(
  {
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    contentType: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    resolved: {
      type: Boolean,
      default: false,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('EditorialComment', EditorialCommentSchema);
