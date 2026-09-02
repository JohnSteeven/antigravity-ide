/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ReleaseVersion.js  —  Platform Release Notes & Version Manager Model
 *  MyJourney Platform  |  Stage 6 — Phase 30: Launch Readiness Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const ReleaseVersionSchema = new mongoose.Schema(
  {
    version: { type: String, required: true, unique: true, index: true }, // e.g. 6.0.0
    releaseName: { type: String, required: true },
    releaseNotes: { type: String, default: '' },
    isProduction: { type: Boolean, default: false },
    featuresCount: { type: Number, default: 0, min: 0 },
    releasedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReleaseVersion', ReleaseVersionSchema);
