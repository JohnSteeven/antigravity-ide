const Coupon = require("../models/Coupon");
const MembershipPlan = require("../models/MembershipPlan");
const ReaderMembership = require("../models/ReaderMembership");
const AuditLogger = require("../audit/AuditLogger");
const MonetizationService = require("../services/monetizationService");
const PaymentProviderService = require("../services/paymentProviderService");
const entitlementService = require("../services/entitlementService");
const subscriptionService = require("../services/subscriptionService");
const { BILLING_PERIODS, PLANS } = require("../premium/catalog");

const asUserId = (req) => req.user?._id || req.user?.id;

exports.getPlans = async (req, res) => res.json({ success: true, data: MonetizationService.getPublicCatalog() });

exports.createPlan = async (req, res, next) => {
  try {
    const slug = String(req.body.slug || "").toLowerCase();
    if (!Object.values(PLANS).includes(slug)) return res.status(422).json({ message: "Only Free and MyJourney Premium plans are supported." });
    const plan = await MembershipPlan.create({ ...req.body, slug });
    return res.status(201).json({ success: true, data: plan });
  } catch (error) { return next(error); }
};

exports.updatePlan = async (req, res, next) => {
  try {
    const allowed = ["name", "description", "features", "trialDays", "durations", "status", "sortOrder"];
    const update = allowed.reduce((result, key) => {
      if (req.body[key] !== undefined) result[key] = req.body[key];
      return result;
    }, {});
    const plan = await MembershipPlan.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    return res.json({ success: true, data: plan });
  } catch (error) { return next(error); }
};

exports.getMyMembership = async (req, res, next) => {
  try {
    const data = await entitlementService.resolveForUser(asUserId(req));
    return res.set("Cache-Control", "private, no-store").json({ success: true, data });
  } catch (error) { return next(error); }
};

exports.subscribe = async (req, res, next) => {
  try {
    if (!PaymentProviderService.capability().providerConfigured) {
      return res.status(503).json({
        error: "Service Unavailable",
        message: "Billing provider is not configured for checkout.",
        code: "BILLING_PROVIDER_UNAVAILABLE",
      });
    }
    const billingPeriodMonths = Number(req.body.billingPeriodMonths);
    if (!BILLING_PERIODS.includes(billingPeriodMonths)) {
      return res.status(422).json({ message: "Choose 1 Month, 3 Months, 6 Months, or 1 Year.", code: "INVALID_BILLING_DURATION" });
    }
    await PaymentProviderService.createCheckoutSession({ userId: asUserId(req), plan: PLANS.PREMIUM, billingPeriodMonths });
  } catch (error) {
    return res.status(error.status || 503).json({ error: "Service Unavailable", message: error.message, code: error.code || "BILLING_PROVIDER_UNAVAILABLE" });
  }
};

exports.cancelSubscription = async (req, res, next) => {
  try {
    const existing = await ReaderMembership.findOne({ userId: asUserId(req) }).lean();
    if (!existing) return res.status(404).json({ message: "Premium membership was not found.", code: "SUBSCRIPTION_NOT_FOUND" });
    if (existing.provider === "development" && process.env.NODE_ENV === "production") {
      return res.status(403).json({ message: "Development Premium records are disabled in production.", code: "DEVELOPMENT_PREMIUM_DISABLED" });
    }
    if (!["manual", "development"].includes(existing.provider)) {
      await PaymentProviderService.cancelAtPeriodEnd(existing);
    }
    const membership = await subscriptionService.scheduleCancellation(asUserId(req));
    AuditLogger.log({ entity: "membership", entityId: membership._id, action: "cancel_scheduled", userId: asUserId(req), req, details: "MyJourney Premium renewal cancellation scheduled" });
    return res.json({ success: true, data: entitlementService.resolveFromSubscription(membership) });
  } catch (error) { return next(error); }
};

exports.getRevenueStats = async (req, res, next) => {
  try { return res.json({ success: true, data: await MonetizationService.getRevenueStats() }); }
  catch (error) { return next(error); }
};

exports.createCoupon = async (req, res, next) => {
  try { return res.status(201).json({ success: true, data: await Coupon.create(req.body) }); }
  catch (error) { return next(error); }
};
