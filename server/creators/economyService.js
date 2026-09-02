const CreatorAnalyticsAggregate = require("../models/CreatorAnalyticsAggregate");
const CreatorEarningPeriod = require("../models/CreatorEarningPeriod");
const CreatorEconomyPolicy = require("../models/CreatorEconomyPolicy");
const CreatorLedgerEntry = require("../models/CreatorLedgerEntry");

const DEFAULT_WEIGHTS = Object.freeze({
  qualifiedRead: 1,
  qualifiedWatchMinute: 1,
  qualifiedListenMinute: 1,
  lessonCompletion: 2,
  courseProgression: 3,
  meaningfulSave: 0.5,
});

const calculatePoints = (metrics = {}, weights = DEFAULT_WEIGHTS) => Number((
  (metrics.qualifiedReads || 0) * weights.qualifiedRead
  + ((metrics.qualifiedWatchSeconds || 0) / 60) * weights.qualifiedWatchMinute
  + ((metrics.qualifiedListenSeconds || 0) / 60) * weights.qualifiedListenMinute
  + (metrics.lessonCompletions || 0) * weights.lessonCompletion
  + (metrics.courseProgressions || 0) * weights.courseProgression
  + (metrics.meaningfulSaves || 0) * weights.meaningfulSave
).toFixed(4));

const getCreatorEconomySummary = async (creatorId) => {
  const [policy, periods, ledgerCount, engagement] = await Promise.all([
    CreatorEconomyPolicy.findOne({ key: "global", active: true }).lean(),
    CreatorEarningPeriod.find({ creatorId }).sort({ periodStart: -1 }).limit(24).lean(),
    CreatorLedgerEntry.countDocuments({ creatorId }),
    CreatorAnalyticsAggregate.aggregate([
      { $match: { creatorId } },
      { $group: { _id: null, qualifiedEvents: { $sum: "$metrics.qualifiedEvents" }, qualifiedDurationSeconds: { $sum: "$metrics.qualifiedDurationSeconds" } } },
    ]),
  ]);
  return {
    programActive: Boolean(policy),
    message: policy ? "Creator Earnings accounting is configured; payout delivery remains unavailable." : "Creator Earnings Program — not yet activated.",
    qualifiedEngagement: engagement[0] || { qualifiedEvents: 0, qualifiedDurationSeconds: 0 },
    periods,
    ledgerEntryCount: ledgerCount,
    estimatedEarnings: null,
    finalizedEarnings: null,
    payoutAvailable: false,
    currency: null,
  };
};

module.exports = { DEFAULT_WEIGHTS, calculatePoints, getCreatorEconomySummary };
