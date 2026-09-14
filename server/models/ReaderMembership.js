/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ReaderMembership.js  —  Active Reader Subscription & Billing Model
 *  MyJourney Platform  |  Stage 4 — Phase 22: Membership & Monetization
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');
const { BILLING_PERIODS, PLANS, SUBSCRIPTION_STATUSES } = require('../premium/catalog');
const { MARKETS, PRODUCT_CODES } = require('../billing/priceCatalog');
const { currencyField, minorUnitField } = require('../billing/modelFields');

const ReaderMembershipSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan', default: null },
    plan: { type: String, enum: Object.values(PLANS), required: true, default: PLANS.PREMIUM, index: true },
    productCode: { type: String, enum: Object.values(PRODUCT_CODES), default: null },
    market: { type: String, enum: Object.values(MARKETS), default: null },
    amountMinor: minorUnitField({ defaultValue: null }),
    currency: currencyField({ required: false, defaultValue: null }),
    billingPeriodMonths: { type: Number, enum: BILLING_PERIODS, required: true },
    nextBillingPeriodMonths: { type: Number, enum: BILLING_PERIODS, default: null },
    provider: { type: String, default: 'unconfigured', trim: true },
    providerCustomerId: { type: String, default: null },
    providerSubscriptionId: { type: String, default: null },
    providerPriceId: { type: String, default: null },
    billingStatus: {
      type: String,
      enum: SUBSCRIPTION_STATUSES,
      default: 'incomplete',
      index: true,
    },
    latestPaymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
    startedAt: { type: Date, default: null },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    canceledAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    trialStart: { type: Date, default: null },
    trialEnd: { type: Date, default: null },
    graceUntil: { type: Date, default: null },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    latestProviderEventAt: { type: Date, default: null },
    latestProviderEventId: { type: String, default: null },
  },
  { timestamps: true }
);

ReaderMembershipSchema.index(
  { provider: 1, providerSubscriptionId: 1 },
  { unique: true, partialFilterExpression: { providerSubscriptionId: { $type: 'string' } }, name: 'membership_provider_subscription_unique' }
);

module.exports = mongoose.model('ReaderMembership', ReaderMembershipSchema);
