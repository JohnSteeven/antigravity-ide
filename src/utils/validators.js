export const isEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

export const isMobile = (value) =>
  /^\+?[0-9]{8,15}$/.test(String(value || "").replace(/\s+/g, ""));

export const detectIdentifierType = (value) => {
  if (isEmail(value)) return "email";
  if (isMobile(value)) return "mobile";
  return "unknown";
};

export const getPasswordChecks = (password) => ({
  length: String(password || "").length >= 8,
  maxLength: String(password || "").length <= 64,
  uppercase: /[A-Z]/.test(password),
  lowercase: /[a-z]/.test(password),
  number: /[0-9]/.test(password),
  special: /[^A-Za-z0-9]/.test(password),
});

export const getPasswordStrength = (password) => {
  const checks = getPasswordChecks(password);
  const visibleChecks = {
    length: checks.length,
    uppercase: checks.uppercase,
    lowercase: checks.lowercase,
    number: checks.number,
    special: checks.special,
  };
  const score = Object.values(visibleChecks).filter(Boolean).length;
  const label =
    score <= 2 ? "Weak" : score === 3 ? "Medium" : score === 4 ? "Strong" : "Very Strong";

  return {
    checks,
    score,
    label,
    percent: (score / Object.keys(visibleChecks).length) * 100,
    isValid: score === Object.keys(visibleChecks).length && checks.maxLength,
  };
};

export const validateRegisterForm = (form) => {
  const errors = {};
  const firstName = form.firstName?.trim() || "";
  const lastName = form.lastName?.trim() || "";
  const mobileDigits = String(form.mobile || "").replace(/\D/g, "");
  const countryCode = String(form.countryCode || "").trim();

  if (!firstName) errors.firstName = "First name is required.";
  else if (firstName.length < 2) errors.firstName = "First name must be at least 2 characters.";
  else if (firstName.length > 50) errors.firstName = "First name must be under 50 characters.";
  else if (/\d/.test(firstName)) errors.firstName = "First name cannot contain numbers.";

  if (!lastName) errors.lastName = "Last name is required.";
  else if (lastName.length < 2) errors.lastName = "Last name must be at least 2 characters.";
  else if (lastName.length > 50) errors.lastName = "Last name must be under 50 characters.";
  else if (/\d/.test(lastName)) errors.lastName = "Last name cannot contain numbers.";

  if (!isEmail(form.email)) errors.email = "Enter a valid email address.";

  if (!/^\+[0-9]{1,4}$/.test(countryCode)) {
    errors.countryCode = "Enter a valid country code.";
  }
  if (mobileDigits.length < 10 || mobileDigits.length > 15) {
    errors.mobile = "Enter a valid mobile number.";
  }
  if (!getPasswordStrength(form.password).isValid) {
    errors.password = "Use 8-64 characters with uppercase, lowercase, number, and symbol.";
  }
  if (!form.confirmPassword || form.password !== form.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }
  if (!form.acceptTerms) {
    errors.acceptTerms = "You must accept the terms.";
  }

  return errors;
};

export const validateIdentifier = (identifier) =>
  detectIdentifierType(identifier) !== "unknown";

export const validateLoginForm = (form) => {
  const errors = {};

  if (detectIdentifierType(form.identifier) === "unknown") {
    errors.identifier = "Enter a valid email or mobile number.";
  }
  if (!form.password) {
    errors.password = "Password is required.";
  }

  return errors;
};

export const validateResetPasswordForm = (form) => {
  const errors = {};

  if (!getPasswordStrength(form.password).isValid) {
    errors.password = "Password does not meet the requirements.";
  }
  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
};
