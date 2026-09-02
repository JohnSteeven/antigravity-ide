/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  TenantBackup.js  —  Tenant Isolated Backup & Snapshot Model
 *  MyJourney Platform  |  Stage 5 — Phase 27: Enterprise Multi-Site Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const TenantBackupSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    backupName: { type: String, required: true },
    sizeMb: { type: Number, default: 0 },
    downloadUrl: { type: String, default: '' },
    status: { type: String, enum: ['completed', 'failed', 'in_progress'], default: 'completed' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TenantBackup', TenantBackupSchema);
