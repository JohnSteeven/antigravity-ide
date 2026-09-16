const fs = require("fs");
const path = require("path");
const express = require("express");
const request = require("supertest");
const { validationResult } = require("express-validator");
const { handleValidation } = require("../middleware/errorHandler");
const {
  updateProfileValidator,
  updateUserValidator,
} = require("../validators/userValidator");
const IdentityChangeChallenge = require("../models/IdentityChangeChallenge");
const UserModel = require("../models/User");
const {
  MAX_ATTEMPTS,
  MAX_RESENDS,
  createIdentityChangeService,
} = require("../services/identityChangeService");
const { buildIdentityNormalizationReport } = require("../services/identityNormalizationReport");
const {
  isValidE164,
  normalizeIdentifier,
} = require("../utils/accountIdentity");

const query = (value) => {
  const promise = Promise.resolve(value);
  const chain = {
    select: jest.fn(() => chain),
    lean: jest.fn(() => promise),
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
  };
  return chain;
};

const challengeRecord = (overrides = {}) => ({
  _id: { toString: () => "64f000000000000000000001" },
  user: "user-1",
  kind: "email",
  currentIdentifier: "old@example.com",
  proposedIdentifier: "new@example.com",
  otpHash: "hashed-code",
  attempts: 0,
  resendCount: 0,
  resendAvailableAt: new Date("2030-01-01T00:00:00.000Z"),
  expiresAt: new Date("2030-01-01T00:05:00.000Z"),
  ...overrides,
});

const makeDependencies = (overrides = {}) => ({
  User: {
    findOne: jest.fn(() => query(null)),
    findOneAndUpdate: jest.fn(),
  },
  RefreshToken: { updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }) },
  Session: { updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }) },
  Challenge: {
    findOne: jest.fn(() => query(null)),
    findOneAndUpdate: jest.fn(() => query(null)),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  },
  activityLog: { createLog: jest.fn().mockResolvedValue({}) },
  email: { sendOtpEmail: jest.fn().mockResolvedValue({ delivered: true, provider: "test" }) },
  sms: { sendOtpSms: jest.fn().mockResolvedValue({ delivered: true, provider: "test" }) },
  createSession: jest.fn().mockResolvedValue({ authenticated: true }),
  now: () => new Date("2029-12-31T23:59:00.000Z"),
  code: () => "123456",
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue("hashed-code"),
  verifyTotp: jest.fn(() => true),
  ...overrides,
});

describe("AUTH-01 account identity security", () => {
  test("canonical lookup accepts full E.164 only and login code has no suffix/regex fallback", () => {
    expect(normalizeIdentifier(" +1 (415) 555-2671 ")).toEqual({ type: "mobile", value: "+14155552671" });
    expect(normalizeIdentifier("4155552671")).toEqual({ type: "username", value: "4155552671" });
    expect(isValidE164("+14155552671")).toBe(true);
    expect(isValidE164("4155552671")).toBe(false);

    const source = fs.readFileSync(path.join(__dirname, "../services/authService.js"), "utf8");
    const lookup = source.match(/const findUserByIdentifier[\s\S]+?\n};/)?.[0] || "";
    expect(lookup).toContain("normalizeIdentifier");
    expect(lookup).not.toContain("$regex");
    expect(lookup).not.toContain("endsWith");
  });

  test("ordinary profile and Admin update validators reject identity fields", async () => {
    const app = express();
    app.use(express.json());
    const validate = handleValidation(validationResult);
    app.put("/profile", updateProfileValidator, validate, (_req, res) => res.json({ ok: true }));
    app.put("/admin", updateUserValidator, validate, (_req, res) => res.json({ ok: true }));

    expect((await request(app).put("/profile").send({ email: "new@example.com" })).status).toBe(422);
    expect((await request(app).put("/admin").send({ mobile: "+14155552671" })).status).toBe(422);
    expect((await request(app).put("/profile").send({ firstName: "Alice" })).status).toBe(200);
  });

  test("challenge schema is owner-bound, unique per identity type, secret-selective, and TTL-limited", () => {
    expect(IdentityChangeChallenge.schema.path("currentIdentifier").options.select).toBe(false);
    expect(IdentityChangeChallenge.schema.path("proposedIdentifier").options.select).toBe(false);
    expect(IdentityChangeChallenge.schema.path("otpHash").options.select).toBe(false);
    expect(IdentityChangeChallenge.schema.indexes()).toEqual(expect.arrayContaining([
      [{ user: 1, kind: 1 }, expect.objectContaining({ unique: true })],
      [{ expiresAt: 1 }, expect.objectContaining({ expireAfterSeconds: 0 })],
    ]));
    expect(UserModel.schema.path("countryCode").defaultValue).toBe("");
  });

  test("start requires real reauthentication, masks the proposal, and stores only a hashed code", async () => {
    const record = challengeRecord();
    const user = { email: "old@example.com", mobile: "+14155550000", passwordHash: "password-hash" };
    const dependencies = makeDependencies();
    dependencies.User.findOne.mockImplementation((filter) => query(filter._id === "user-1" ? user : null));
    dependencies.Challenge.findOneAndUpdate.mockReturnValue(query(record));
    const service = createIdentityChangeService(dependencies);

    const result = await service.start("user-1", {
      kind: "email",
      value: " New@Example.com ",
      reauth: { method: "password", credential: "correct horse" },
    });

    expect(dependencies.compare).toHaveBeenCalledWith("correct horse", "password-hash");
    expect(dependencies.hash).toHaveBeenCalledWith("123456");
    expect(dependencies.Challenge.findOneAndUpdate.mock.calls[0][1].$set).toEqual(expect.objectContaining({
      proposedIdentifier: "new@example.com",
      otpHash: "hashed-code",
      attempts: 0,
      resendCount: 0,
    }));
    expect(result.maskedIdentifier).not.toBe("new@example.com");
    expect(JSON.stringify(result)).not.toContain("hashed-code");
  });

  test.each([
    ["IDENTITY_CHALLENGE_EXPIRED", challengeRecord({ expiresAt: new Date("2029-12-31T23:58:00.000Z") })],
    ["IDENTITY_RESENDS_EXHAUSTED", challengeRecord({ resendCount: MAX_RESENDS })],
    ["IDENTITY_ATTEMPTS_EXHAUSTED", challengeRecord({ attempts: MAX_ATTEMPTS })],
    ["IDENTITY_RESEND_COOLDOWN", challengeRecord({ resendAvailableAt: new Date("2030-01-01T00:01:00.000Z") })],
  ])("resend enforces %s", async (code, existing) => {
    const dependencies = makeDependencies();
    dependencies.Challenge.findOne.mockReturnValue(query(existing));
    const service = createIdentityChangeService(dependencies);
    await expect(service.resend("user-1", "challenge-1")).rejects.toMatchObject({ code });
    expect(dependencies.email.sendOtpEmail).not.toHaveBeenCalled();
  });

  test("invalid codes increment the bounded attempt counter", async () => {
    const dependencies = makeDependencies({ compare: jest.fn().mockResolvedValue(false) });
    dependencies.Challenge.findOne.mockReturnValue(query(challengeRecord()));
    dependencies.Challenge.findOneAndUpdate.mockReturnValue(query({ attempts: 1 }));
    const service = createIdentityChangeService(dependencies);

    await expect(service.verify("user-1", "challenge-1", "000000", {}, {}))
      .rejects.toMatchObject({ code: "IDENTITY_CODE_INVALID" });
    expect(dependencies.Challenge.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ user: "user-1", attempts: { $lt: MAX_ATTEMPTS } }),
      { $inc: { attempts: 1 } },
      { new: true }
    );
  });

  test("verification atomically replaces the current identity, revokes sessions, rotates auth, and audits masked values", async () => {
    const challenge = challengeRecord();
    const updatedUser = {
      _id: "user-1",
      email: "new@example.com",
      mobile: "+14155550000",
      tokenVersion: 4,
    };
    const dependencies = makeDependencies();
    dependencies.Challenge.findOne.mockReturnValue(query(challenge));
    dependencies.User.findOne.mockReturnValue(query(null));
    dependencies.User.findOneAndUpdate.mockResolvedValue(updatedUser);
    const service = createIdentityChangeService(dependencies);

    const result = await service.verify("user-1", "challenge-1", "123456", { ip: "127.0.0.1", headers: {} }, {});

    expect(dependencies.User.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: "user-1", email: "old@example.com" }),
      expect.objectContaining({
        $set: { email: "new@example.com", "verified.email": true },
        $inc: { tokenVersion: 1 },
      }),
      { new: true, runValidators: true }
    );
    expect(dependencies.RefreshToken.updateMany).toHaveBeenCalled();
    expect(dependencies.Session.updateMany).toHaveBeenCalled();
    expect(dependencies.createSession).toHaveBeenCalledWith(expect.objectContaining({ user: updatedUser }));
    expect(dependencies.activityLog.createLog.mock.calls[0][0].description).not.toContain("new@example.com");
    expect(result).toEqual(expect.objectContaining({ user: updatedUser, session: { authenticated: true } }));
  });

  test("a duplicate-key race fails closed and consumes the owner's challenge", async () => {
    const dependencies = makeDependencies();
    dependencies.Challenge.findOne.mockReturnValue(query(challengeRecord()));
    dependencies.User.findOne.mockReturnValue(query(null));
    dependencies.User.findOneAndUpdate.mockRejectedValue(Object.assign(new Error("duplicate"), { code: 11000 }));
    const service = createIdentityChangeService(dependencies);

    await expect(service.verify("user-1", "challenge-1", "123456", {}, {}))
      .rejects.toMatchObject({ status: 409, code: "IDENTITY_CONFLICT" });
    expect(dependencies.Challenge.deleteOne).toHaveBeenCalledWith(expect.objectContaining({ user: "user-1" }));
  });

  test("cancellation and challenge reads are scoped to the authenticated owner", async () => {
    const dependencies = makeDependencies();
    dependencies.Challenge.deleteOne.mockResolvedValue({ deletedCount: 0 });
    const service = createIdentityChangeService(dependencies);

    await expect(service.cancel("other-user", "challenge-1"))
      .rejects.toMatchObject({ status: 404, code: "IDENTITY_CHALLENGE_NOT_FOUND" });
    expect(dependencies.Challenge.deleteOne).toHaveBeenCalledWith({ _id: "challenge-1", user: "other-user" });
  });

  test("normalization dry run reports counts only and performs zero writes", () => {
    const report = buildIdentityNormalizationReport([
      { email: " Alice@Example.com ", mobile: "+1 (415) 555-2671", verified: { email: true, mobile: true } },
      { email: "alice@example.com", mobile: "+14155552671", verified: { email: true, mobile: true } },
      { email: "invalid", mobile: "4155552671", verified: { email: false, mobile: false } },
    ]);

    expect(report).toEqual(expect.objectContaining({
      dryRun: true,
      totalAccounts: 3,
      normalizableValues: { emails: 1, mobiles: 1, total: 2 },
      invalidValues: { emails: 1, mobiles: 0, total: 1 },
      ambiguousValues: { emails: 0, mobiles: 1, total: 1 },
      verifiedConflicts: { emailGroups: 1, mobileGroups: 1, totalGroups: 2 },
      manualReviewCases: 3,
      writesPerformed: 0,
    }));
    expect(JSON.stringify(report)).not.toMatch(/alice|example|415555/i);
  });

  test("client and route contracts keep challenges memory-only, accessible, authenticated, CSRF-covered, and rate-limited", () => {
    const client = fs.readFileSync(path.join(__dirname, "../../src/services/authService.js"), "utf8");
    const panel = fs.readFileSync(path.join(__dirname, "../../src/components/IdentityChangePanel.js"), "utf8");
    const routes = fs.readFileSync(path.join(__dirname, "../routes/userRoutes.js"), "utf8");
    const server = fs.readFileSync(path.join(__dirname, "../index.js"), "utf8");

    const identityClient = client.slice(client.indexOf("async startIdentityChange"), client.indexOf("async logout"));
    expect(identityClient).not.toMatch(/localStorage|writeStorage|persistServerChallenge/);
    expect(panel).toContain('aria-live="polite"');
    expect(panel).toContain("<fieldset");
    expect(panel).toContain("<legend>");
    expect(routes.match(/identityChangeLimiter/g)?.length).toBeGreaterThanOrEqual(4);
    expect(routes.match(/authenticate,/g)?.length).toBeGreaterThanOrEqual(4);
    expect(server.indexOf("app.use(csrfProtection)")).toBeLessThan(server.indexOf('app.use("/api/users"'));
  });
});
