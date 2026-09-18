jest.mock("../models/ReaderMembership", () => ({
  findOneAndUpdate: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
}));

const ReaderMembership = require("../models/ReaderMembership");
const { transitionSubscription } = require("../services/subscriptionService");

const sessionQuery = (value) => ({ session: jest.fn().mockResolvedValue(value) });

describe("subscription transition foundation", () => {
  beforeEach(() => jest.clearAllMocks());

  test("atomically activates an incomplete Subscription using allowlisted provider terms", async () => {
    ReaderMembership.findOneAndUpdate.mockResolvedValue({ _id: "sub-1", billingStatus: "active" });
    const occurredAt = new Date("2026-09-01T00:00:00.000Z");
    await expect(transitionSubscription({
      subscriptionId: "sub-1",
      nextStatus: "active",
      providerEventId: "evt_active",
      occurredAt,
      updates: { currentPeriodEnd: new Date("2026-10-01T00:00:00.000Z"), arbitraryAdmin: true },
    })).resolves.toMatchObject({ billingStatus: "active" });
    const update = ReaderMembership.findOneAndUpdate.mock.calls[0][1].$set;
    expect(update).toMatchObject({ billingStatus: "active", latestProviderEventId: "evt_active", latestProviderEventAt: occurredAt });
    expect(update).not.toHaveProperty("arbitraryAdmin");
  });

  test("rejects an older delayed event instead of rolling subscription state back", async () => {
    ReaderMembership.findOneAndUpdate.mockResolvedValue(null);
    ReaderMembership.findById.mockReturnValue(sessionQuery({
      _id: "sub-1",
      billingStatus: "active",
      latestProviderEventId: "evt_new",
      latestProviderEventAt: new Date("2026-09-10T00:00:00.000Z"),
    }));
    await expect(transitionSubscription({
      subscriptionId: "sub-1",
      nextStatus: "past_due",
      providerEventId: "evt_old",
      occurredAt: new Date("2026-09-09T00:00:00.000Z"),
    })).rejects.toMatchObject({ code: "STALE_SUBSCRIPTION_EVENT" });
  });

  test("treats a repeated provider event as idempotent", async () => {
    ReaderMembership.findOneAndUpdate.mockResolvedValue(null);
    ReaderMembership.findById.mockReturnValue(sessionQuery({
      _id: "sub-1", billingStatus: "active", latestProviderEventId: "evt_repeat",
    }));
    await expect(transitionSubscription({
      subscriptionId: "sub-1", nextStatus: "active", providerEventId: "evt_repeat",
    })).resolves.toMatchObject({ billingStatus: "active" });
  });

  test("equal-time competing events cannot silently overwrite subscription state", async () => {
    const occurredAt = new Date("2026-09-10T00:00:00Z");
    ReaderMembership.findOneAndUpdate.mockResolvedValue(null);
    ReaderMembership.findById.mockReturnValue(sessionQuery({
      _id: "sub-1", billingStatus: "active", latestProviderEventAt: occurredAt, latestProviderEventId: "evt_first",
    }));
    await expect(transitionSubscription({ subscriptionId: "sub-1", nextStatus: "canceled",
      providerEventId: "evt_competing", occurredAt })).rejects.toMatchObject({ code: "INVALID_SUBSCRIPTION_TRANSITION" });
    expect(ReaderMembership.findOneAndUpdate.mock.calls[0][0].$or).toContainEqual({ latestProviderEventAt: { $lt: occurredAt } });
  });
});
