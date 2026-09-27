const mongoose = require("mongoose");
const CreatorAnalyticsAggregate = require("../models/CreatorAnalyticsAggregate");
const CreatorEarningPeriod = require("../models/CreatorEarningPeriod");
const CreatorEconomyPolicy = require("../models/CreatorEconomyPolicy");
const CreatorLedgerEntry = require("../models/CreatorLedgerEntry");
const CreatorPoolCalculation = require("../models/CreatorPoolCalculation");
const { SUPPORTED_CURRENCIES } = require("../billing/money");

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

const earningsError = (message, code, status = 422) => Object.assign(new Error(message), { code, status });
const asSafeMinor = (value, field = "amountMinor") => {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw earningsError(`${field} must be a non-negative safe integer.`, "INVALID_EARNING_AMOUNT");
  return number;
};
const asObject = (value) => value?.toObject?.() || value;
const sameId = (left, right) => String(left || "") === String(right || "");
const canonicalStatuses = Object.freeze(["pending", "finalized", "available", "paid"]);

const validateAllocation = (allocation) => {
  if (!mongoose.isValidObjectId(allocation?.creatorId)) throw earningsError("Pool allocation has an invalid Creator.", "INVALID_POOL_ALLOCATION", 409);
  const amountMinor = asSafeMinor(allocation.amountMinor);
  const qualifiedUnits = asSafeMinor(allocation.qualifiedUnits, "qualifiedUnits");
  const courseContributions = (allocation.courseContributions || []).map((course) => {
    if (!mongoose.isValidObjectId(course.courseId)) throw earningsError("Pool allocation has an invalid Course contribution.", "INVALID_POOL_ALLOCATION", 409);
    return { courseId: course.courseId, qualifiedUnits: asSafeMinor(course.qualifiedUnits, "courseQualifiedUnits") };
  });
  return { creatorId: allocation.creatorId, amountMinor, qualifiedUnits, courseContributions };
};

const assertExistingPeriod = (period, expected) => {
  const stored = asObject(period);
  if (!sameId(stored.sourceCalculationId, expected.sourceCalculationId)
    || Number(stored.finalizedAmountMinor) !== expected.finalizedAmountMinor
    || stored.currency !== expected.currency
    || stored.sourceInputHash !== expected.sourceInputHash) {
    throw earningsError("An earning period already exists with different finalized allocation inputs.", "EARNING_PERIOD_CONFLICT", 409);
  }
  return period;
};

const createEarningPeriod = async ({ calculation, allocation, actorUserId }) => {
  const expected = {
    creatorId: allocation.creatorId,
    sourceCalculationId: calculation._id,
    sourceInputHash: calculation.inputHash,
    periodStart: calculation.periodStart,
    periodEnd: calculation.periodEnd,
    policyVersion: calculation.policyVersion,
    qualifiedUnits: allocation.qualifiedUnits,
    status: "finalized",
    currency: calculation.currency,
    premiumRevenueMinor: calculation.eligibleRevenueMinor,
    creatorPoolMinor: calculation.creatorPoolMinor,
    estimatedAmountMinor: null,
    finalizedAmountMinor: allocation.amountMinor,
    courseContributions: allocation.courseContributions,
    finalizedAt: calculation.finalizedAt,
    finalizedBy: calculation.finalizedBy || null,
    generatedBy: actorUserId,
  };
  const sourceIdentity = { creatorId: allocation.creatorId, sourceCalculationId: calculation._id };
  const existing = await CreatorEarningPeriod.findOne(sourceIdentity);
  if (existing) return assertExistingPeriod(existing, expected);
  const periodIdentity = {
    creatorId: allocation.creatorId,
    periodStart: calculation.periodStart,
    periodEnd: calculation.periodEnd,
    currency: calculation.currency,
  };
  const occupied = await CreatorEarningPeriod.findOne(periodIdentity);
  if (occupied) return assertExistingPeriod(occupied, expected);
  try {
    return await CreatorEarningPeriod.create(expected);
  } catch (error) {
    if (error?.code !== 11000) throw error;
    const concurrent = await CreatorEarningPeriod.findOne(sourceIdentity) || await CreatorEarningPeriod.findOne(periodIdentity);
    if (!concurrent) throw error;
    return assertExistingPeriod(concurrent, expected);
  }
};

const createLedgerEntry = async ({ calculation, allocation, earningPeriod, actorUserId }) => {
  const reference = `creator-pool:${calculation._id}:creator:${allocation.creatorId}`;
  const expected = {
    creatorId: allocation.creatorId,
    earningPeriodId: earningPeriod._id,
    sourceCalculationId: calculation._id,
    sourceInputHash: calculation.inputHash,
    periodStart: calculation.periodStart,
    periodEnd: calculation.periodEnd,
    type: "engagement_earning",
    amountMinor: allocation.amountMinor,
    currency: calculation.currency,
    status: "finalized",
    reference,
    reason: `Finalized Creator pool allocation for ${new Date(calculation.periodStart).toISOString()} to ${new Date(calculation.periodEnd).toISOString()}.`,
    createdBy: actorUserId,
  };
  const existing = await CreatorLedgerEntry.findOne({ reference });
  if (existing) {
    const stored = asObject(existing);
    if (!sameId(stored.earningPeriodId, expected.earningPeriodId)
      || Number(stored.amountMinor) !== expected.amountMinor
      || stored.currency !== expected.currency
      || stored.status !== "finalized") {
      throw earningsError("A ledger reference already exists with different finalized allocation inputs.", "EARNING_LEDGER_CONFLICT", 409);
    }
    return existing;
  }
  try {
    return await CreatorLedgerEntry.create(expected);
  } catch (error) {
    if (error?.code !== 11000) throw error;
    const concurrent = await CreatorLedgerEntry.findOne({ reference });
    if (!concurrent) throw error;
    const stored = asObject(concurrent);
    if (!sameId(stored.earningPeriodId, expected.earningPeriodId)
      || Number(stored.amountMinor) !== expected.amountMinor
      || stored.currency !== expected.currency
      || stored.status !== "finalized") {
      throw earningsError("A ledger reference already exists with different finalized allocation inputs.", "EARNING_LEDGER_CONFLICT", 409);
    }
    return concurrent;
  }
};

const generateEarningsFromPool = async ({ calculationId, actorUserId }) => {
  if (!mongoose.isValidObjectId(calculationId) || !mongoose.isValidObjectId(actorUserId)) {
    throw earningsError("A valid finalized calculation and Admin actor are required.", "INVALID_EARNING_GENERATION");
  }
  const calculation = await CreatorPoolCalculation.findById(calculationId);
  if (!calculation) throw earningsError("Creator pool calculation was not found.", "CREATOR_POOL_NOT_FOUND", 404);
  if (calculation.status !== "finalized" || !calculation.finalizedAt) {
    throw earningsError("Creator earnings require a finalized pool calculation.", "CREATOR_POOL_NOT_FINALIZED", 409);
  }
  if (!SUPPORTED_CURRENCIES.includes(calculation.currency) || !/^[a-f0-9]{64}$/i.test(calculation.inputHash || "")) {
    throw earningsError("Finalized pool audit inputs are invalid.", "INVALID_POOL_AUDIT", 409);
  }
  const allocations = (calculation.allocations || []).map(validateAllocation)
    .sort((left, right) => String(left.creatorId).localeCompare(String(right.creatorId)));
  const allocationTotal = allocations.reduce((sum, allocation) => {
    const next = sum + allocation.amountMinor;
    if (!Number.isSafeInteger(next)) throw earningsError("Creator allocation total exceeds safe integer capacity.", "EARNING_INTEGER_OVERFLOW", 409);
    return next;
  }, 0);
  if (allocationTotal !== calculation.allocatedMinor) {
    throw earningsError("Finalized Creator allocations do not reconcile to the pool snapshot.", "POOL_ALLOCATION_MISMATCH", 409);
  }
  const rows = [];
  for (const allocation of allocations) {
    const earningPeriod = await createEarningPeriod({ calculation, allocation, actorUserId });
    const ledgerEntry = await createLedgerEntry({ calculation, allocation, earningPeriod, actorUserId });
    rows.push({ earningPeriod: asObject(earningPeriod), ledgerEntry: asObject(ledgerEntry) });
  }
  return {
    calculationId: calculation._id,
    periodStart: calculation.periodStart,
    periodEnd: calculation.periodEnd,
    currency: calculation.currency,
    status: "finalized",
    allocationCount: allocations.length,
    allocatedMinor: allocationTotal,
    entries: rows,
    payoutCreated: false,
  };
};

const serializeCreatorPeriod = (period) => ({
  id: period._id,
  sourceCalculationId: period.sourceCalculationId,
  periodStart: period.periodStart,
  periodEnd: period.periodEnd,
  currency: period.currency,
  amountMinor: period.finalizedAmountMinor,
  status: period.status,
  paymentStatus: period.status === "paid" ? "paid" : "payout_not_configured",
  qualifiedUnits: period.qualifiedUnits,
  courseContributions: (period.courseContributions || []).map((course) => ({ courseId: course.courseId, qualifiedUnits: course.qualifiedUnits })),
  finalizedAt: period.finalizedAt,
  createdAt: period.createdAt,
});

const summarizeByCurrency = (periods) => {
  const totals = new Map();
  periods.forEach((period) => {
    const current = totals.get(period.currency) || { currency: period.currency, pendingMinor: 0, finalizedMinor: 0, availableMinor: 0, paidMinor: 0 };
    const amount = asSafeMinor(period.finalizedAmountMinor || 0);
    if (period.status === "pending") current.pendingMinor += amount;
    if (["finalized", "available", "paid"].includes(period.status)) current.finalizedMinor += amount;
    if (period.status === "available") current.availableMinor += amount;
    if (period.status === "paid") current.paidMinor += amount;
    Object.entries(current).filter(([key]) => key.endsWith("Minor")).forEach(([, value]) => {
      if (!Number.isSafeInteger(value)) throw earningsError("Creator earning total exceeds safe integer capacity.", "EARNING_INTEGER_OVERFLOW", 409);
    });
    totals.set(period.currency, current);
  });
  return [...totals.values()].sort((left, right) => left.currency.localeCompare(right.currency));
};

const getCreatorEconomySummary = async (creatorId) => {
  if (!mongoose.isValidObjectId(creatorId)) throw earningsError("A valid Creator is required.", "INVALID_CREATOR", 401);
  const [policy, periods, ledgerEntryCount, engagement] = await Promise.all([
    CreatorEconomyPolicy.findOne({ key: "global", active: true }).lean(),
    CreatorEarningPeriod.find({ creatorId, sourceCalculationId: { $ne: null }, status: { $in: canonicalStatuses } }).sort({ periodEnd: -1, currency: 1 }).lean(),
    CreatorLedgerEntry.countDocuments({ creatorId, type: "engagement_earning" }),
    CreatorAnalyticsAggregate.aggregate([
      { $match: { creatorId } },
      { $group: { _id: null, qualifiedEvents: { $sum: "$metrics.qualifiedEvents" }, qualifiedDurationSeconds: { $sum: "$metrics.qualifiedDurationSeconds" } } },
    ]),
  ]);
  const entries = periods.map(serializeCreatorPeriod);
  return {
    programActive: Boolean(policy || periods.length),
    message: periods.length ? "Finalized Creator earnings are available to review. Payout delivery is not configured." : "No finalized Creator earnings are available yet.",
    qualifiedEngagement: engagement[0] || { qualifiedEvents: 0, qualifiedDurationSeconds: 0 },
    totalsByCurrency: summarizeByCurrency(periods),
    periods: entries,
    ledgerEntryCount,
    payoutAvailable: false,
    payoutStatus: "not_configured",
  };
};

const normalizeAdminFilter = ({ creatorId, periodStart, periodEnd, currency, status } = {}) => {
  const filter = { sourceCalculationId: { $ne: null } };
  if (creatorId) {
    if (!mongoose.isValidObjectId(creatorId)) throw earningsError("Admin Creator filter is invalid.", "INVALID_CREATOR_FILTER");
    filter.creatorId = creatorId;
  }
  if (currency) {
    const normalized = String(currency).toUpperCase();
    if (!SUPPORTED_CURRENCIES.includes(normalized)) throw earningsError("Admin currency filter is invalid.", "INVALID_CURRENCY_FILTER");
    filter.currency = normalized;
  }
  if (status) {
    if (!canonicalStatuses.includes(status)) throw earningsError("Admin earnings status filter is invalid.", "INVALID_EARNING_STATUS");
    filter.status = status;
  }
  if (periodStart) {
    const start = new Date(periodStart);
    if (Number.isNaN(start.getTime())) throw earningsError("Admin period start is invalid.", "INVALID_EARNING_PERIOD");
    filter.periodStart = { $gte: start };
  }
  if (periodEnd) {
    const end = new Date(periodEnd);
    if (Number.isNaN(end.getTime())) throw earningsError("Admin period end is invalid.", "INVALID_EARNING_PERIOD");
    filter.periodEnd = { $lte: end };
  }
  return filter;
};

const serializeAdminPeriod = (period) => ({
  ...serializeCreatorPeriod(period),
  creator: period.creatorId && typeof period.creatorId === "object" && period.creatorId.displayName
    ? { id: period.creatorId._id, displayName: period.creatorId.displayName, slug: period.creatorId.slug }
    : { id: period.creatorId },
  sourceInputHash: period.sourceInputHash,
  policyVersion: period.policyVersion,
});

const listAdminEarnings = async (query = {}) => {
  const filter = normalizeAdminFilter(query);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 50));
  const [items, total] = await Promise.all([
    CreatorEarningPeriod.find(filter).sort({ periodEnd: -1, currency: 1, creatorId: 1 }).limit(limit).populate("creatorId", "displayName slug").lean(),
    CreatorEarningPeriod.countDocuments(filter),
  ]);
  return { items: items.map(serializeAdminPeriod), total, limit };
};

module.exports = {
  DEFAULT_WEIGHTS,
  calculatePoints,
  generateEarningsFromPool,
  getCreatorEconomySummary,
  listAdminEarnings,
  normalizeAdminFilter,
  summarizeByCurrency,
};
