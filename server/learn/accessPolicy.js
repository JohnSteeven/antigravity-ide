const entitlementService = require("../services/entitlementService");
const { ENTITLEMENTS } = require("../premium/catalog");

const resolveLearnAccess = async ({ userId = null, accessLevel = "free", owner = false, admin = false }) => {
  if (owner || admin || accessLevel === "free") return { allowed: true, reason: owner ? "owner_preview" : admin ? "admin" : "free" };
  if (!userId) return { allowed: false, reason: "premium_required" };
  const resolution = await entitlementService.resolveForUser(userId);
  return {
    allowed: entitlementService.hasEntitlement(resolution, ENTITLEMENTS.PREMIUM_LEARN),
    reason: resolution.accessReason || "premium_required",
    resolution,
  };
};

const requireLearnContentAccess = (optionsResolver) => async (req, res, next) => {
  try {
    const access = await resolveLearnAccess(await optionsResolver(req));
    if (!access.allowed) {
      return res.status(403).json({
        message: "MyJourney Premium is required for this learning experience.",
        code: "PREMIUM_REQUIRED",
        requiredEntitlement: ENTITLEMENTS.PREMIUM_LEARN,
      });
    }
    req.learnAccess = access;
    return next();
  } catch (error) { return next(error); }
};

module.exports = { requireLearnContentAccess, resolveLearnAccess };
