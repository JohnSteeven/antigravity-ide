/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  LaunchReport.js  —  Production Launch Readiness Report Model
 *  MyJourney Platform  |  Stage 6 — Phase 30: Launch Readiness Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const LaunchReportSchema = new mongoose.Schema(
  {
    readinessScore: { type: Number, required: true }, // 0 - 100%
    status: { type: String, enum: ['ready', 'warning', 'blocked'], default: 'blocked', index: true },
    checks: [
      {
        category: { type: String, required: true }, // Environment, Security, Database, Storage, Search, AI
        name: { type: String, required: true },
        passed: { type: Boolean, required: true },
        critical: { type: Boolean, default: false },
        details: { type: String, default: '' },
      },
    ],
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    evidenceSource: { type: String, default: 'recorded_evidence' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LaunchReport', LaunchReportSchema);
