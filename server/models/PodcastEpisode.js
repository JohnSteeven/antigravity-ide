/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  PodcastEpisode.js  —  Podcast Episode & RSS Feed Generator Model
 *  MyJourney Platform  |  Stage 4 — Phase 24: Distribution & Omnichannel Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const PodcastEpisodeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    audioUrl: { type: String, required: true },
    durationSeconds: { type: Number, default: 0 },
    seasonNumber: { type: Number, default: 1 },
    episodeNumber: { type: Number, required: true },
    transcript: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', default: null },
    isPublished: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PodcastEpisode', PodcastEpisodeSchema);
