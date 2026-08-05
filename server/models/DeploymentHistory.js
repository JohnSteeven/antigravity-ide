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
    environment: { type: String, enum: ['production', 'staging'], default: 'production' },
    status: { type: String, enum: ['succeeded', 'failed', 'rolled_back'], default: 'succeeded', index: true },
    commitHash: { type: String, default: '' },
    deployedBy: { type: String, default: 'CI/CD Pipeline' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DeploymentHistory', DeploymentHistorySchema);
