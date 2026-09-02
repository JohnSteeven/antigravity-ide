const ReaderMembership = require("../models/ReaderMembership");
const { BILLING_PERIODS, PLANS } = require("../premium/catalog");

const asDate = (value) => value ? new Date(value) : null;
const isAfter = (value, now) => {
  const date = asDate(value);
  return Boolean(date && !Number.isNaN(date.getTime()) && date.getTime() > now.getTime());
};

const evaluatePremiumAccess = (subscription, now = new Date()) => {
  if (!subscription || subscription.plan !== PLANS.PREMIUM) return { active: false, reason: "free" };
  if (!BILLING_PERIODS.includes(Number(subscription.billingPeriodMonths))) return { active: false, reason: "invalid_duration" };

  const status = subscription.billingStatus;
  if (["expired", "incomplete"].includes(status)) return { active: false, reason: status };

  if (status === "trialing") {
    const active = isAfter(subscription.trialEnd || subscription.currentPeriodEnd, now);
    return { active, reason: active ? "trial" : "trial_expired" };
  }

  if (["past_due", "grace_period"].includes(status)) {
    const active = isAfter(subscription.graceUntil, now);
    return { active, reason: active ? "grace" : "grace_expired" };
  }

  if (["active", "cancel_pending", "canceled"].includes(status)) {
    const active = isAfter(subscription.currentPeriodEnd, now);
    return { active, reason: active ? (subscription.cancelAtPeriodEnd || status !== "active" ? "paid_period" : "active") : "period_expired" };
  }

  return { active: false, reason: "unsupported_status" };
};

const getSubscriptionForUser = async (userId) => ReaderMembership.findOne({ userId }).lean();

const scheduleCancellation = async (userId, now = new Date()) => {
  const subscription = await ReaderMembership.findOne({ userId });
  if (!subscription) throw Object.assign(new Error("Premium membership was not found."), { status: 404, code: "SUBSCRIPTION_NOT_FOUND" });
  const access = evaluatePremiumAccess(subscription, now);
  if (!access.active) throw Object.assign(new Error("Premium membership is not currently active."), { status: 409, code: "SUBSCRIPTION_NOT_ACTIVE" });
  subscription.cancelAtPeriodEnd = true;
  subscription.canceledAt = now;
  subscription.billingStatus = "cancel_pending";
  await subscription.save();
  return subscription;
};

module.exports = { evaluatePremiumAccess, getSubscriptionForUser, scheduleCancellation };
