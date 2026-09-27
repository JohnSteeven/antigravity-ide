jest.mock("../../services/coursePurchaseService", () => ({ hasActiveCoursePurchase: jest.fn() }));
jest.mock("../../services/entitlementService", () => ({
  resolveForUser: jest.fn(),
  hasEntitlement: jest.fn((result, key) => Boolean(result?.entitlements?.[key])),
}));
const { hasActiveCoursePurchase } = require("../../services/coursePurchaseService");
const entitlementService = require("../../services/entitlementService");
const { resolveLearnAccess } = require("../../learn/accessPolicy");
const { ENTITLEMENTS } = require("../../premium/catalog");

const userId = "65a000000000000000000001";
const courseA = "65c000000000000000000001";
const courseB = "65c000000000000000000002";

beforeEach(() => {
  jest.clearAllMocks();
  entitlementService.resolveForUser.mockResolvedValue({ accessReason: "qa_override", entitlements: { [ENTITLEMENTS.PREMIUM_LEARN]: true } });
  hasActiveCoursePurchase.mockImplementation(async (_user, courseId) => courseId === courseA);
});

test("Premium and QA override unlock Premium-included resources", async () => {
  expect((await resolveLearnAccess({ userId, courseId: courseB, accessLevel: "premium", monetizationType: "PREMIUM_INCLUDED" })).allowed).toBe(true);
});

test("QA Premium cannot unlock an unpurchased standalone Course resource", async () => {
  const access = await resolveLearnAccess({ userId, courseId: courseB, accessLevel: "premium", monetizationType: "STANDALONE_PAID" });
  expect(access).toMatchObject({ allowed: false, reason: "standalone_purchase_required" });
  expect(entitlementService.resolveForUser).not.toHaveBeenCalled();
  expect(hasActiveCoursePurchase).toHaveBeenCalledWith(userId, courseB);
});

test("a purchase unlocks only the exact standalone Course resource", async () => {
  expect((await resolveLearnAccess({ userId, courseId: courseA, accessLevel: "premium", monetizationType: "STANDALONE_PAID" })).allowed).toBe(true);
  expect((await resolveLearnAccess({ userId, courseId: courseB, accessLevel: "premium", monetizationType: "STANDALONE_PAID" })).allowed).toBe(false);
});
