/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  InfrastructureNode.js  —  Cloud Server & Worker Node Model
 *  MyJourney Platform  |  Stage 6 — Phase 29: Cloud Infrastructure & Observability
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const InfrastructureNodeSchema = new mongoose.Schema(
  {
    nodeId: { type: String, required: true, unique: true, index: true },
    hostName: { type: String, required: true },
    provider: { type: String, enum: ['aws', 'azure', 'gcp', 'digitalocean', 'self_hosted'], default: 'self_hosted' },
    nodeType: { type: String, enum: ['web', 'worker', 'redis', 'database'], default: 'web' },
    status: { type: String, enum: ['healthy', 'degraded', 'offline'], default: 'healthy', index: true },
    cpuUsagePercent: { type: Number, default: 0 },
    memoryUsagePercent: { type: Number, default: 0 },
    activeWorkerThreads: { type: Number, default: 4 },
    lastHeartbeatAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InfrastructureNode', InfrastructureNodeSchema);
