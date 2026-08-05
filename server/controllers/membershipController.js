/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  membershipController.js  —  Membership & Monetization Controller
 *  MyJourney Platform  |  Stage 4 — Phase 22: Membership & Monetization
 * ─────────────────────────────────────────────────────────────────────────────
 */

const MembershipPlan    = require('../models/MembershipPlan');
const ReaderMembership  = require('../models/ReaderMembership');
const Coupon            = require('../models/Coupon');
const MonetizationService = require('../services/monetizationService');
const PaymentProviderService = require('../services/paymentProviderService');

// ── Plans CRUD ────────────────────────────────────────────────────────────────

exports.getPlans = async (req, res) => {
  try {
    await MonetizationService.seedDefaultPlans();
    const plans = await MembershipPlan.find({ status: 'active' }).sort({ sortOrder: 1 }).lean();
    res.json({ success: true, data: plans });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createPlan = async (req, res) => {
  try {
    const plan = await MembershipPlan.create(req.body);
    res.status(201).json({ success: true, data: plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const plan = await MembershipPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Reader Subscription Management ────────────────────────────────────────────

exports.getMyMembership = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const membership = await ReaderMembership.findOne({ userId: req.user.id }).populate('planId').lean();
    res.json({ success: true, data: membership || { planSlug: 'free', billingStatus: 'active' } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.subscribe = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const { planSlug, provider = 'stripe' } = req.body;

    const plan = await MembershipPlan.findOne({ slug: planSlug, status: 'active' }).lean();
    if (!plan) return res.status(404).json({ error: 'Plan not found.' });

    // Create Checkout Session
    const session = await PaymentProviderService.createCheckoutSession({
      provider,
      plan,
      userId: req.user.id,
      userEmail: req.user.email,
    });

    // Create or update ReaderMembership record
    let membership = await ReaderMembership.findOne({ userId: req.user.id });
    if (!membership) {
      membership = new ReaderMembership({
        userId: req.user.id,
        planId: plan._id,
        planSlug: plan.slug,
        billingProvider: provider,
        billingStatus: 'active',
      });
    } else {
      membership.planId = plan._id;
      membership.planSlug = plan.slug;
      membership.billingProvider = provider;
      membership.billingStatus = 'active';
    }
    await membership.save();

    res.json({ success: true, data: { checkoutUrl: session.checkoutUrl, membership } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const membership = await ReaderMembership.findOne({ userId: req.user.id });
    if (!membership) return res.status(404).json({ error: 'Subscription not found.' });

    membership.billingStatus = 'canceled';
    membership.cancelAtPeriodEnd = true;
    await membership.save();

    res.json({ success: true, data: membership });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Revenue & Coupon Stats ───────────────────────────────────────────────────

exports.getRevenueStats = async (req, res) => {
  try {
    const stats = await MonetizationService.getRevenueStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
