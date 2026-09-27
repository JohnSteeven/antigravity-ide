const fs = require("fs");
const path = require("path");

jest.mock("../models/CreatorEconomyPolicy", () => ({ findOne: jest.fn() }));
jest.mock("../models/CreatorPoolCalculation", () => ({
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
}));
jest.mock("../models/Payment", () => ({ find: jest.fn() }));
jest.mock("../creators/learningEngagementService", () => ({
  normalizePeriod: jest.requireActual("../creators/learningEngagementService").normalizePeriod,
  reportLearningEngagement: jest.fn(),
}));

const CreatorEconomyPolicy = require("../models/CreatorEconomyPolicy");
const CreatorPoolCalculation = require("../models/CreatorPoolCalculation");
const Payment = require("../models/Payment");
const learningEngagement = require("../creators/learningEngagementService");
const {
  allocateByLargestRemainder,
  buildCalculation,
  calculateCreatorPool,
  finalizeCreatorPool,
  multiplyBasisPoints,
  policySnapshot,
  summarizeRevenue,
} = require("../creators/creatorPoolService");

const period = { start: new Date("2026-09-01T00:00:00.000Z"), end: new Date("2026-10-01T00:00:00.000Z") };
const weights = { lessonCompletion: 1, quizPass: 1, exercisePass: 1, courseCompletion: 4, repeatMeaningfulLearnerDay: 1 };
const policy = { version: 3, creatorPoolBasisPoints: 2500, revenueBasis: "captured_less_refunds_chargebacks", learningWeights: weights };
const metrics = (overrides = {}) => ({
  lessonCompletions: 0, quizPasses: 0, exercisePasses: 0, courseCompletions: 0, repeatMeaningfulLearnerDays: 0, ...overrides,
});
const engagement = (creators = []) => ({ creators });
const creator = (creatorId, creatorMetrics, courseId = `${creatorId}-course`) => ({
  creatorId,
  metrics: metrics(creatorMetrics),
  courses: [{ courseId, metrics: metrics(creatorMetrics) }],
});

describe("Phase 16 deterministic Creator pool calculation", () => {
  beforeEach(() => jest.clearAllMocks());

  test("revenue separates captures, refunds, chargebacks, failed, and uncaptured attempts", () => {
    const summary = summarizeRevenue([
      { status: "partially_refunded", amountMinor: 1000, capturedAmountMinor: 1000, refundedAmountMinor: 200, chargebackAmountMinor: 100, capturedAt: new Date("2026-09-10T00:00:00Z"), createdAt: new Date("2026-09-09T00:00:00Z") },
      { status: "failed", amountMinor: 500, capturedAmountMinor: 0, createdAt: new Date("2026-09-11T00:00:00Z") },
      { status: "pending", amountMinor: 300, capturedAmountMinor: 0, createdAt: new Date("2026-09-12T00:00:00Z") },
      { status: "captured", amountMinor: 900, capturedAmountMinor: 900, capturedAt: period.end, createdAt: new Date("2026-09-30T00:00:00Z") },
    ], period);
    expect(summary).toEqual({
      grossCapturedMinor: 1000, refundedMinor: 200, chargebackMinor: 100,
      excludedFailedMinor: 500, excludedUncapturedMinor: 300, eligibleRevenueMinor: 700,
    });
    expect(multiplyBasisPoints(summary.eligibleRevenueMinor, 2500)).toBe(175);
  });

  test("zero revenue and zero engagement remain explicit without invented allocation", () => {
    const zeroRevenue = buildCalculation({
      payments: [], engagement: engagement([creator("creator-a", { lessonCompletions: 2 })]), policy, period, currency: "INR",
    });
    expect(zeroRevenue).toMatchObject({ eligibleRevenueMinor: 0, creatorPoolMinor: 0, allocatedMinor: 0, unallocatedMinor: 0 });

    const zeroEngagement = buildCalculation({
      payments: [{ status: "captured", capturedAmountMinor: 1000, capturedAt: new Date("2026-09-10T00:00:00Z") }],
      engagement: engagement([]), policy, period, currency: "INR",
    });
    expect(zeroEngagement).toMatchObject({ eligibleRevenueMinor: 1000, creatorPoolMinor: 250, allocatedMinor: 0, unallocatedMinor: 250 });
  });

  test("single and multiple Creator allocation uses deterministic largest remainders", () => {
    expect(allocateByLargestRemainder({ creatorPoolMinor: 99, creators: [{ creatorId: "only", qualifiedUnits: 7 }] }))
      .toMatchObject({ allocations: [{ creatorId: "only", qualifiedUnits: 7, amountMinor: 99 }], allocatedMinor: 99, unallocatedMinor: 0 });
    const rounded = allocateByLargestRemainder({
      creatorPoolMinor: 10,
      creators: [
        { creatorId: "creator-c", qualifiedUnits: 1 },
        { creatorId: "creator-a", qualifiedUnits: 1 },
        { creatorId: "creator-b", qualifiedUnits: 1 },
      ],
    });
    expect(rounded.allocations).toEqual([
      { creatorId: "creator-a", qualifiedUnits: 1, amountMinor: 4 },
      { creatorId: "creator-b", qualifiedUnits: 1, amountMinor: 3 },
      { creatorId: "creator-c", qualifiedUnits: 1, amountMinor: 3 },
    ]);
    expect(rounded.allocatedMinor).toBe(10);
    expect(rounded.allocatedMinor + rounded.unallocatedMinor).toBe(10);
  });

  test("identical period, revenue, policy, and engagement produce an identical snapshot hash", () => {
    const input = {
      payments: [{ status: "captured", capturedAmountMinor: 101, capturedAt: new Date("2026-09-10T00:00:00Z") }],
      engagement: engagement([creator("creator-b", { courseCompletions: 1 }), creator("creator-a", { lessonCompletions: 2 })]),
      policy, period, currency: "USD",
    };
    expect(buildCalculation(input)).toEqual(buildCalculation(input));
  });

  test("service derives inputs from Premium Payments and Phase 15, then reuses the period snapshot", async () => {
    const activePolicy = { active: true, version: 3, creatorPoolBasisPoints: 2500, learningWeights: weights };
    CreatorEconomyPolicy.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(activePolicy) });
    CreatorPoolCalculation.findOne.mockResolvedValueOnce(null);
    Payment.find.mockReturnValue({ select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }) });
    learningEngagement.reportLearningEngagement.mockResolvedValue(engagement([]));
    CreatorPoolCalculation.create.mockImplementation(async (value) => ({ _id: "507f1f77bcf86cd799439099", ...value }));
    const input = {
      periodStart: period.start, periodEnd: period.end, currency: "inr",
      actorUserId: "507f1f77bcf86cd799439011", eligibleRevenueMinor: 999999, allocations: [{ amountMinor: 999999 }],
    };
    const result = await calculateCreatorPool(input);
    expect(result).toMatchObject({ currency: "INR", eligibleRevenueMinor: 0, allocatedMinor: 0 });
    expect(Payment.find).toHaveBeenCalledWith(expect.objectContaining({
      currency: "INR", purchaseType: { $ne: "course" },
      $or: expect.arrayContaining([{ capturedAt: { $gte: period.start, $lt: period.end } }]),
    }));
    expect(learningEngagement.reportLearningEngagement).toHaveBeenCalledWith({ periodStart: period.start, periodEnd: period.end });

    const stored = { _id: "507f1f77bcf86cd799439099", status: "finalized", inputHash: result.inputHash };
    CreatorPoolCalculation.findOne.mockResolvedValueOnce(stored);
    await expect(calculateCreatorPool(input)).resolves.toBe(stored);
    expect(Payment.find).toHaveBeenCalledTimes(1);
  });

  test("finalization only changes accounting state and never calls a payout provider", async () => {
    CreatorPoolCalculation.findOneAndUpdate.mockResolvedValue({ _id: "507f1f77bcf86cd799439099", status: "finalized" });
    await expect(finalizeCreatorPool({ calculationId: "507f1f77bcf86cd799439099", actorUserId: "507f1f77bcf86cd799439011" }))
      .resolves.toMatchObject({ status: "finalized" });
    const serviceSource = fs.readFileSync(path.join(__dirname, "..", "creators", "creatorPoolService.js"), "utf8");
    expect(serviceSource).not.toMatch(/payoutProvider|transferFunds|mark.*paid/i);
  });

  test("pool mutation routes are Admin-only and controllers never accept financial totals", () => {
    const routes = fs.readFileSync(path.join(__dirname, "..", "routes", "creatorRoutes.js"), "utf8");
    const controllers = fs.readFileSync(path.join(__dirname, "..", "creators", "controllers.js"), "utf8");
    expect(routes).toContain('router.post("/admin/pool-calculations", authenticate, requireAdmin, controllers.calculateCreatorPool)');
    expect(routes).toContain('router.post("/admin/pool-calculations/:id/finalize", authenticate, requireAdmin, controllers.finalizeCreatorPool)');
    const handler = controllers.slice(controllers.indexOf("exports.calculateCreatorPool"), controllers.indexOf("exports.finalizeCreatorPool"));
    expect(handler).not.toMatch(/req\.body\?\.(eligibleRevenueMinor|creatorPoolMinor|allocations|amountMinor)/);
  });

  test("policy configuration is explicit, versioned, integer-weighted, and centralized", () => {
    expect(policySnapshot({ active: true, version: 7, creatorPoolBasisPoints: 3000, learningWeights: weights }))
      .toEqual({ version: 7, creatorPoolBasisPoints: 3000, revenueBasis: "captured_less_refunds_chargebacks", learningWeights: weights });
    expect(() => policySnapshot({ active: true, version: 1, creatorPoolBasisPoints: null, learningWeights: weights }))
      .toThrow("basis points");
  });
});
