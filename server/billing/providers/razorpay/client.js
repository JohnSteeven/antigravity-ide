const { assertRazorpayApiConfigured, readRazorpayConfig } = require("./config");

const VALID_PROVIDER_ID = /^[a-z]+_[A-Za-z0-9]{6,64}$/;

class RazorpayApiError extends Error {
  constructor(message, { code = "RAZORPAY_API_ERROR", status = 502, providerStatus = null, retryable = false } = {}) {
    super(message);
    this.name = "RazorpayApiError";
    this.code = code;
    this.status = status;
    this.providerStatus = providerStatus;
    this.retryable = retryable;
  }
}

const assertProviderId = (value, prefix) => {
  const id = String(value || "").trim();
  if (!VALID_PROVIDER_ID.test(id) || !id.startsWith(`${prefix}_`)) {
    throw new RazorpayApiError(`Invalid Razorpay ${prefix} identifier.`, { code: "INVALID_PROVIDER_ID", status: 422 });
  }
  return id;
};

class RazorpayClient {
  constructor({ config = readRazorpayConfig(), fetchImplementation = globalThis.fetch } = {}) {
    this.config = config;
    this.fetchImplementation = fetchImplementation;
  }

  async request(method, path, { body, headers = {} } = {}) {
    const config = assertRazorpayApiConfigured(this.config);
    if (typeof this.fetchImplementation !== "function") throw new RazorpayApiError("HTTP transport is unavailable.", { code: "RAZORPAY_TRANSPORT_UNAVAILABLE" });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
    try {
      const response = await this.fetchImplementation(`${config.apiBaseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64")}`,
          Accept: "application/json",
          ...(body ? { "Content-Type": "application/json" } : {}),
          ...headers,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: controller.signal,
      });
      const raw = await response.text();
      let payload = {};
      try { payload = raw ? JSON.parse(raw) : {}; } catch (_error) { payload = {}; }
      if (!response.ok) {
        const providerCode = String(payload?.error?.code || "RAZORPAY_API_ERROR").replace(/[^A-Z0-9_]/gi, "_").slice(0, 64).toUpperCase();
        throw new RazorpayApiError("Razorpay rejected the billing operation.", {
          code: providerCode,
          providerStatus: response.status,
          retryable: response.status === 409 || response.status >= 500,
        });
      }
      return payload;
    } catch (error) {
      if (error instanceof RazorpayApiError) throw error;
      const timedOut = error?.name === "AbortError";
      throw new RazorpayApiError(timedOut ? "Razorpay request timed out." : "Razorpay could not be reached.", {
        code: timedOut ? "RAZORPAY_TIMEOUT" : "RAZORPAY_NETWORK_ERROR",
        retryable: true,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  createOrder({ amountMinor, currency, receipt, notes }) {
    return this.request("POST", "/orders", {
      body: { amount: amountMinor, currency, receipt, notes, partial_payment: false },
    });
  }

  fetchOrder(orderId) {
    return this.request("GET", `/orders/${encodeURIComponent(assertProviderId(orderId, "order"))}`);
  }

  listOrdersByReceipt(receipt) {
    const query = new URLSearchParams({ receipt: String(receipt), count: "10" });
    return this.request("GET", `/orders?${query.toString()}`);
  }

  fetchPayment(paymentId) {
    return this.request("GET", `/payments/${encodeURIComponent(assertProviderId(paymentId, "pay"))}`);
  }

  createRefund(paymentId, { amountMinor, receipt, notes, idempotencyKey }) {
    if (!/^[A-Za-z0-9_-]{10,128}$/.test(String(idempotencyKey || ""))) {
      throw new RazorpayApiError("Invalid Razorpay refund idempotency key.", { code: "INVALID_REFUND_IDEMPOTENCY_KEY", status: 422 });
    }
    return this.request("POST", `/payments/${encodeURIComponent(assertProviderId(paymentId, "pay"))}/refund`, {
      body: { amount: amountMinor, speed: "normal", receipt, notes },
      headers: { "X-Refund-Idempotency": idempotencyKey },
    });
  }
}

module.exports = { RazorpayApiError, RazorpayClient, assertProviderId };
