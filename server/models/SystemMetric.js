/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SystemMetric.js  —  Timeseries Metrics & Observability Log Model
 *  MyJourney Platform  |  Stage 6 — Phase 29: Cloud Infrastructure & Observability
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const SystemMetricSchema = new mongoose.Schema(
  {
    metricName: { type: String, required: true, index: true }, // e.g. api_latency_ms, cpu_percent, memory_mb
    value: { type: Number, required: true },
    tags: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

module.exports = mongoose.model('SystemMetric', SystemMetricSchema);
