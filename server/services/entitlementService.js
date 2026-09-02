const subscriptionService = require("./subscriptionService");
const { ENTITLEMENTS, PLANS, PREMIUM_ENTITLEMENTS } = require("../premium/catalog");

const emptyEntitlements = () => Object.values(ENTITLEMENTS).reduce((result, key) => ({ ...result, [key]: false }), {});

const resolveFromSubscription = (subscription, now = new Date()) => {
  const access = subscriptionService.evaluatePremiumAccess(subscription, now);
  const entitlements = emptyEntitlements();
  if (access.active) PREMIUM_ENTITLEMENTS.forEach((key) => { entitlements[key] = true; });
  return {
    plan: access.active ? PLANS.PREMIUM : PLANS.FREE,
    subscriptionStatus: subscription?.billingStatus || null,
    billingPeriodMonths: subscription?.billingPeriodMonths || null,
    currentPeriodEnd: subscription?.currentPeriodEnd || null,
    cancelAtPeriodEnd: Boolean(subscription?.cancelAtPeriodEnd),
    accessReason: access.reason,
    entitlements,
  };
};

const resolveForUser = async (userId, now = new Date()) => {
  if (!userId) return resolveFromSubscription(null, now);
  return resolveFromSubscription(await subscriptionService.getSubscriptionForUser(userId), now);
};

const hasEntitlement = (resolution, entitlement) => Boolean(resolution?.entitlements?.[entitlement]);

module.exports = { emptyEntitlements, hasEntitlement, resolveForUser, resolveFromSubscription };
