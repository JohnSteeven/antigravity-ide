jest.mock("../controllers/billingController", () => ({
  handleRazorpayWebhook: jest.fn((req, res) => res.json({ isBuffer: Buffer.isBuffer(req.body), raw: req.body.toString("utf8") })),
}));

const fs = require("fs");
const path = require("path");
const express = require("express");
const request = require("supertest");
const webhookRoutes = require("../routes/billingWebhookRoutes");

describe("Razorpay webhook raw-body middleware contract", () => {
  test("receives untouched bytes before JSON parsing", async () => {
    const app = express();
    app.use("/api/billing/webhooks/razorpay", express.raw({ type: "application/json" }), webhookRoutes);
    app.use(express.json());
    const raw = '{ "event" : "payment.captured", "value" : 39900 }';
    const response = await request(app)
      .post("/api/billing/webhooks/razorpay")
      .set("Content-Type", "application/json")
      .send(raw);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ isBuffer: true, raw });
  });

  test("the application mounts raw webhooks before JSON, sanitization, and CSRF", () => {
    const source = fs.readFileSync(path.join(__dirname, "..", "index.js"), "utf8");
    const rawIndex = source.indexOf('app.use("/api/billing/webhooks/razorpay", express.raw');
    expect(rawIndex).toBeGreaterThan(-1);
    expect(rawIndex).toBeLessThan(source.indexOf('app.use(express.json'));
    expect(rawIndex).toBeLessThan(source.indexOf('app.use(sanitizeRequest)'));
    expect(rawIndex).toBeLessThan(source.indexOf('app.use(csrfProtection)'));
  });
});
