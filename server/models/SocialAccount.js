/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SocialAccount.js  —  Connected Social Media Accounts Model
 *  MyJourney Platform  |  Stage 4 — Phase 24: Distribution & Omnichannel Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const SocialAccountSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      enum: ['twitter', 'linkedin', 'facebook', 'instagram', 'threads', 'mastodon'],
      required: true,
    },
    accountName: { type: String, required: true },
    accountHandle: { type: String, required: true },
    accessToken: { type: String, default: '' },
    refreshToken: { type: String, default: '' },
    isAutoPublishEnabled: { type: Boolean, default: true },
    status: { type: String, enum: ['connected', 'disconnected', 'error'], default: 'connected' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SocialAccount', SocialAccountSchema);
