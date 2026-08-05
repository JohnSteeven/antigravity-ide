/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  MembershipPlan.js  —  Membership & Subscription Plan Model
 *  MyJourney Platform  |  Stage 4 — Phase 22: Membership & Monetization
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const MembershipPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    monthlyPrice: { type: Number, required: true, default: 0 },
    annualPrice: { type: Number, required: true, default: 0 },
    currency: { type: String, default: 'USD' },
    features: [{ type: String }],
    trialDays: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'archived'], default: 'active', index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MembershipPlan', MembershipPlanSchema);
