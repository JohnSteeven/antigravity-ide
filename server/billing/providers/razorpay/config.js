const RAZORPAY_API_BASE_URL = "https://api.razorpay.com/v1";

const readRazorpayConfig = (environment = process.env) => {
  const keyId = String(environment.RAZORPAY_KEY_ID || "").trim();
  const keySecret = String(environment.RAZORPAY_KEY_SECRET || "").trim();
  const webhookSecrets = [environment.RAZORPAY_WEBHOOK_SECRET, environment.RAZORPAY_WEBHOOK_SECRET_PREVIOUS]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  const testMode = environment.RAZORPAY_TEST_MODE !== "false";
  const testKey = keyId.startsWith("rzp_test_");
  const apiConfigured = Boolean(testMode && testKey && keySecret);
  const configuredTimeoutMs = Number(environment.RAZORPAY_TIMEOUT_MS || 8000);
  const timeoutMs = Number.isFinite(configuredTimeoutMs)
    ? Math.min(30000, Math.max(1000, configuredTimeoutMs))
    : 8000;
  return Object.freeze({
    provider: "razorpay",
    apiBaseUrl: RAZORPAY_API_BASE_URL,
    keyId,
    keySecret,
    webhookSecrets: Object.freeze(webhookSecrets),
    testMode,
    apiConfigured,
    webhookConfigured: Boolean(testMode && testKey && keySecret && webhookSecrets.length),
    timeoutMs,
    configurationError: !testMode
      ? "RAZORPAY_TEST_MODE_REQUIRED"
      : keyId && !testKey
        ? "RAZORPAY_LIVE_KEY_REJECTED"
        : null,
  });
};

const assertRazorpayApiConfigured = (config = readRazorpayConfig()) => {
  if (!config.apiConfigured) {
    const error = new Error("Razorpay test-mode API credentials are not configured.");
    error.status = 503;
    error.code = config.configurationError || "BILLING_PROVIDER_UNAVAILABLE";
    throw error;
  }
  return config;
};

const assertRazorpayWebhookConfigured = (config = readRazorpayConfig()) => {
  if (!config.webhookConfigured) {
    const error = new Error("Razorpay test-mode webhook verification is not configured.");
    error.status = 503;
    error.code = config.configurationError || "BILLING_WEBHOOK_UNAVAILABLE";
    throw error;
  }
  return config;
};

module.exports = {
  RAZORPAY_API_BASE_URL,
  assertRazorpayApiConfigured,
  assertRazorpayWebhookConfigured,
  readRazorpayConfig,
};
