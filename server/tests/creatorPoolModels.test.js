const mongoose = require("mongoose");
const CreatorEconomyPolicy = require("../models/CreatorEconomyPolicy");
const CreatorPoolCalculation = require("../models/CreatorPoolCalculation");

const objectId = () => new mongoose.Types.ObjectId();

describe("Creator pool policy and snapshot models", () => {
  test("policy requires integer basis points and integer learning weights", async () => {
    const policy = new CreatorEconomyPolicy({
      active: true,
      version: 2,
      creatorPoolBasisPoints: 2500,
      learningWeights: { lessonCompletion: 1, quizPass: 1, exercisePass: 1, courseCompletion: 4, repeatMeaningfulLearnerDay: 1 },
    });
    await expect(policy.validate()).resolves.toBeUndefined();
    policy.creatorPoolBasisPoints = 2500.5;
    await expect(policy.validate()).rejects.toThrow("basis points must be an integer");
  });

  test("snapshot validates integer reconciliation and exposes unique period identity", async () => {
    const creatorId = objectId();
    const calculation = new CreatorPoolCalculation({
      periodStart: new Date("2026-09-01T00:00:00.000Z"),
      periodEnd: new Date("2026-10-01T00:00:00.000Z"),
      currency: "INR",
      policyVersion: 2,
      policySnapshot: {
        creatorPoolBasisPoints: 2500,
        revenueBasis: "captured_less_refunds_chargebacks",
        learningWeights: { lessonCompletion: 1, quizPass: 1, exercisePass: 1, courseCompletion: 4, repeatMeaningfulLearnerDay: 1 },
      },
      grossCapturedMinor: 1000,
      refundedMinor: 100,
      chargebackMinor: 0,
      excludedFailedMinor: 200,
      excludedUncapturedMinor: 50,
      eligibleRevenueMinor: 900,
      creatorPoolMinor: 225,
      totalQualifiedUnits: 3,
      allocatedMinor: 225,
      unallocatedMinor: 0,
      allocations: [{ creatorId, qualifiedUnits: 3, amountMinor: 225, courseContributions: [] }],
      inputHash: "a".repeat(64),
      calculatedBy: objectId(),
    });
    await expect(calculation.validate()).resolves.toBeUndefined();
    calculation.allocatedMinor = 226;
    await expect(calculation.validate()).rejects.toThrow("reconcile exactly");

    const indexes = CreatorPoolCalculation.schema.indexes();
    const unique = indexes.find(([, options]) => options.name === "creator_pool_period_currency_policy_unique")?.[1];
    expect(unique?.unique).toBe(true);
  });
});
