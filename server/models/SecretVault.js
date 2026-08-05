/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SecretVault.js  —  Encrypted Key & Secret Rotation Manager Model
 *  MyJourney Platform  |  Stage 6 — Phase 28: Enterprise Governance & Compliance
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const SecretVaultSchema = new mongoose.Schema(
  {
    secretKey: { type: String, required: true, unique: true, index: true }, // e.g. STRIPE_SECRET_KEY
    encryptedValue: { type: String, required: true },
    version: { type: Number, default: 1 },
    lastRotatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SecretVault', SecretVaultSchema);
