/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SecurityPolicy.js  —  Enterprise Security & Compliance Policy Model
 *  MyJourney Platform  |  Stage 6 — Phase 28: Enterprise Governance & Compliance
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const SecurityPolicySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    passwordMinLength: { type: Number, default: 12 },
    passwordRequireSpecial: { type: Boolean, default: true },
    sessionTimeoutMinutes: { type: Number, default: 60 },
    maxConcurrentSessions: { type: Number, default: 5 },
    allowedIpRanges: [{ type: String }],
    requireMfa: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SecurityPolicy', SecurityPolicySchema);
