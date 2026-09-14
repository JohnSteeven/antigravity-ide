const crypto = require("crypto");
const { readRazorpayConfig } = require("../billing/providers/razorpay/config");
const { RazorpayClient } = require("../billing/providers/razorpay/client");
const { hmacHex, verifyPaymentSignature, verifyWebhookSignature } = require("../billing/providers/razorpay/signatures");

const environment = {
  RAZORPAY_TEST_MODE: "true",
  RAZORPAY_KEY_ID: "rzp_test_example123",
  RAZORPAY_KEY_SECRET: "test_key_secret",
  RAZORPAY_WEBHOOK_SECRET: "test_webhook_secret",
  RAZORPAY_TIMEOUT_MS: "2000",
};

describe("Razorpay test-mode configuration and signatures", () => {
  test("accepts only explicit test-mode API keys and reports independent webhook capability", () => {
    expect(readRazorpayConfig(environment)).toMatchObject({ apiConfigured: true, webhookConfigured: true, testMode: true });
    expect(readRazorpayConfig({ ...environment, RAZORPAY_KEY_ID: "rzp_live_forbidden" })).toMatchObject({ apiConfigured: false, configurationError: "RAZORPAY_LIVE_KEY_REJECTED" });
    expect(readRazorpayConfig({ ...environment, RAZORPAY_TEST_MODE: "false" })).toMatchObject({ apiConfigured: false, webhookConfigured: false, configurationError: "RAZORPAY_TEST_MODE_REQUIRED" });
    expect(readRazorpayConfig({ ...environment, RAZORPAY_TIMEOUT_MS: "not-a-number" }).timeoutMs).toBe(8000);
  });

  test("verifies the official checkout HMAC using the server-stored order ID", () => {
    const signature = hmacHex("order_test123|pay_test123", environment.RAZORPAY_KEY_SECRET);
    expect(verifyPaymentSignature({ orderId: "order_test123", paymentId: "pay_test123", signature, keySecret: environment.RAZORPAY_KEY_SECRET })).toBe(true);
    expect(() => verifyPaymentSignature({ orderId: "order_server", paymentId: "pay_test123", signature, keySecret: environment.RAZORPAY_KEY_SECRET })).toThrow(expect.objectContaining({ code: "INVALID_RAZORPAY_SIGNATURE" }));
    expect(() => verifyPaymentSignature({ orderId: "order_test123", paymentId: "pay_test123", signature: "not-hex", keySecret: environment.RAZORPAY_KEY_SECRET })).toThrow(expect.objectContaining({ code: "INVALID_RAZORPAY_SIGNATURE" }));
  });

  test("verifies the raw webhook bytes and supports the previous rotation secret", () => {
    const rawBody = Buffer.from('{"event":"payment.captured","amount":39900}');
    const signature = crypto.createHmac("sha256", "previous_secret").update(rawBody).digest("hex");
    expect(verifyWebhookSignature({ rawBody, signature, webhookSecrets: ["current_secret", "previous_secret"] })).toBe(true);
    expect(() => verifyWebhookSignature({ rawBody: Buffer.from(JSON.stringify(JSON.parse(rawBody))), signature, webhookSecrets: ["different"] })).toThrow(expect.objectContaining({ code: "INVALID_RAZORPAY_SIGNATURE" }));
  });
});

describe("Razorpay REST client", () => {
  test("creates Orders with integer catalog terms and no partial payments", async () => {
    const fetchImplementation = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ id: "order_test123", entity: "order" }),
    });
    const client = new RazorpayClient({ config: readRazorpayConfig(environment), fetchImplementation });
    await client.createOrder({ amountMinor: 39900, currency: "INR", receipt: "pay_internal", notes: { product_code: "PREMIUM_MONTHLY" } });
    const [url, options] = fetchImplementation.mock.calls[0];
    expect(url).toBe("https://api.razorpay.com/v1/orders");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ amount: 39900, currency: "INR", receipt: "pay_internal", notes: { product_code: "PREMIUM_MONTHLY" }, partial_payment: false });
    expect(options.headers.Authorization).toMatch(/^Basic /);
    expect(JSON.stringify(options)).not.toContain(environment.RAZORPAY_KEY_SECRET);
  });

  test("uses Razorpay's official normal-refund idempotency header", async () => {
    const fetchImplementation = jest.fn().mockResolvedValue({ ok: true, status: 200, text: async () => "{}" });
    const client = new RazorpayClient({ config: readRazorpayConfig(environment), fetchImplementation });
    await client.createRefund("pay_test123", { amountMinor: 400, receipt: "ref_internal", notes: {}, idempotencyKey: "refund_key_123" });
    const [, options] = fetchImplementation.mock.calls[0];
    expect(options.headers["X-Refund-Idempotency"]).toBe("refund_key_123");
    expect(JSON.parse(options.body)).toMatchObject({ amount: 400, speed: "normal", receipt: "ref_internal" });
  });

  test("turns provider timeouts and 5xx responses into safe retryable errors", async () => {
    const abortError = Object.assign(new Error("aborted"), { name: "AbortError" });
    const timeoutClient = new RazorpayClient({ config: readRazorpayConfig(environment), fetchImplementation: jest.fn().mockRejectedValue(abortError) });
    await expect(timeoutClient.fetchPayment("pay_test123")).rejects.toMatchObject({ code: "RAZORPAY_TIMEOUT", retryable: true });

    const failureClient = new RazorpayClient({
      config: readRazorpayConfig(environment),
      fetchImplementation: jest.fn().mockResolvedValue({ ok: false, status: 503, text: async () => JSON.stringify({ error: { code: "SERVER_ERROR", description: "internal detail" } }) }),
    });
    await expect(failureClient.fetchOrder("order_test123")).rejects.toMatchObject({ code: "SERVER_ERROR", providerStatus: 503, retryable: true });
  });
});
