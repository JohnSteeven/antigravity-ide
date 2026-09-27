const crypto = require("crypto");
const mongoose = require("mongoose");
const { SUPPORTED_CURRENCIES } = require("../billing/money");
const CreatorEconomyPolicy = require("../models/CreatorEconomyPolicy");
const CreatorPoolCalculation = require("../models/CreatorPoolCalculation");
const Payment = require("../models/Payment");
const { normalizePeriod, reportLearningEngagement } = require("./learningEngagementService");

const WEIGHT_KEYS = Object.freeze([
  "lessonCompletion",
  "quizPass",
  "exercisePass",
  "courseCompletion",
  "repeatMeaningfulLearnerDay",
]);
const poolError = (message, code, status = 422) => Object.assign(new Error(message), { code, status });
const asSafeInteger = (value, field) => {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) throw poolError(`${field} must be a non-negative safe integer.`, "INVALID_POOL_INPUT");
  return number;
};
const fromBigInt = (value, field) => {
  if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw poolError(`${field} exceeds safe integer capacity.`, "POOL_INTEGER_OVERFLOW");
  return Number(value);
};
const safeAdd = (left, right, field) => fromBigInt(BigInt(left) + BigInt(right), field);

const normalizeCurrency = (value) => {
  const currency = String(value || "").trim().toUpperCase();
  if (!SUPPORTED_CURRENCIES.includes(currency)) throw poolError("Pool currency must be INR or USD.", "INVALID_POOL_CURRENCY");
  return currency;
};

const policySnapshot = (policy) => {
  if (!policy?.active) throw poolError("Creator pool policy is not active.", "CREATOR_POOL_POLICY_INACTIVE", 409);
  const basisPoints = Number.isSafeInteger(policy.creatorPoolBasisPoints)
    ? policy.creatorPoolBasisPoints
    : Number.isFinite(policy.creatorPoolRate) && Number.isInteger(policy.creatorPoolRate * 10000)
      ? policy.creatorPoolRate * 10000
      : null;
  if (!Number.isSafeInteger(basisPoints) || basisPoints < 0 || basisPoints > 10000) {
    throw poolError("Creator pool basis points are not configured.", "CREATOR_POOL_POLICY_INVALID", 409);
  }
  const sourceWeights = policy.learningWeights?.toObject?.() || policy.learningWeights || {};
  const learningWeights = Object.fromEntries(WEIGHT_KEYS.map((key) => [key, asSafeInteger(sourceWeights[key], `learningWeights.${key}`)]));
  const version = asSafeInteger(policy.version, "policyVersion");
  if (version < 1) throw poolError("Creator pool policy version must be positive.", "CREATOR_POOL_POLICY_INVALID", 409);
  return Object.freeze({
    version,
    creatorPoolBasisPoints: basisPoints,
    revenueBasis: "captured_less_refunds_chargebacks",
    learningWeights: Object.freeze(learningWeights),
  });
};

const multiplyBasisPoints = (amountMinor, basisPoints) => fromBigInt(
  (BigInt(asSafeInteger(amountMinor, "amountMinor")) * BigInt(asSafeInteger(basisPoints, "basisPoints"))) / 10000n,
  "creatorPoolMinor"
);

const calculateQualifiedUnits = (metrics = {}, weights) => {
  const pairs = [
    [metrics.lessonCompletions, weights.lessonCompletion],
    [metrics.quizPasses, weights.quizPass],
    [metrics.exercisePasses, weights.exercisePass],
    [metrics.courseCompletions, weights.courseCompletion],
    [metrics.repeatMeaningfulLearnerDays, weights.repeatMeaningfulLearnerDay],
  ];
  const units = pairs.reduce((sum, [count, weight]) => sum + BigInt(asSafeInteger(count || 0, "engagementMetric")) * BigInt(weight), 0n);
  return fromBigInt(units, "qualifiedUnits");
};

const summarizeRevenue = (payments = [], { start, end }) => payments.reduce((summary, payment) => {
  const capturedAt = payment.capturedAt ? new Date(payment.capturedAt) : null;
  const createdAt = payment.createdAt ? new Date(payment.createdAt) : null;
  const captureInPeriod = capturedAt && capturedAt >= start && capturedAt < end;
  if (captureInPeriod) {
    const captured = asSafeInteger(payment.capturedAmountMinor || 0, "capturedAmountMinor");
    const refunded = Math.min(captured, asSafeInteger(payment.refundedAmountMinor || 0, "refundedAmountMinor"));
    const chargeback = Math.min(captured - refunded, asSafeInteger(payment.chargebackAmountMinor || 0, "chargebackAmountMinor"));
    summary.grossCapturedMinor = safeAdd(summary.grossCapturedMinor, captured, "grossCapturedMinor");
    summary.refundedMinor = safeAdd(summary.refundedMinor, refunded, "refundedMinor");
    summary.chargebackMinor = safeAdd(summary.chargebackMinor, chargeback, "chargebackMinor");
    summary.eligibleRevenueMinor = safeAdd(summary.eligibleRevenueMinor, Math.max(0, captured - refunded - chargeback), "eligibleRevenueMinor");
    return summary;
  }
  const createdInPeriod = createdAt && createdAt >= start && createdAt < end;
  if (!createdInPeriod || capturedAt) return summary;
  const attempted = asSafeInteger(payment.amountMinor || 0, "amountMinor");
  if (payment.status === "failed") summary.excludedFailedMinor = safeAdd(summary.excludedFailedMinor, attempted, "excludedFailedMinor");
  else summary.excludedUncapturedMinor = safeAdd(summary.excludedUncapturedMinor, attempted, "excludedUncapturedMinor");
  return summary;
}, {
  grossCapturedMinor: 0,
  refundedMinor: 0,
  chargebackMinor: 0,
  excludedFailedMinor: 0,
  excludedUncapturedMinor: 0,
  eligibleRevenueMinor: 0,
});

const allocateByLargestRemainder = ({ creatorPoolMinor, creators }) => {
  const pool = asSafeInteger(creatorPoolMinor, "creatorPoolMinor");
  const rows = creators
    .map((creator) => ({ creatorId: String(creator.creatorId), qualifiedUnits: asSafeInteger(creator.qualifiedUnits, "qualifiedUnits") }))
    .filter((creator) => creator.qualifiedUnits > 0)
    .sort((left, right) => left.creatorId.localeCompare(right.creatorId));
  const totalUnits = rows.reduce((sum, row) => sum + BigInt(row.qualifiedUnits), 0n);
  if (totalUnits === 0n || pool === 0) {
    return { allocations: rows.map((row) => ({ ...row, amountMinor: 0 })), totalQualifiedUnits: fromBigInt(totalUnits, "totalQualifiedUnits"), allocatedMinor: 0, unallocatedMinor: pool };
  }
  const poolBig = BigInt(pool);
  const computed = rows.map((row) => {
    const numerator = poolBig * BigInt(row.qualifiedUnits);
    return { ...row, amountMinor: fromBigInt(numerator / totalUnits, "allocationMinor"), remainder: numerator % totalUnits };
  });
  let allocated = computed.reduce((sum, row) => sum + row.amountMinor, 0);
  let remainderMinor = pool - allocated;
  const remainderOrder = [...computed].sort((left, right) => {
    if (left.remainder === right.remainder) return left.creatorId.localeCompare(right.creatorId);
    return left.remainder > right.remainder ? -1 : 1;
  });
  for (let index = 0; index < remainderMinor; index += 1) remainderOrder[index].amountMinor += 1;
  allocated = computed.reduce((sum, row) => sum + row.amountMinor, 0);
  return {
    allocations: computed.map(({ remainder, ...row }) => row).sort((left, right) => left.creatorId.localeCompare(right.creatorId)),
    totalQualifiedUnits: fromBigInt(totalUnits, "totalQualifiedUnits"),
    allocatedMinor: allocated,
    unallocatedMinor: pool - allocated,
  };
};

const buildCalculation = ({ payments, engagement, policy, period, currency }) => {
  const revenue = summarizeRevenue(payments, period);
  const creatorPoolMinor = multiplyBasisPoints(revenue.eligibleRevenueMinor, policy.creatorPoolBasisPoints);
  const creators = engagement.creators.map((creator) => ({
    creatorId: creator.creatorId,
    qualifiedUnits: calculateQualifiedUnits(creator.metrics, policy.learningWeights),
    courseContributions: creator.courses.map((course) => ({
      courseId: course.courseId,
      qualifiedUnits: calculateQualifiedUnits(course.metrics, policy.learningWeights),
    })).filter((course) => course.qualifiedUnits > 0).sort((left, right) => String(left.courseId).localeCompare(String(right.courseId))),
  }));
  const allocation = allocateByLargestRemainder({ creatorPoolMinor, creators });
  const contributions = new Map(creators.map((creator) => [String(creator.creatorId), creator.courseContributions]));
  const allocations = allocation.allocations.map((row) => ({ ...row, courseContributions: contributions.get(row.creatorId) || [] }));
  const input = {
    periodStart: period.start.toISOString(), periodEnd: period.end.toISOString(), currency,
    policy, revenue, engagement: creators,
  };
  return {
    ...revenue,
    creatorPoolMinor,
    totalQualifiedUnits: allocation.totalQualifiedUnits,
    allocatedMinor: allocation.allocatedMinor,
    unallocatedMinor: allocation.unallocatedMinor,
    allocations,
    inputHash: crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex"),
  };
};

const calculateCreatorPool = async ({ periodStart, periodEnd, currency, actorUserId }) => {
  if (!mongoose.isValidObjectId(actorUserId)) throw poolError("A valid calculating Admin is required.", "INVALID_CALCULATION_ACTOR", 401);
  const period = normalizePeriod({ periodStart, periodEnd });
  const normalizedCurrency = normalizeCurrency(currency);
  const activePolicy = await CreatorEconomyPolicy.findOne({ key: "global", active: true }).lean();
  const policy = policySnapshot(activePolicy);
  const identity = { periodStart: period.start, periodEnd: period.end, currency: normalizedCurrency, policyVersion: policy.version };
  const existing = await CreatorPoolCalculation.findOne(identity);
  if (existing) return existing;
  const [payments, engagement] = await Promise.all([
    Payment.find({
      currency: normalizedCurrency,
      purchaseType: { $ne: "course" },
      $or: [
        { capturedAt: { $gte: period.start, $lt: period.end } },
        { createdAt: { $gte: period.start, $lt: period.end } },
      ],
    }).select("amountMinor capturedAmountMinor refundedAmountMinor chargebackAmountMinor status capturedAt createdAt").lean(),
    reportLearningEngagement({ periodStart: period.start, periodEnd: period.end }),
  ]);
  const calculation = buildCalculation({ payments, engagement, policy, period, currency: normalizedCurrency });
  try {
    return await CreatorPoolCalculation.create({
      ...identity,
      policySnapshot: {
        creatorPoolBasisPoints: policy.creatorPoolBasisPoints,
        revenueBasis: policy.revenueBasis,
        learningWeights: policy.learningWeights,
      },
      ...calculation,
      status: "calculated",
      calculatedBy: actorUserId,
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    return CreatorPoolCalculation.findOne(identity);
  }
};

const finalizeCreatorPool = async ({ calculationId, actorUserId }) => {
  if (!mongoose.isValidObjectId(calculationId) || !mongoose.isValidObjectId(actorUserId)) {
    throw poolError("Calculation and Admin identities must be valid.", "INVALID_POOL_FINALIZATION");
  }
  const finalized = await CreatorPoolCalculation.findOneAndUpdate(
    { _id: calculationId, status: "calculated" },
    { $set: { status: "finalized", finalizedAt: new Date(), finalizedBy: actorUserId } },
    { new: true, runValidators: true }
  );
  if (finalized) return finalized;
  const existing = await CreatorPoolCalculation.findById(calculationId);
  if (!existing) throw poolError("Creator pool calculation was not found.", "CREATOR_POOL_NOT_FOUND", 404);
  if (existing.status === "finalized") return existing;
  throw poolError("Creator pool calculation cannot be finalized from its current state.", "INVALID_POOL_STATUS", 409);
};

const listCreatorPools = async ({ status, currency, limit = 24 } = {}) => CreatorPoolCalculation.find({
  ...(status ? { status } : {}),
  ...(currency ? { currency: normalizeCurrency(currency) } : {}),
}).sort({ periodEnd: -1, currency: 1 }).limit(Math.min(100, Math.max(1, Number(limit) || 24))).lean();

module.exports = {
  WEIGHT_KEYS,
  allocateByLargestRemainder,
  buildCalculation,
  calculateCreatorPool,
  calculateQualifiedUnits,
  finalizeCreatorPool,
  listCreatorPools,
  multiplyBasisPoints,
  normalizeCurrency,
  policySnapshot,
  summarizeRevenue,
};
