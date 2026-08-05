/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ApiKey.js  —  Developer API Keys & Scoped Token Model
 *  MyJourney Platform  |  Stage 5 — Phase 26: Enterprise Developer Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const ApiKeySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, unique: true, index: true }, // e.g. mj_live_...
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    permissions: [{ type: String, enum: ['read', 'write', 'admin'], default: ['read'] }],
    rateLimitPerMin: { type: Number, default: 60 },
    expiresAt: { type: Date, default: null },
    status: { type: String, enum: ['active', 'revoked', 'expired'], default: 'active', index: true },
    lastUsedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ApiKey', ApiKeySchema);
