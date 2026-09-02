/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Organization.js  —  Enterprise Organization Model
 *  MyJourney Platform  |  Stage 6 — Phase 28: Enterprise Governance & Compliance
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    domains: [{ type: String, lowercase: true, trim: true }],
    tenants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tenant' }],
    securityPolicyId: { type: mongoose.Schema.Types.ObjectId, ref: 'SecurityPolicy', default: null },
    status: { type: String, enum: ['active', 'suspended'], default: 'active', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Organization', OrganizationSchema);
