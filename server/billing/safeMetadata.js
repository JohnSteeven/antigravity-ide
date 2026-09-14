const SENSITIVE_KEY = /(authorization|card|cvv|cvc|secret|password|token|credential|signature)/i;

const sanitizeBillingMetadata = (value, depth = 0) => {
  if (depth > 4 || value === null || value === undefined) return null;
  if (["string", "number", "boolean"].includes(typeof value)) {
    return typeof value === "string" ? value.slice(0, 1000) : value;
  }
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => sanitizeBillingMetadata(item, depth + 1));
  if (typeof value !== "object") return null;
  return Object.entries(value).slice(0, 100).reduce((safe, [key, child]) => {
    const normalizedKey = String(key).slice(0, 100);
    safe[normalizedKey] = SENSITIVE_KEY.test(normalizedKey) ? "[REDACTED]" : sanitizeBillingMetadata(child, depth + 1);
    return safe;
  }, {});
};

module.exports = { sanitizeBillingMetadata };
