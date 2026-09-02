/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  MembershipPlan.js  —  Membership & Subscription Plan Model
 *  MyJourney Platform  |  Stage 4 — Phase 22: Membership & Monetization
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');
const { BILLING_PERIODS, PLANS } = require('../premium/catalog');

const DurationSchema = new mongoose.Schema({
  billingPeriodMonths: { type: Number, enum: BILLING_PERIODS, required: true },
  displayLabel: { type: String, required: true, trim: true },
  priceMinor: { type: Number, min: 0, default: null },
  currency: { type: String, trim: true, uppercase: true, default: null },
  providerPriceId: { type: String, trim: true, default: null },
  promotion: { type: mongoose.Schema.Types.Mixed, default: null },
}, { _id: false });

const MembershipPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, enum: Object.values(PLANS), required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    features: [{ type: String }],
    trialDays: { type: Number, default: 0 },
    durations: { type: [DurationSchema], default: [] },
    status: { type: String, enum: ['active', 'archived'], default: 'active', index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MembershipPlan', MembershipPlanSchema);
