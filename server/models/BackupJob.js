/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  BackupJob.js  —  Automated System & Database Backup Model
 *  MyJourney Platform  |  Stage 6 — Phase 29: Cloud Infrastructure & Observability
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const BackupJobSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['full_system', 'database', 'media', 'tenant', 'config'],
      default: 'full_system',
      index: true,
    },
    status: { type: String, enum: ['completed', 'failed', 'running'], default: 'completed', index: true },
    sizeMb: { type: Number, default: 0 },
    storageProvider: { type: String, enum: ['s3', 'azure_blob', 'gcs', 'local'], default: 'local' },
    locationUrl: { type: String, default: '' },
    checksum: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BackupJob', BackupJobSchema);
