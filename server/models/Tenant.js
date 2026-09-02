/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Tenant.js  —  Multi-Tenant & White-Label Site Model
 *  MyJourney Platform  |  Stage 5 — Phase 27: Enterprise Multi-Site Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const TenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    domain: { type: String, required: true, unique: true, lowercase: true, trim: true },
    customDomain: { type: String, default: '' },
    status: { type: String, enum: ['active', 'suspended', 'archived'], default: 'active', index: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // White-Label Branding
    logo: { type: String, default: '' },
    favicon: { type: String, default: '' },
    primaryColor: { type: String, default: '#426c67' },
    accentColor: { type: String, default: '#10b981' },
    customCss: { type: String, default: '' },

    // Localization & Regional Settings
    defaultLanguage: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    currency: { type: String, default: 'USD' },

    storageUsedMb: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tenant', TenantSchema);
