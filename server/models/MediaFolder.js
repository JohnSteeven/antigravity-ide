/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  MediaFolder.js  —  Nested Media Folder Model
 *  MyJourney CMS  |  Phase 2: Media Library 2.0 (DAM)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Supports unlimited nested folder hierarchies for digital assets.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const MediaFolderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    parentFolder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MediaFolder',
      default: null,
      index: true,
    },
    path: {
      type: String,
      default: '/', // Full path e.g. /images/travel/
      index: true,
    },
    color: {
      type: String,
      default: '#426c67',
    },
    icon: {
      type: String,
      default: 'Folder',
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

// Compound index to ensure folder names are unique per parent directory
MediaFolderSchema.index({ name: 1, parentFolder: 1 }, { unique: true });

module.exports = mongoose.model('MediaFolder', MediaFolderSchema);
