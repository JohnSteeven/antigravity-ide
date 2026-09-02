/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  DeploymentHistory.js  —  CI/CD Production Deployment Log Model
 *  MyJourney Platform  |  Stage 6 — Phase 30: Launch Readiness Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const DeploymentHistorySchema = new mongoose.Schema(
  {
    version: { type: String, required: true, index: true },
    environment: { type: String, enum: ['production', 'staging'], required: true },
    status: { type: String, enum: ['succeeded', 'failed', 'rolled_back'], required: true, index: true },
    commitHash: { type: String, default: '' },
    deployedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DeploymentHistory', DeploymentHistorySchema);
