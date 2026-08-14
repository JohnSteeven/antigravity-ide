/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PodcastEpisode.js  —  Podcast Episode & RSS Feed Generator Model
 *  MyJourney Platform  |  Stage 4 — Phase 24: Distribution & Omnichannel Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');
const { ACCESS_LEVELS, PUBLICATION_STATUSES } = require('../learn/constants');
const { CREATOR_WORKFLOW_STATUSES } = require('../creators/constants');

const PodcastEpisodeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'CreatorProfile', default: null, index: true },
    seriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'PodcastSeries', default: null, index: true },
    topicIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Topic', index: true }],
    language: { type: String, default: 'English', index: true },
    audioUrl: { type: String, default: '' },
    mediaAssetId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProtectedMediaAsset', default: null, select: false },
    optionalVideoAssetId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProtectedMediaAsset', default: null, select: false },
    durationSeconds: { type: Number, default: 0 },
    seasonNumber: { type: Number, default: 1 },
    episodeNumber: { type: Number, required: true },
    transcript: { type: String, default: '', select: false },
    showNotes: { type: String, default: '', select: false },
    chapters: { type: [{ title: String, startSeconds: Number }], default: [], select: false },
    coverImage: { type: String, default: '' },
    articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', default: null },
    isPublished: { type: Boolean, default: true },
    accessLevel: { type: String, enum: ACCESS_LEVELS, default: 'free', index: true },
    publicationStatus: { type: String, enum: PUBLICATION_STATUSES, default: 'published', index: true },
    workflowStatus: { type: String, enum: CREATOR_WORKFLOW_STATUSES, default: 'published', index: true },
    rightsConfirmedAt: { type: Date, default: null },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

PodcastEpisodeSchema.index({ publicationStatus: 1, accessLevel: 1, publishedAt: -1 });
PodcastEpisodeSchema.index({ creatorId: 1, workflowStatus: 1, updatedAt: -1 });

module.exports = mongoose.model('PodcastEpisode', PodcastEpisodeSchema);
