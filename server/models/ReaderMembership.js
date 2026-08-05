/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ReaderMembership.js  —  Active Reader Subscription & Billing Model
 *  MyJourney Platform  |  Stage 4 — Phase 22: Membership & Monetization
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const ReaderMembershipSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan', required: true },
    planSlug: { type: String, required: true },
    billingProvider: { type: String, enum: ['stripe', 'lemonsqueezy', 'paddle', 'manual'], default: 'stripe' },
    billingStatus: {
      type: String,
      enum: ['active', 'trialing', 'past_due', 'canceled', 'unpaid'],
      default: 'active',
      index: true,
    },
    currentPeriodStart: { type: Date, default: Date.now },
    currentPeriodEnd: { type: Date, default: null },
    trialEnd: { type: Date, default: null },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    meteredReadsThisMonth: { type: Number, default: 0 },
    paymentHistory: [
      {
        amount: { type: Number },
        currency: { type: String, default: 'USD' },
        status: { type: String, default: 'succeeded' },
        date: { type: Date, default: Date.now },
        invoiceId: { type: String },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReaderMembership', ReaderMembershipSchema);
