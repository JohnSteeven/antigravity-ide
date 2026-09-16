const ReaderMembership = require("../models/ReaderMembership");
const { BILLING_PERIODS, PLANS } = require("../premium/catalog");
const { SUBSCRIPTION_TRANSITIONS, canTransition } = require("../billing/constants");

const asDate = (value) => value ? new Date(value) : null;
const isAfter = (value, now) => {
  const date = asDate(value);
  return Boolean(date && !Number.isNaN(date.getTime()) && date.getTime() > now.getTime());
};

const evaluatePremiumAccess = (subscription, now = new Date()) => {
  if (!subscription || subscription.plan !== PLANS.PREMIUM) return { active: false, reason: "free" };
  if (process.env.NODE_ENV === "production" && subscription.provider === "development") {
    return { active: false, reason: "development_disabled" };
  }
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

const transitionSubscription = async ({ subscriptionId, nextStatus, providerEventId, occurredAt = new Date(), updates = {}, session }) => {
  if (!SUBSCRIPTION_TRANSITIONS[nextStatus]) {
    throw Object.assign(new Error("Unknown subscription status."), { status: 422, code: "INVALID_SUBSCRIPTION_STATUS" });
  }
  const predecessors = Object.keys(SUBSCRIPTION_TRANSITIONS)
    .filter((current) => canTransition(SUBSCRIPTION_TRANSITIONS, current, nextStatus));
  const allowedUpdates = [
    "productCode", "market", "amountMinor", "currency", "billingPeriodMonths",
    "provider", "providerCustomerId", "providerSubscriptionId", "providerPriceId",
    "latestPaymentId", "startedAt", "currentPeriodStart", "currentPeriodEnd",
    "graceUntil", "cancelAtPeriodEnd", "canceledAt", "endedAt",
  ].reduce((safe, key) => {
    if (updates[key] !== undefined) safe[key] = updates[key];
    return safe;
  }, {});
  const membership = await ReaderMembership.findOneAndUpdate(
    {
      _id: subscriptionId,
      billingStatus: { $in: predecessors },
      $or: [
        { latestProviderEventAt: null },
        { latestProviderEventAt: { $lte: occurredAt } },
        { latestProviderEventId: providerEventId },
      ],
    },
    {
      $set: {
        ...allowedUpdates,
        billingStatus: nextStatus,
        latestProviderEventAt: occurredAt,
        latestProviderEventId: providerEventId || null,
      },
    },
    { new: true, runValidators: true, session }
  );
  if (membership) return membership;
  const current = await ReaderMembership.findById(subscriptionId).session(session || null);
  if (!current) throw Object.assign(new Error("Premium membership was not found."), { status: 404, code: "SUBSCRIPTION_NOT_FOUND" });
  if (providerEventId && current.latestProviderEventId === providerEventId) return current;
  if (current.latestProviderEventAt && current.latestProviderEventAt > occurredAt) {
    throw Object.assign(new Error("An older subscription event cannot replace newer state."), { status: 409, code: "STALE_SUBSCRIPTION_EVENT" });
  }
  throw Object.assign(new Error(`Subscription cannot move from ${current.billingStatus} to ${nextStatus}.`), { status: 409, code: "INVALID_SUBSCRIPTION_TRANSITION" });
};

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

module.exports = { evaluatePremiumAccess, getSubscriptionForUser, scheduleCancellation, transitionSubscription };
