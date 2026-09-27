const mongoose = require("mongoose");
const CreatorEarningPeriod = require("../models/CreatorEarningPeriod");
const CreatorLedgerEntry = require("../models/CreatorLedgerEntry");

const objectId = () => new mongoose.Types.ObjectId();

describe("Creator earnings models", () => {
  test("earning records preserve integer minor units, source audit, and period/currency uniqueness", async () => {
    const earning = new CreatorEarningPeriod({
      creatorId: objectId(),
      sourceCalculationId: objectId(),
      sourceInputHash: "a".repeat(64),
      periodStart: new Date("2026-09-01T00:00:00.000Z"),
      periodEnd: new Date("2026-10-01T00:00:00.000Z"),
      policyVersion: 2,
      qualifiedUnits: 3,
      status: "finalized",
      currency: "INR",
      premiumRevenueMinor: 1000,
      creatorPoolMinor: 250,
      finalizedAmountMinor: 250,
      finalizedAt: new Date("2026-10-02T00:00:00.000Z"),
      finalizedBy: objectId(),
      generatedBy: objectId(),
    });
    await expect(earning.validate()).resolves.toBeUndefined();
    earning.finalizedAmountMinor = 1.5;
    await expect(earning.validate()).rejects.toThrow("safe integer in minor units");

    const indexes = CreatorEarningPeriod.schema.indexes();
    expect(indexes.find(([, options]) => options.name === "creator_earning_period_currency_unique")?.[1].unique).toBe(true);
    expect(indexes.find(([, options]) => options.name === "creator_earning_source_unique")?.[1].unique).toBe(true);
  });

  test("ledger entries are immutable, source-linked, and cannot represent fractional money", async () => {
    const ledger = new CreatorLedgerEntry({
      creatorId: objectId(),
      earningPeriodId: objectId(),
      sourceCalculationId: objectId(),
      sourceInputHash: "b".repeat(64),
      periodStart: new Date("2026-09-01T00:00:00.000Z"),
      periodEnd: new Date("2026-10-01T00:00:00.000Z"),
      type: "engagement_earning",
      amountMinor: 101,
      currency: "USD",
      status: "finalized",
      reference: "creator-pool:test:creator:test",
      reason: "Finalized test allocation.",
      createdBy: objectId(),
    });
    await expect(ledger.validate()).resolves.toBeUndefined();
    ledger.amountMinor = 1.5;
    await expect(ledger.validate()).rejects.toThrow("safe integer in minor units");
    expect(CreatorLedgerEntry.schema.path("amountMinor").options.immutable).toBe(true);
    expect(CreatorLedgerEntry.schema.path("status").options.immutable).toBe(true);
  });
});
