const fs = require("fs");
const path = require("path");

jest.mock("../models/CreatorAnalyticsAggregate", () => ({ aggregate: jest.fn() }));
jest.mock("../models/CreatorEconomyPolicy", () => ({ findOne: jest.fn() }));
jest.mock("../models/CreatorEarningPeriod", () => ({ create: jest.fn(), find: jest.fn(), findOne: jest.fn(), countDocuments: jest.fn() }));
jest.mock("../models/CreatorLedgerEntry", () => ({ create: jest.fn(), findOne: jest.fn(), countDocuments: jest.fn() }));
jest.mock("../models/CreatorPoolCalculation", () => ({ findById: jest.fn() }));

const CreatorAnalyticsAggregate = require("../models/CreatorAnalyticsAggregate");
const CreatorEconomyPolicy = require("../models/CreatorEconomyPolicy");
const CreatorEarningPeriod = require("../models/CreatorEarningPeriod");
const CreatorLedgerEntry = require("../models/CreatorLedgerEntry");
const CreatorPoolCalculation = require("../models/CreatorPoolCalculation");
const { generateEarningsFromPool, getCreatorEconomySummary, listAdminEarnings, summarizeByCurrency } = require("../creators/economyService");

const ids = {
  calculation: "507f1f77bcf86cd799439001",
  admin: "507f1f77bcf86cd799439002",
  creatorA: "507f1f77bcf86cd799439003",
  creatorB: "507f1f77bcf86cd799439004",
  periodA: "507f1f77bcf86cd799439005",
  courseA: "507f1f77bcf86cd799439006",
};
const periodStart = new Date("2026-09-01T00:00:00.000Z");
const periodEnd = new Date("2026-10-01T00:00:00.000Z");
const calculation = (overrides = {}) => ({
  _id: ids.calculation,
  status: "finalized",
  finalizedAt: new Date("2026-10-02T00:00:00.000Z"),
  finalizedBy: ids.admin,
  periodStart,
  periodEnd,
  currency: "INR",
  policyVersion: 4,
  inputHash: "a".repeat(64),
  eligibleRevenueMinor: 10000,
  creatorPoolMinor: 2500,
  allocatedMinor: 2500,
  allocations: [{ creatorId: ids.creatorA, qualifiedUnits: 7, amountMinor: 2500, courseContributions: [{ courseId: ids.courseA, qualifiedUnits: 7 }] }],
  ...overrides,
});
const findChain = (items) => ({
  sort: jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue(items),
    limit: jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(items) }),
    }),
  }),
});

describe("Phase 17 Creator earnings accounting", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    CreatorAnalyticsAggregate.aggregate.mockResolvedValue([]);
    CreatorEconomyPolicy.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue({ active: true }) });
    CreatorLedgerEntry.countDocuments.mockResolvedValue(0);
  });

  test("maps a finalized Phase 16 allocation to one finalized period and immutable ledger entry", async () => {
    CreatorPoolCalculation.findById.mockResolvedValue(calculation());
    CreatorEarningPeriod.findOne.mockResolvedValue(null);
    CreatorEarningPeriod.create.mockImplementation(async (value) => ({ _id: ids.periodA, ...value }));
    CreatorLedgerEntry.findOne.mockResolvedValue(null);
    CreatorLedgerEntry.create.mockImplementation(async (value) => ({ _id: "507f1f77bcf86cd799439007", ...value }));

    const result = await generateEarningsFromPool({
      calculationId: ids.calculation,
      actorUserId: ids.admin,
      amountMinor: 999999,
      status: "paid",
    });

    expect(result).toMatchObject({ allocatedMinor: 2500, allocationCount: 1, payoutCreated: false, status: "finalized" });
    expect(CreatorEarningPeriod.create).toHaveBeenCalledWith(expect.objectContaining({
      creatorId: ids.creatorA,
      sourceCalculationId: ids.calculation,
      finalizedAmountMinor: 2500,
      qualifiedUnits: 7,
      currency: "INR",
      status: "finalized",
      courseContributions: [{ courseId: ids.courseA, qualifiedUnits: 7 }],
      finalizedBy: ids.admin,
      generatedBy: ids.admin,
    }));
    expect(CreatorLedgerEntry.create).toHaveBeenCalledWith(expect.objectContaining({
      amountMinor: 2500,
      currency: "INR",
      status: "finalized",
      type: "engagement_earning",
      reference: `creator-pool:${ids.calculation}:creator:${ids.creatorA}`,
    }));
    expect(CreatorLedgerEntry.create).not.toHaveBeenCalledWith(expect.objectContaining({ status: "paid" }));
  });

  test("generation is idempotent and reuses matching source records", async () => {
    const pool = calculation();
    const earning = {
      _id: ids.periodA,
      creatorId: ids.creatorA,
      sourceCalculationId: ids.calculation,
      sourceInputHash: pool.inputHash,
      finalizedAmountMinor: 2500,
      currency: "INR",
      status: "finalized",
    };
    const ledger = { earningPeriodId: ids.periodA, amountMinor: 2500, currency: "INR", status: "finalized" };
    CreatorPoolCalculation.findById.mockResolvedValue(pool);
    CreatorEarningPeriod.findOne.mockResolvedValue(earning);
    CreatorLedgerEntry.findOne.mockResolvedValue(ledger);

    await expect(generateEarningsFromPool({ calculationId: ids.calculation, actorUserId: ids.admin }))
      .resolves.toMatchObject({ allocatedMinor: 2500, allocationCount: 1 });
    expect(CreatorEarningPeriod.create).not.toHaveBeenCalled();
    expect(CreatorLedgerEntry.create).not.toHaveBeenCalled();
  });

  test("unfinalized pools, duplicate-period conflicts, and mismatched totals fail closed", async () => {
    CreatorPoolCalculation.findById.mockResolvedValueOnce(calculation({ status: "calculated", finalizedAt: null }));
    await expect(generateEarningsFromPool({ calculationId: ids.calculation, actorUserId: ids.admin })).rejects.toMatchObject({ code: "CREATOR_POOL_NOT_FINALIZED" });

    CreatorPoolCalculation.findById.mockResolvedValueOnce(calculation({ allocatedMinor: 2499 }));
    await expect(generateEarningsFromPool({ calculationId: ids.calculation, actorUserId: ids.admin })).rejects.toMatchObject({ code: "POOL_ALLOCATION_MISMATCH" });

    CreatorPoolCalculation.findById.mockResolvedValueOnce(calculation());
    CreatorEarningPeriod.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
      sourceCalculationId: ids.creatorB,
      sourceInputHash: "b".repeat(64),
      finalizedAmountMinor: 1,
      currency: "INR",
    });
    await expect(generateEarningsFromPool({ calculationId: ids.calculation, actorUserId: ids.admin })).rejects.toMatchObject({ code: "EARNING_PERIOD_CONFLICT" });
  });

  test("Creator summary is isolated to the middleware-supplied Creator and preserves currencies/minor units", async () => {
    const periods = [
      { _id: ids.periodA, creatorId: ids.creatorA, sourceCalculationId: ids.calculation, periodStart, periodEnd, currency: "INR", finalizedAmountMinor: 101, status: "finalized", qualifiedUnits: 7, courseContributions: [], finalizedAt: periodEnd },
      { _id: "507f1f77bcf86cd799439008", creatorId: ids.creatorA, sourceCalculationId: "507f1f77bcf86cd799439009", periodStart, periodEnd, currency: "USD", finalizedAmountMinor: 99, status: "available", qualifiedUnits: 2, courseContributions: [], finalizedAt: periodEnd },
    ];
    CreatorEarningPeriod.find.mockReturnValue(findChain(periods));
    CreatorLedgerEntry.countDocuments.mockResolvedValue(2);

    const summary = await getCreatorEconomySummary(ids.creatorA);
    expect(CreatorEarningPeriod.find).toHaveBeenCalledWith(expect.objectContaining({ creatorId: ids.creatorA }));
    expect(summary.totalsByCurrency).toEqual([
      { currency: "INR", pendingMinor: 0, finalizedMinor: 101, availableMinor: 0, paidMinor: 0 },
      { currency: "USD", pendingMinor: 0, finalizedMinor: 99, availableMinor: 99, paidMinor: 0 },
    ]);
    expect(summary.periods.every((row) => row.creatorId === undefined)).toBe(true);
    expect(summary.payoutAvailable).toBe(false);
    expect(summary.payoutStatus).toBe("not_configured");
  });

  test("totals never combine currencies or use floating-point conversion", () => {
    expect(summarizeByCurrency([
      { currency: "INR", finalizedAmountMinor: 1, status: "finalized" },
      { currency: "INR", finalizedAmountMinor: 2, status: "available" },
      { currency: "USD", finalizedAmountMinor: 3, status: "finalized" },
    ])).toEqual([
      { currency: "INR", pendingMinor: 0, finalizedMinor: 3, availableMinor: 2, paidMinor: 0 },
      { currency: "USD", pendingMinor: 0, finalizedMinor: 3, availableMinor: 0, paidMinor: 0 },
    ]);
  });

  test("Admin report filters period/Creator/status and routes provide no manual balance editor", async () => {
    CreatorEarningPeriod.find.mockReturnValue(findChain([]));
    CreatorEarningPeriod.countDocuments.mockResolvedValue(0);
    await expect(listAdminEarnings({ creatorId: ids.creatorA, currency: "inr", status: "finalized", periodStart, periodEnd }))
      .resolves.toEqual({ items: [], total: 0, limit: 50 });
    expect(CreatorEarningPeriod.find).toHaveBeenCalledWith(expect.objectContaining({
      creatorId: ids.creatorA,
      currency: "INR",
      status: "finalized",
      periodStart: { $gte: periodStart },
      periodEnd: { $lte: periodEnd },
    }));

    const routes = fs.readFileSync(path.join(__dirname, "..", "routes", "creatorRoutes.js"), "utf8");
    const controllers = fs.readFileSync(path.join(__dirname, "..", "creators", "controllers.js"), "utf8");
    expect(routes).toContain('router.post("/admin/pool-calculations/:id/earnings", authenticate, requireAdmin');
    expect(routes).toContain('router.get("/admin/earnings", authenticate, requireAdmin');
    expect(routes).not.toMatch(/earnings.*(patch|put)|(?:patch|put).*earnings/i);
    const handler = controllers.slice(controllers.indexOf("exports.generateCreatorEarnings"), controllers.indexOf("exports.listCreatorEarnings"));
    expect(handler).not.toMatch(/req\.body/);
  });

  test("Creator endpoint remains behind active Creator ownership middleware and no payout path exists", () => {
    const studioRoutes = fs.readFileSync(path.join(__dirname, "..", "routes", "creatorStudioRoutes.js"), "utf8");
    const service = fs.readFileSync(path.join(__dirname, "..", "creators", "economyService.js"), "utf8");
    expect(studioRoutes).toContain("router.use(authenticate, requireActiveCreator)");
    expect(studioRoutes).toContain('router.get("/earnings", controllers.earnings)');
    expect(service).not.toMatch(/payoutProvider|transferFunds|providerPayoutId|mark.*paid/i);
  });
});
