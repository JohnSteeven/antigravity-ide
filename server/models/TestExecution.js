/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  TestExecution.js  —  Automated Test Suite Execution Log Model
 *  MyJourney Platform  |  Stage 6 — Phase 30: Launch Readiness Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const TestExecutionSchema = new mongoose.Schema(
  {
    suiteName: { type: String, required: true }, // Unit, Integration, E2E, Security, Performance
    totalTests: { type: Number, required: true },
    passedCount: { type: Number, required: true },
    failedCount: { type: Number, default: 0 },
    durationMs: { type: Number, default: 0 },
    coveragePercent: { type: Number, default: null, min: 0, max: 100 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TestExecution', TestExecutionSchema);
