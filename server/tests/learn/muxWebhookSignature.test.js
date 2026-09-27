jest.mock("../../config/env", () => ({
  clientUrl: "https://myjourney.example",
  mux: { tokenId: "test-id", tokenSecret: "test-secret", webhookSecret: "whsec_test-secret", signingKey: "test-signing", privateKey: "test-private" },
}));
jest.mock("../../learn/videoService", () => ({ applyWebhookEvent: jest.fn(async () => ({ processed: true })) }));

const crypto = require("crypto");
const express = require("express");
const request = require("supertest");
const videoService = require("../../learn/videoService");
const routes = require("../../routes/muxWebhookRoutes");

const app = express();
app.use("/api/learn/webhooks/mux", express.raw({ type: "application/json", limit: "512kb" }), routes);
const body = JSON.stringify({ id: "evt_123", type: "video.asset.ready", data: { id: "asset_123" } });
const signature = (timestamp = Math.floor(Date.now() / 1000)) => {
  const hash = crypto.createHmac("sha256", "whsec_test-secret").update(`${timestamp}.${body}`).digest("hex");
  return `t=${timestamp},v1=${hash}`;
};

beforeEach(() => jest.clearAllMocks());

test("verified raw Mux webhook reaches the lifecycle handler", async () => {
  const response = await request(app).post("/api/learn/webhooks/mux").set("Content-Type", "application/json").set("Mux-Signature", signature()).send(body);
  expect(response.status).toBe(200);
  expect(videoService.applyWebhookEvent).toHaveBeenCalledWith(expect.objectContaining({ type: "video.asset.ready" }));
});

test("invalid and stale signatures are rejected before updating assets", async () => {
  const invalid = await request(app).post("/api/learn/webhooks/mux").set("Content-Type", "application/json").set("Mux-Signature", "t=1,v1=bad").send(body);
  const stale = await request(app).post("/api/learn/webhooks/mux").set("Content-Type", "application/json").set("Mux-Signature", signature(1)).send(body);
  expect(invalid.status).toBe(401);
  expect(stale.status).toBe(401);
  expect(videoService.applyWebhookEvent).not.toHaveBeenCalled();
});
