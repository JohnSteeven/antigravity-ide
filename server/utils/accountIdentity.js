const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const normalizeE164 = (value) => String(value || "")
  .trim()
  .replace(/[\s()-]/g, "");

const isValidEmail = (value) => EMAIL_PATTERN.test(normalizeEmail(value));
const isValidE164 = (value) => E164_PATTERN.test(normalizeE164(value));

const composeE164 = (countryCode, localNumber) => {
  const prefix = String(countryCode || "").trim();
  const digits = String(localNumber || "").replace(/\D/g, "");
  return normalizeE164(`${prefix}${digits}`);
};

const normalizeIdentifier = (identifier) => {
  const raw = String(identifier || "").trim();
  if (raw.includes("@")) return { type: "email", value: normalizeEmail(raw) };
  const mobile = normalizeE164(raw);
  if (isValidE164(mobile)) return { type: "mobile", value: mobile };
  return { type: "username", value: raw.toLowerCase() };
};

const maskEmail = (value) => {
  const [local = "", domain = ""] = normalizeEmail(value).split("@");
  if (!domain) return "your email";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(3, local.length - visible.length))}@${domain}`;
};

const maskMobile = (value) => {
  const mobile = normalizeE164(value);
  if (!isValidE164(mobile)) return "your mobile number";
  return `${mobile.slice(0, 3)}${"*".repeat(Math.max(4, mobile.length - 7))}${mobile.slice(-4)}`;
};

const maskIdentifier = (kind, value) => kind === "email" ? maskEmail(value) : maskMobile(value);

module.exports = {
  E164_PATTERN,
  composeE164,
  isValidE164,
  isValidEmail,
  maskIdentifier,
  normalizeE164,
  normalizeEmail,
  normalizeIdentifier,
};
