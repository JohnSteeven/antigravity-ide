"use strict";

const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

jest.mock("../audit/AuditLogger", () => ({ log: jest.fn() }));

const entitlementService = require("../services/entitlementService");
const subscriptionService = require("../services/subscriptionService");
const { resolveLearnAccess, requireLearnContentAccess } = require("../learn/accessPolicy");
const { requireEntitlement } = require("../middleware/entitlement");
const { ENTITLEMENTS, PLANS } = require("../premium/catalog");
const { serializePublicContent } = require("../premium/contentPreview");
const User = require("../models/User");
const ReaderMembership = require("../models/ReaderMembership");
const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const BillingEvent = require("../models/BillingEvent");

const workspaceFile = (...parts) => path.join(__dirname, "..", "..", ...parts);

describe("Phase 13 Admin / QA Premium Override", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // A. NORMAL FREE USER: PREMIUM DENIED
  // ---------------------------------------------------------------------------
  test("A. normal free user: Premium denied across all entitlements", async () => {
    const freeUserId = new mongoose.Types.ObjectId();
    jest.spyOn(User, "findById").mockReturnValue({
      select: () => ({
        lean: async () => ({ _id: freeUserId, email: "free@example.com", qaPremiumOverride: false, role: "Reader" }),
      }),
    });
    jest.spyOn(subscriptionService, "getSubscriptionForUser").mockResolvedValue(null);

    const resolution = await entitlementService.resolveForUser(freeUserId);
    expect(resolution.active).toBe(false);
    expect(resolution.plan).toBe(PLANS.FREE);
    expect(resolution.entitlementSource).toBeNull();
    expect(Object.values(resolution.entitlements).every((v) => v === false)).toBe(true);

    const learnAccess = await resolveLearnAccess({ userId: freeUserId, accessLevel: "premium" });
    expect(learnAccess.allowed).toBe(false);
    expect(learnAccess.reason).toBe("premium_required");
  });

  // ---------------------------------------------------------------------------
  // B. GENUINE PREMIUM SUBSCRIBER: PREMIUM ALLOWED
  // ---------------------------------------------------------------------------
  test("B. genuine Premium subscriber: Premium allowed via active subscription", async () => {
    const subscriberId = new mongoose.Types.ObjectId();
    jest.spyOn(User, "findById").mockReturnValue({
      select: () => ({
        lean: async () => ({ _id: subscriberId, email: "subscriber@example.com", qaPremiumOverride: false, role: "Reader" }),
      }),
    });
    jest.spyOn(subscriptionService, "getSubscriptionForUser").mockResolvedValue({
      userId: subscriberId,
      plan: PLANS.PREMIUM,
      billingStatus: "active",
      billingPeriodMonths: 1,
      currentPeriodStart: new Date(Date.now() - 3600000),
      currentPeriodEnd: new Date(Date.now() + 86400000 * 30),
      provider: "razorpay",
    });

    const resolution = await entitlementService.resolveForUser(subscriberId);
    expect(resolution.active).toBe(true);
    expect(resolution.plan).toBe(PLANS.PREMIUM);
    expect(resolution.entitlementSource).toBe("razorpay");
    expect(entitlementService.hasEntitlement(resolution, ENTITLEMENTS.PREMIUM_CONTENT)).toBe(true);
    expect(entitlementService.hasEntitlement(resolution, ENTITLEMENTS.LIFE_ACCESS)).toBe(true);
    expect(entitlementService.hasEntitlement(resolution, ENTITLEMENTS.PREMIUM_LEARN)).toBe(true);

    const learnAccess = await resolveLearnAccess({ userId: subscriberId, accessLevel: "premium" });
    expect(learnAccess.allowed).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // C. admin@myjourney.com WITH qaPremiumOverride=true: PREMIUM ALLOWED
  // ---------------------------------------------------------------------------
  test("C. admin@myjourney.com with qaPremiumOverride=true: Premium allowed even without paid subscription", async () => {
    const adminId = new mongoose.Types.ObjectId();
    jest.spyOn(User, "findById").mockReturnValue({
      select: () => ({
        lean: async () => ({ _id: adminId, email: "admin@myjourney.com", qaPremiumOverride: true, role: "Admin" }),
      }),
    });
    // Explicitly confirm NO paid subscription exists
    const subscriptionLookup = jest.spyOn(subscriptionService, "getSubscriptionForUser");

    const resolution = await entitlementService.resolveForUser(adminId);
    expect(resolution.active).toBe(true);
    expect(resolution.plan).toBe(PLANS.PREMIUM);
    expect(resolution.entitlementSource).toBe("qa_override");
    expect(resolution.accessReason).toBe("qa_override");
    expect(resolution.subscriptionStatus).toBe("qa_override");
    // Verify subscription service was bypassed completely
    expect(subscriptionLookup).not.toHaveBeenCalled();

    // Verify all canonical entitlements granted
    expect(entitlementService.hasEntitlement(resolution, ENTITLEMENTS.PREMIUM_CONTENT)).toBe(true);
    expect(entitlementService.hasEntitlement(resolution, ENTITLEMENTS.LIFE_ACCESS)).toBe(true);
    expect(entitlementService.hasEntitlement(resolution, ENTITLEMENTS.ADVANCED_LIFE_INSIGHTS)).toBe(true);
    expect(entitlementService.hasEntitlement(resolution, ENTITLEMENTS.PREMIUM_LEARN)).toBe(true);
    expect(entitlementService.hasEntitlement(resolution, ENTITLEMENTS.PREMIUM_DOWNLOADS)).toBe(true);

    // Verify Learn & Coding access
    const learnAccess = await resolveLearnAccess({ userId: adminId, accessLevel: "premium" });
    expect(learnAccess.allowed).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // D. ADMIN ACCOUNT WITHOUT OVERRIDE: DOES NOT AUTOMATICALLY GAIN PREMIUM
  // ---------------------------------------------------------------------------
  test("D. admin account without override: does NOT automatically gain Premium", async () => {
    const otherAdminId = new mongoose.Types.ObjectId();
    jest.spyOn(User, "findById").mockReturnValue({
      select: () => ({
        lean: async () => ({ _id: otherAdminId, email: "other-admin@myjourney.com", qaPremiumOverride: false, role: "Admin" }),
      }),
    });
    jest.spyOn(subscriptionService, "getSubscriptionForUser").mockResolvedValue(null);

    const resolution = await entitlementService.resolveForUser(otherAdminId);
    expect(resolution.active).toBe(false);
    expect(resolution.plan).toBe(PLANS.FREE);
    expect(resolution.entitlementSource).toBeNull();
    expect(entitlementService.hasEntitlement(resolution, ENTITLEMENTS.PREMIUM_CONTENT)).toBe(false);
    expect(entitlementService.hasEntitlement(resolution, ENTITLEMENTS.LIFE_ACCESS)).toBe(false);

    // Learner content access is denied
    const learnAccess = await resolveLearnAccess({ userId: otherAdminId, accessLevel: "premium" });
    expect(learnAccess.allowed).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // E. OVERRIDE DOES NOT GRANT STANDALONE-PAID PURCHASE
  // ---------------------------------------------------------------------------
  test("E. override does NOT grant standalone-paid purchase", async () => {
    const adminId = new mongoose.Types.ObjectId();
    jest.spyOn(User, "findById").mockReturnValue({
      select: () => ({
        lean: async () => ({ _id: adminId, email: "admin@myjourney.com", qaPremiumOverride: true, role: "Admin" }),
      }),
    });

    // Standalone paid course: Premium entitlement alone must NOT grant access
    const standaloneAccess = await resolveLearnAccess({
      userId: adminId,
      accessLevel: "premium",
      monetizationType: "STANDALONE_PAID",
    });
    expect(standaloneAccess.allowed).toBe(false);
    expect(standaloneAccess.reason).toBe("standalone_purchase_required");

    // Even genuine subscriber is denied standalone paid course without purchase
    const subscriberId = new mongoose.Types.ObjectId();
    jest.spyOn(User, "findById").mockReturnValue({
      select: () => ({
        lean: async () => ({ _id: subscriberId, email: "sub@example.com", qaPremiumOverride: false, role: "Reader" }),
      }),
    });
    jest.spyOn(subscriptionService, "getSubscriptionForUser").mockResolvedValue({
      plan: PLANS.PREMIUM,
      billingStatus: "active",
      billingPeriodMonths: 1,
      currentPeriodStart: new Date(Date.now() - 3600000),
      currentPeriodEnd: new Date(Date.now() + 86400000),
    });

    const subStandalone = await resolveLearnAccess({
      userId: subscriberId,
      accessLevel: "premium",
      monetizationType: "STANDALONE_PAID",
    });
    expect(subStandalone.allowed).toBe(false);
    expect(subStandalone.reason).toBe("standalone_purchase_required");
  });

  // ---------------------------------------------------------------------------
  // F. OVERRIDE DOES NOT CREATE / MUTATE BILLING RECORDS
  // ---------------------------------------------------------------------------
  test("F. override does NOT create or mutate billing records", async () => {
    const adminId = new mongoose.Types.ObjectId();
    jest.spyOn(User, "findById").mockReturnValue({
      select: () => ({
        lean: async () => ({ _id: adminId, email: "admin@myjourney.com", qaPremiumOverride: true, role: "Admin" }),
      }),
    });

    const spiedMembershipCreate = jest.spyOn(ReaderMembership, "create");
    const spiedPaymentCreate = jest.spyOn(Payment, "create");
    const spiedInvoiceCreate = jest.spyOn(Invoice, "create");
    const spiedBillingEventCreate = jest.spyOn(BillingEvent, "create");

    // Perform resolution
    const resolution = await entitlementService.resolveForUser(adminId);
    expect(resolution.active).toBe(true);

    // Verify zero billing mutations
    expect(spiedMembershipCreate).not.toHaveBeenCalled();
    expect(spiedPaymentCreate).not.toHaveBeenCalled();
    expect(spiedInvoiceCreate).not.toHaveBeenCalled();
    expect(spiedBillingEventCreate).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // G. PREMIUM CONTENT API RETURNS PROTECTED CONTENT FOR QA ACCOUNT
  // ---------------------------------------------------------------------------
  test("G. Premium content API returns protected content for QA account across Articles and Life", async () => {
    const adminId = new mongoose.Types.ObjectId();
    jest.spyOn(User, "findById").mockReturnValue({
      select: () => ({
        lean: async () => ({ _id: adminId, email: "admin@myjourney.com", qaPremiumOverride: true, role: "Admin" }),
      }),
    });

    // 1. Article Serialization test
    const resolution = await entitlementService.resolveForUser(adminId);
    const canAccessPremium = entitlementService.hasEntitlement(resolution, ENTITLEMENTS.PREMIUM_CONTENT);
    expect(canAccessPremium).toBe(true);

    const protectedArticle = {
      _id: "article-123",
      title: "Secret Strategy",
      accessLevel: "premium",
      body: "<p>Full confidential article content that only premium users may read.</p>",
      publishedAt: new Date(),
    };
    const serialized = serializePublicContent(protectedArticle, { canAccessPremium });
    expect(serialized.premiumRequired).toBe(false);
    expect(serialized.body).toContain("Full confidential article content");

    // 2. Life API route test with requireEntitlement middleware
    const app = express();
    app.use((req, res, next) => { req.user = { _id: adminId }; next(); });
    app.get("/api/life/today", requireEntitlement("life_access"), (req, res) => res.json({ ok: true, data: "life_private_data" }));

    const res = await request(app).get("/api/life/today");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toBe("life_private_data");
  });

  // ---------------------------------------------------------------------------
  // H. PUBLIC / NON-AUTHENTICATED REQUEST REMAINS DENIED
  // ---------------------------------------------------------------------------
  test("H. public/non-authenticated request remains denied", async () => {
    const anonymousResolution = await entitlementService.resolveForUser(null);
    expect(anonymousResolution.active).toBe(false);
    expect(anonymousResolution.plan).toBe(PLANS.FREE);
    expect(Object.values(anonymousResolution.entitlements).every((v) => v === false)).toBe(true);

    const learnAccess = await resolveLearnAccess({ userId: null, accessLevel: "premium" });
    expect(learnAccess.allowed).toBe(false);
    expect(learnAccess.reason).toBe("premium_required");

    // Test middleware
    const app = express();
    app.use((req, res, next) => { req.user = null; next(); });
    app.get("/api/life/today", requireEntitlement("life_access"), (req, res) => res.json({ ok: true }));

    const res = await request(app).get("/api/life/today");
    expect(res.status).toBe(403);
    expect(res.body.code).toBe("PREMIUM_REQUIRED");
  });

  // ---------------------------------------------------------------------------
  // SECURITY & SERIALIZATION GUARDS
  // ---------------------------------------------------------------------------
  test("Security: User toSafeJSON() strips qaPremiumOverride", () => {
    const user = new User({
      firstName: "Admin",
      lastName: "User",
      username: "admin_test",
      email: "admin@myjourney.com",
      mobile: "+15551234567",
      passwordHash: "hash",
      qaPremiumOverride: true,
    });
    const safe = user.toSafeJSON();
    expect(safe.qaPremiumOverride).toBeUndefined();
    expect(safe.passwordHash).toBeUndefined();
  });

  test("Security: userController updateProfile whitelist excludes qaPremiumOverride", () => {
    const controller = fs.readFileSync(workspaceFile("server", "controllers", "userController.js"), "utf8");
    const allowedBlock = controller.match(/const allowedRoot = \[([\s\S]*?)\];/)[1];
    expect(allowedBlock).not.toContain("qaPremiumOverride");
  });
});
