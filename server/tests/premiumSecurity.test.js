const fs = require("fs");
const path = require("path");
const express = require("express");
const request = require("supertest");

jest.mock("../audit/AuditLogger", () => ({ log: jest.fn() }));

const entitlementService = require("../services/entitlementService");
const { resolveFromSubscription } = entitlementService;
const { requireEntitlement } = require("../middleware/entitlement");

const workspaceFile = (...parts) => path.join(__dirname, "..", "..", ...parts);
const future = new Date("2099-01-01T00:00:00.000Z");

const premiumResolution = (months) => resolveFromSubscription({
  plan: "premium",
  billingPeriodMonths: months,
  billingStatus: "active",
  currentPeriodEnd: future,
});

describe("Premium API and account security", () => {
  let app;

  beforeEach(() => {
    jest.restoreAllMocks();
    app = express();
    app.use((req, res, next) => { req.user = { _id: "user-a" }; next(); });
    app.get("/api/life/today", requireEntitlement("life_access"), (req, res) => res.json({ ok: true }));
    app.use((error, req, res, next) => res.status(error.status || 500).json({ code: error.code, message: error.message }));
  });

  test("a Free account cannot call the Life API directly", async () => {
    jest.spyOn(entitlementService, "resolveForUser").mockResolvedValue(resolveFromSubscription(null));
    const response = await request(app).get("/api/life/today");
    expect(response.status).toBe(403);
    expect(response.body).toEqual(expect.objectContaining({ code: "PREMIUM_REQUIRED", requiredEntitlement: "life_access" }));
  });

  test.each([1, 3, 6, 12])("Premium %i-month access can call the Life API", async (months) => {
    jest.spyOn(entitlementService, "resolveForUser").mockResolvedValue(premiumResolution(months));
    const response = await request(app).get("/api/life/today");
    expect(response.status).toBe(200);
  });

  test("expired access is denied and lookup failures fail securely", async () => {
    jest.spyOn(entitlementService, "resolveForUser").mockResolvedValue(resolveFromSubscription({ plan: "premium", billingPeriodMonths: 1, billingStatus: "expired", currentPeriodEnd: new Date(0) }));
    expect((await request(app).get("/api/life/today")).status).toBe(403);
    entitlementService.resolveForUser.mockRejectedValueOnce(new Error("database unavailable"));
    const unavailable = await request(app).get("/api/life/today");
    expect(unavailable.status).toBe(503);
    expect(unavailable.body.code).toBe("ENTITLEMENT_UNAVAILABLE");
  });

  test("ordinary profile updates cannot mass-assign subscription state", () => {
    const controller = fs.readFileSync(workspaceFile("server", "controllers", "userController.js"), "utf8");
    const allowedBlock = controller.match(/const allowedRoot = \[([\s\S]*?)\];/)[1];
    ["plan", "subscriptionStatus", "billingPeriodMonths", "entitlements", "providerSubscriptionId"].forEach((field) => {
      expect(allowedBlock).not.toContain(`"${field}"`);
    });
  });

  test("membership ownership is derived only from the authenticated account", () => {
    const controller = fs.readFileSync(workspaceFile("server", "controllers", "membershipController.js"), "utf8");
    expect(controller).toContain("const asUserId = (req) => req.user?._id || req.user?.id");
    expect(controller).not.toMatch(/req\.(params|query|body)\.userId/);
  });

  test("CMS access controls remain protected by admin middleware", () => {
    const articleRoutes = fs.readFileSync(workspaceFile("server", "routes", "articleRoutes.js"), "utf8");
    const storyRoutes = fs.readFileSync(workspaceFile("server", "routes", "storyRoutes.js"), "utf8");
    expect(articleRoutes).toMatch(/router\.post\([\s\S]*?authenticate,[\s\S]*?requireAdmin/);
    expect(storyRoutes).toMatch(/router\.post\("\/", authenticate, requireAdmin/);
  });

  test("Premium search and RAG paths never index protected bodies", () => {
    const enterprise = fs.readFileSync(workspaceFile("server", "services", "enterpriseSearchService.js"), "utf8");
    const knowledge = fs.readFileSync(workspaceFile("server", "services", "knowledgeSearchService.js"), "utf8");
    expect(enterprise).toContain("accessLevel === 'premium' ? ''");
    expect(knowledge).toContain("accessLevel: { $ne: 'premium' }");
  });

  test("subscription cancellation, Life deletion, and account deletion remain separate", () => {
    const deletion = fs.readFileSync(workspaceFile("server", "services", "accountDeletionService.js"), "utf8");
    const membership = fs.readFileSync(workspaceFile("server", "controllers", "membershipController.js"), "utf8");
    expect(membership).toContain("scheduleCancellation");
    expect(membership).not.toContain("deleteAllLifeData");
    expect(deletion).toContain("ReaderMembership.deleteMany({ userId })");
    expect(deletion).toContain("privacyService.deleteAllLifeData(userId)");
  });
});
