/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ApiApplication.js  —  OAuth2 Application Model
 *  MyJourney Platform  |  Stage 5 — Phase 26: Enterprise Developer Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const ApiApplicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    clientId: { type: String, required: true, unique: true, index: true },
    clientSecret: { type: String, required: true },
    redirectUris: [{ type: String }],
    allowedOrigins: [{ type: String }],
    status: { type: String, enum: ['active', 'suspended', 'revoked'], default: 'active', index: true },
    lastUsedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ApiApplication', ApiApplicationSchema);
