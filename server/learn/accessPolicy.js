const entitlementService = require("../services/entitlementService");
const { hasActiveCoursePurchase } = require("../services/coursePurchaseService");
const { ENTITLEMENTS } = require("../premium/catalog");

const resolveLearnAccess = async ({ userId = null, courseId = null, accessLevel = "free", owner = false, admin = false, monetizationType = null }) => {
  if (owner || admin) return { allowed: true, reason: owner ? "owner_preview" : "admin" };
  // Standalone purchases deliberately bypass the Premium resolver, including
  // its QA override. Only an active purchase for this exact buyer/course wins.
  if (monetizationType === "STANDALONE_PAID") {
    if (!userId || !courseId) return { allowed: false, reason: "standalone_purchase_required" };
    const owned = await hasActiveCoursePurchase(userId, courseId);
    return { allowed: owned, reason: owned ? "standalone_purchase" : "standalone_purchase_required" };
  }
  if (accessLevel === "free") return { allowed: true, reason: "free" };
  if (!userId) return { allowed: false, reason: "premium_required" };
  const resolution = await entitlementService.resolveForUser(userId);
  return {
    allowed: entitlementService.hasEntitlement(resolution, ENTITLEMENTS.PREMIUM_LEARN),
    reason: entitlementService.hasEntitlement(resolution, ENTITLEMENTS.PREMIUM_LEARN) ? (resolution.accessReason || "premium") : "premium_required",
    resolution,
  };
};

const requireLearnContentAccess = (optionsResolver) => async (req, res, next) => {
  try {
    const access = await resolveLearnAccess(await optionsResolver(req));
    if (!access.allowed) {
      const standalone = access.reason === "standalone_purchase_required";
      return res.status(403).json({
        message: standalone ? "Purchase this Course to continue." : "MyJourney Premium is required for this learning experience.",
        code: standalone ? "COURSE_PURCHASE_REQUIRED" : "PREMIUM_REQUIRED",
        ...(standalone ? {} : { requiredEntitlement: ENTITLEMENTS.PREMIUM_LEARN }),
      });
    }
    req.learnAccess = access;
    return next();
  } catch (error) { return next(error); }
};

module.exports = { requireLearnContentAccess, resolveLearnAccess };
