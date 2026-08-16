const entitlementService = require("../../services/entitlementService");
const { AgentError, errorCodes } = require("../errors");
const featureFlags = require("../featureFlags");

const PERMISSIONS = Object.freeze({
  READ: "READ",
  LOW_RISK_WRITE: "LOW_RISK_WRITE",
  CONFIRM_REQUIRED: "CONFIRM_REQUIRED",
  SENSITIVE: "SENSITIVE",
});

const authorizeTool = async (tool, context = {}) => {
  const userId = context.user?._id || context.user?.id || context.userId || null;
  if (tool.authRequired && !userId) {
    throw new AgentError(errorCodes.AUTH_REQUIRED, "Sign in to use this MyJourney capability.", 401, { tool: tool.key });
  }

  let entitlementResolution = context.entitlementResolution || null;
  if (tool.requiredEntitlements?.length) {
    entitlementResolution = entitlementResolution || await entitlementService.resolveForUser(userId);
    const missing = tool.requiredEntitlements.filter((entitlement) => !entitlementService.hasEntitlement(entitlementResolution, entitlement));
    if (missing.length) {
      throw new AgentError(
        errorCodes.ENTITLEMENT_REQUIRED,
        "MyJourney Premium is required for this Agent capability.",
        403,
        { tool: tool.key, requiredEntitlements: missing }
      );
    }
  }

  if (tool.permissionLevel === PERMISSIONS.SENSITIVE) {
    throw new AgentError(errorCodes.PERMISSION_DENIED, "Sensitive Agent actions are disabled.", 403, { tool: tool.key });
  }
  if (tool.permissionLevel === PERMISSIONS.LOW_RISK_WRITE) {
    const enabled = await featureFlags.isEnabled("agent_write_tools_enabled", { user: context.user });
    if (!enabled) {
      throw new AgentError(errorCodes.PERMISSION_DENIED, "Agent write tools are currently disabled.", 403, { tool: tool.key });
    }
  }

  return {
    allowed: true,
    requiresConfirmation: tool.permissionLevel === PERMISSIONS.CONFIRM_REQUIRED,
    entitlementResolution,
    userId,
  };
};

module.exports = { PERMISSIONS, authorizeTool };
