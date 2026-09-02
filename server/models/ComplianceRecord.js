/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ComplianceRecord.js  —  GDPR / CCPA / SOC2 Compliance Audit Log Model
 *  MyJourney Platform  |  Stage 6 — Phase 28: Enterprise Governance & Compliance
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const ComplianceRecordSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['gdpr_export', 'gdpr_deletion', 'cookie_consent', 'privacy_request', 'legal_hold'],
      required: true,
      index: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'completed', 'rejected'], default: 'completed' },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ComplianceRecord', ComplianceRecordSchema);
