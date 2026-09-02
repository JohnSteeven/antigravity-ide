/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Media.js  —  Enterprise Digital Asset Management (DAM) Model
 *  MyJourney CMS  |  Phase 2: Media Library 2.0
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Stores complete asset metadata, versions, usage relationships,
 *  checksums (SHA256 duplicate detection), tags, and collections.
 *  100% backward-compatible with existing schema fields.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const MediaVersionSchema = new mongoose.Schema(
  {
    version: { type: Number, required: true },
    key: { type: String, required: true },
    url: { type: String, required: true },
    sizeBytes: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const MediaUsageSchema = new mongoose.Schema(
  {
    entityType: { type: String, required: true }, // 'article', 'page', 'category', 'testimonial'
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    title: { type: String, default: '' },
    field: { type: String, default: 'featuredImage' },
  },
  { _id: false }
);

const MediaSchema = new mongoose.Schema(
  {
    // Legacy & Core Identifiers
    name: { type: String, required: true, trim: true },
    fileName: { type: String, required: true, trim: true },
    originalName: { type: String, trim: true },
    displayName: { type: String, trim: true },
    slug: { type: String, lowercase: true, trim: true },

    mimeType: { type: String, default: 'image/jpeg' },
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'pdf', 'document'],
      default: 'image',
      index: true,
    },
    extension: { type: String, default: '' },
    url: { type: String, required: true },
    provider: { type: String, default: 'local' },

    // Folder & Collections
    folder: { type: mongoose.Schema.Types.Mixed, default: null, index: true }, // ObjectId ref MediaFolder or Legacy String
    folderPath: { type: String, default: '/' },
    tags: { type: [String], default: [], index: true },
    collections: { type: [String], default: [] },

    // Dimensions & Technical Info
    width: { type: Number },
    height: { type: Number },
    duration: { type: Number, default: 0 }, // For video/audio in seconds
    sizeBytes: { type: Number, default: 0 },
    size: { type: String, default: '' },
    checksum: { type: String, index: true }, // SHA256 hash for duplicate detection
    hash: { type: String },
    dominantColor: { type: String, default: '#ffffff' },

    // Descriptive Metadata
    alt: { type: String, default: '' }, // Legacy alt field
    altText: { type: String, default: '' },
    caption: { type: String, default: '' },
    description: { type: String, default: '' },
    author: { type: String, default: '' },
    license: { type: String, default: 'All Rights Reserved' },
    copyright: { type: String, default: '' },
    source: { type: String, default: '' },

    // Ownership & Usage Tracking
    uploadedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastUsed: { type: Date, default: null },
    usageCount: { type: Number, default: 0 },
    usedBy: [MediaUsageSchema],

    // Flags & Multi-State
    status: { type: String, enum: ['active', 'archived'], default: 'active', index: true },
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    isFavorite: { type: Boolean, default: false, index: true },
    isArchived: { type: Boolean, default: false, index: true },
    isDuplicate: { type: Boolean, default: false },
    duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null },

    // Versioning History
    versions: [MediaVersionSchema],

    // Soft Delete (Legacy)
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

MediaSchema.index({ isDeleted: 1, type: 1 });
MediaSchema.index({ name: 'text', altText: 'text', caption: 'text', tags: 'text' });

module.exports = mongoose.model('Media', MediaSchema);
