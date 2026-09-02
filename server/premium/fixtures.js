const ReaderMembership = require("../models/ReaderMembership");
const { BILLING_PERIODS } = require("./catalog");

const addCalendarMonths = (value, months) => {
  const source = new Date(value);
  const day = source.getUTCDate();
  const result = new Date(source);
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
};

const buildSubscriptionFixture = ({ userId, billingPeriodMonths = 1, state = "active", now = new Date() } = {}) => {
  if (!BILLING_PERIODS.includes(billingPeriodMonths)) throw new Error("Invalid Premium fixture duration.");
  const currentPeriodStart = new Date(now);
  const currentPeriodEnd = addCalendarMonths(now, billingPeriodMonths);
  const base = {
    userId,
    plan: "premium",
    billingPeriodMonths,
    provider: "development",
    billingStatus: state,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd: false,
    trialStart: null,
    trialEnd: null,
    graceUntil: null,
  };
  if (state === "trialing") {
    base.trialStart = currentPeriodStart;
    base.trialEnd = currentPeriodEnd;
  }
  if (state === "past_due" || state === "grace_period") base.graceUntil = currentPeriodEnd;
  if (state === "cancel_pending" || state === "canceled") base.cancelAtPeriodEnd = true;
  if (state === "expired") base.currentPeriodEnd = new Date(now.getTime() - 1);
  return base;
};

const persistDevelopmentFixture = async (input) => {
  if (process.env.NODE_ENV === "production") {
    throw Object.assign(new Error("Development Premium fixtures are disabled in production."), { code: "DEVELOPMENT_PREMIUM_DISABLED" });
  }
  const fixture = buildSubscriptionFixture(input);
  return ReaderMembership.findOneAndUpdate({ userId: fixture.userId }, { $set: fixture }, { upsert: true, new: true, runValidators: true });
};

module.exports = { addCalendarMonths, buildSubscriptionFixture, persistDevelopmentFixture };
