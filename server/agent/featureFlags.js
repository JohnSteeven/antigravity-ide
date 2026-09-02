const FeatureFlag = require("../models/FeatureFlag");

const CACHE_TTL_MS = 10000;
const cache = new Map();

const ENV_DEFAULTS = Object.freeze({
  agent_enabled: () => process.env.AGENT_ENABLED !== "false",
  agent_local_provider_enabled: () => process.env.AGENT_LOCAL_PROVIDER_ENABLED === "true",
  agent_write_tools_enabled: () => process.env.AGENT_WRITE_TOOLS_ENABLED === "true",
});

const roleFor = (user) => String(user?.role || "public").toLowerCase();

const evaluateDocument = (flag, context = {}) => {
  if (!flag) return null;
  const now = new Date();
  const environment = process.env.NODE_ENV || "development";
  const role = roleFor(context.user);
  if (["disabled", "maintenance"].includes(flag.status)) return false;
  if (flag.allowedEnvironments?.length && !flag.allowedEnvironments.includes(environment)) return false;
  if (flag.startDate && now < flag.startDate) return false;
  if (flag.endDate && now > flag.endDate) return false;
  if (["private", "beta"].includes(flag.status) && flag.allowedRoles?.length && !flag.allowedRoles.map((item) => item.toLowerCase()).includes(role)) return false;
  return true;
};

const isEnabled = async (key, context = {}) => {
  const normalized = String(key || "").toLowerCase();
  const defaultValue = ENV_DEFAULTS[normalized] ? ENV_DEFAULTS[normalized]() : false;
  const cached = cache.get(normalized);
  if (cached && cached.expiresAt > Date.now()) return cached.value;
  let flag = null;
  try {
    flag = await FeatureFlag.findOne({ key: normalized }).lean();
  } catch (error) {
    return defaultValue;
  }
  const evaluated = evaluateDocument(flag, context);
  const value = evaluated === null ? defaultValue : evaluated;
  cache.set(normalized, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
};

const clearCache = () => cache.clear();

module.exports = { clearCache, isEnabled };
