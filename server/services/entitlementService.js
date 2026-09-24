const subscriptionService = require("./subscriptionService");
const { ENTITLEMENTS, PLANS, PREMIUM_ENTITLEMENTS } = require("../premium/catalog");
const { currentPaidWindow } = require("../premium/entitlementWindows");
const mongoose = require("mongoose");

const emptyEntitlements = () => Object.values(ENTITLEMENTS).reduce((result, key) => ({ ...result, [key]: false }), {});

const resolveFromSubscription = (subscription, now = new Date()) => {
  const access = subscriptionService.evaluatePremiumAccess(subscription, now);
  const entitlements = emptyEntitlements();
  if (access.active) PREMIUM_ENTITLEMENTS.forEach((key) => { entitlements[key] = true; });
  const prepaid = subscription?.provider === "razorpay" && !subscription?.providerSubscriptionId;
  const window = Array.isArray(subscription?.paidPeriods) ? currentPaidWindow(subscription.paidPeriods, now) : null;
  const currentPeriod = subscription?.paidPeriods?.find((period) => new Date(period.start) <= now && now < new Date(period.end));
  const status = ["period_expired", "trial_expired", "grace_expired"].includes(access.reason)
    ? "expired" : access.reason === "period_not_started" ? "scheduled" : subscription?.billingStatus || null;
  return {
    active: access.active,
    plan: access.active ? PLANS.PREMIUM : PLANS.FREE,
    planName: subscription?.plan === PLANS.PREMIUM ? "MyJourney Premium" : "MyJourney Free",
    productCode: currentPeriod?.productCode || subscription?.productCode || null,
    subscriptionStatus: status,
    billingPeriodMonths: currentPeriod?.billingPeriodMonths || subscription?.billingPeriodMonths || null,
    startedAt: subscription?.startedAt || subscription?.currentPeriodStart || null,
    currentPeriodStart: window?.start || subscription?.currentPeriodStart || null,
    currentPeriodEnd: window?.end || subscription?.currentPeriodEnd || null,
    nextAccessStart: !access.active && Array.isArray(subscription?.paidPeriods)
      ? subscription.paidPeriods.filter((period) => new Date(period.start) > now)
        .sort((left, right) => new Date(left.start) - new Date(right.start))[0]?.start || null : null,
    billingMode: prepaid ? "prepaid_term" : null,
    autoRenew: prepaid ? false : null,
    cancellationAvailable: Boolean(access.active && ["manual", "development", "razorpay"].includes(subscription?.provider) && !subscription?.providerSubscriptionId),
    cancelAtPeriodEnd: Boolean(subscription?.cancelAtPeriodEnd),
    canceledAt: subscription?.canceledAt || null,
    entitlementSource: subscription?.provider || null,
    paymentIssue: subscription?.lastPaymentIssue ? { status: subscription.lastPaymentIssue.status,
      occurredAt: subscription.lastPaymentIssue.occurredAt } : null,
    accessReason: access.reason,
    entitlements,
  };
};

const resolveForUser = async (userId, now = new Date()) => {
  if (!userId) return resolveFromSubscription(null, now);

  // QA / dev override: short-circuit for accounts with qaPremiumOverride=true
  // This is server-authoritative only — the flag is never sent to the client.
  try {
    const User = mongoose.models?.User;
    if (User) {
      const userDoc = await User.findById(userId).select("qaPremiumOverride").lean();
      if (userDoc?.qaPremiumOverride === true) {
        const entitlements = emptyEntitlements();
        PREMIUM_ENTITLEMENTS.forEach((key) => { entitlements[key] = true; });
        return {
          active: true,
          plan: PLANS.PREMIUM,
          planName: "MyJourney Premium (QA Override)",
          productCode: "qa_override",
          subscriptionStatus: "qa_override",
          billingPeriodMonths: null,
          startedAt: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          nextAccessStart: null,
          billingMode: null,
          autoRenew: null,
          cancellationAvailable: false,
          cancelAtPeriodEnd: false,
          canceledAt: null,
          entitlementSource: "qa_override",
          paymentIssue: null,
          accessReason: "qa_override",
          entitlements,
        };
      }
    }
  } catch {
    // Fall through to normal subscription resolution on any error
  }

  return resolveFromSubscription(await subscriptionService.getSubscriptionForUser(userId), now);
};

const hasEntitlement = (resolution, entitlement) => Boolean(resolution?.entitlements?.[entitlement]);

module.exports = { emptyEntitlements, hasEntitlement, resolveForUser, resolveFromSubscription };
