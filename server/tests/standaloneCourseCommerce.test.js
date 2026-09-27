jest.mock("../services/entitlementService", () => ({
  resolveForUser: jest.fn(),
  hasEntitlement: jest.fn(),
}));
jest.mock("../services/coursePurchaseService", () => ({
  hasActiveCoursePurchase: jest.fn(),
}));

const entitlementService = require("../services/entitlementService");
const coursePurchaseService = require("../services/coursePurchaseService");
const { resolveLearnAccess } = require("../learn/accessPolicy");

describe("standalone Course access policy", () => {
  beforeEach(() => jest.clearAllMocks());

  test("Free Courses remain accessible without a purchase", async () => {
    await expect(resolveLearnAccess({ accessLevel: "free", monetizationType: "FREE" }))
      .resolves.toMatchObject({ allowed: true, reason: "free" });
  });

  test("Premium and QA entitlement paths never unlock an unpaid standalone Course", async () => {
    coursePurchaseService.hasActiveCoursePurchase.mockResolvedValue(false);
    entitlementService.resolveForUser.mockResolvedValue({ plan: "premium", accessReason: "qa_override" });
    entitlementService.hasEntitlement.mockReturnValue(true);

    await expect(resolveLearnAccess({
      userId: "premium-or-qa-user", courseId: "course-a", accessLevel: "premium", monetizationType: "STANDALONE_PAID",
    })).resolves.toEqual({ allowed: false, reason: "standalone_purchase_required" });
    expect(entitlementService.resolveForUser).not.toHaveBeenCalled();
    expect(coursePurchaseService.hasActiveCoursePurchase).toHaveBeenCalledWith("premium-or-qa-user", "course-a");
  });

  test("a successful purchase unlocks only its exact Course", async () => {
    coursePurchaseService.hasActiveCoursePurchase.mockImplementation(async (_userId, courseId) => courseId === "course-a");
    await expect(resolveLearnAccess({ userId: "buyer", courseId: "course-a", monetizationType: "STANDALONE_PAID" }))
      .resolves.toEqual({ allowed: true, reason: "standalone_purchase" });
    await expect(resolveLearnAccess({ userId: "buyer", courseId: "course-b", monetizationType: "STANDALONE_PAID" }))
      .resolves.toEqual({ allowed: false, reason: "standalone_purchase_required" });
  });

  test("creator ownership and Admin review retain explicit preview access", async () => {
    await expect(resolveLearnAccess({ owner: true, monetizationType: "STANDALONE_PAID" }))
      .resolves.toMatchObject({ allowed: true, reason: "owner_preview" });
    await expect(resolveLearnAccess({ admin: true, monetizationType: "STANDALONE_PAID" }))
      .resolves.toMatchObject({ allowed: true, reason: "admin" });
    expect(coursePurchaseService.hasActiveCoursePurchase).not.toHaveBeenCalled();
  });
});
