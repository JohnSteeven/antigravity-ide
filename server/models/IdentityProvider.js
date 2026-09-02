/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  IdentityProvider.js  —  Enterprise SSO Identity Provider Model
 *  MyJourney Platform  |  Stage 6 — Phase 28: Enterprise Governance & Compliance
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const IdentityProviderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['oauth2', 'openid', 'saml2', 'okta', 'azure_ad', 'google_workspace', 'auth0'],
      required: true,
    },
    clientId: { type: String, default: '' },
    clientSecret: { type: String, default: '' },
    entryPoint: { type: String, default: '' }, // SSO Issuer/Entry URL
    cert: { type: String, default: '' },
    status: { type: String, enum: ['enabled', 'disabled'], default: 'enabled', index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('IdentityProvider', IdentityProviderSchema);
