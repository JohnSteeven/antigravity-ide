/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  TenantDomain.js  —  Tenant Custom Domain & SSL Model
 *  MyJourney Platform  |  Stage 5 — Phase 27: Enterprise Multi-Site Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const TenantDomainSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    domain: { type: String, required: true, unique: true, lowercase: true, trim: true },
    isPrimary: { type: Boolean, default: false },
    sslStatus: { type: String, enum: ['pending', 'active', 'failed'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TenantDomain', TenantDomainSchema);
