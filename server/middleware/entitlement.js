const AuditLogger = require("../audit/AuditLogger");
const entitlementService = require("../services/entitlementService");

const premiumRequired = (res, entitlement) => res.status(403).json({
  message: "MyJourney Premium is required for this experience.",
  code: "PREMIUM_REQUIRED",
  requiredEntitlement: entitlement,
});

const requireEntitlement = (entitlement) => async (req, res, next) => {
  try {
    const resolution = await entitlementService.resolveForUser(req.user?._id || req.user?.id);
    req.entitlementResolution = resolution;
    if (entitlementService.hasEntitlement(resolution, entitlement)) return next();
    AuditLogger.log({ entity: "premium_access", action: "denied", userId: req.user?._id || req.user?.id, req, details: `Premium entitlement denied: ${entitlement}` });
    return premiumRequired(res, entitlement);
  } catch (error) {
    // Protected resources fail closed when entitlement storage is unavailable.
    error.status = 503;
    error.code = "ENTITLEMENT_UNAVAILABLE";
    return next(error);
  }
};

module.exports = { premiumRequired, requireEntitlement };
