const originalEnvironment = {
  NODE_ENV: process.env.NODE_ENV,
  CSRF_ENABLED: process.env.CSRF_ENABLED,
  COOKIE_SECURE: process.env.COOKIE_SECURE,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  MONGO_URI: process.env.MONGO_URI,
};

process.env.NODE_ENV = "test";
process.env.CSRF_ENABLED = "true";
process.env.COOKIE_SECURE = "false";
process.env.JWT_ACCESS_SECRET = "auth-01-test-access-secret";
process.env.JWT_REFRESH_SECRET = "auth-01-test-refresh-secret";
process.env.MONGO_URI = "mongodb://127.0.0.1:27017/myjourney_auth_identity_test";

jest.mock("../services/emailService", () => ({
  sendOtpEmail: jest.fn().mockResolvedValue({ delivered: false, provider: "test-disabled" }),
}));
jest.mock("../services/smsService", () => ({
  sendOtpSms: jest.fn().mockResolvedValue({ delivered: false, provider: "test-disabled" }),
}));

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../index");
const env = require("../config/env");
const User = require("../models/User");
const Session = require("../models/Session");
const RefreshToken = require("../models/RefreshToken");
const ActivityLog = require("../models/ActivityLog");
const IdentityChangeChallenge = require("../models/IdentityChangeChallenge");

const fixtureUsernames = ["auth01_owner", "auth01_other"];

const restoreEnvironment = () => {
  Object.entries(originalEnvironment).forEach(([key, value]) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  });
};

const accessTokenFor = (user) => jwt.sign(
  { sub: String(user._id), role: user.role, tokenVersion: user.tokenVersion || 0 },
  env.jwtAccessSecret,
  { algorithm: "HS256", expiresIn: "1h" }
);

describe("AUTH-01 account identity API integration", () => {
  jest.setTimeout(25000);
  let owner;
  let other;
  let ownerToken;
  let otherToken;
  let ownerAgent;
  let csrfToken;
  let legacyRefresh;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });
    if (!mongoose.connection.name.endsWith("_test")) {
      throw new Error("AUTH-01 integration tests require a database ending in _test.");
    }
    await Promise.all([User.init(), IdentityChangeChallenge.init(), RefreshToken.init(), Session.init()]);
  });

  beforeEach(async () => {
    const oldUsers = await User.find({ username: { $in: fixtureUsernames } }).select("_id").lean();
    const oldIds = oldUsers.map((user) => user._id);
    await Promise.all([
      IdentityChangeChallenge.deleteMany({ user: { $in: oldIds } }),
      RefreshToken.deleteMany({ user: { $in: oldIds } }),
      Session.deleteMany({ user: { $in: oldIds } }),
      ActivityLog.deleteMany({ userId: { $in: oldIds }, module: "security" }),
    ]);
    await User.deleteMany({ username: { $in: fixtureUsernames } });

    const passwordHash = await bcrypt.hash("Correct!Pass123", 12);
    [owner, other] = await User.create([
      {
        firstName: "Auth",
        lastName: "Owner",
        username: fixtureUsernames[0],
        email: "auth01-owner@myjourney.test",
        countryCode: "+1",
        mobile: "+14155550101",
        passwordHash,
        status: "ACTIVE",
        verified: { email: true, mobile: true },
      },
      {
        firstName: "Auth",
        lastName: "Other",
        username: fixtureUsernames[1],
        email: "auth01-other@myjourney.test",
        countryCode: "+44",
        mobile: "+442071838750",
        passwordHash,
        status: "ACTIVE",
        verified: { email: true, mobile: true },
      },
    ]);
    ownerToken = accessTokenFor(owner);
    otherToken = accessTokenFor(other);
    legacyRefresh = await RefreshToken.create({
      user: owner._id,
      tokenHash: `auth01-${owner._id}`,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    await Session.create({
      user: owner._id,
      refreshToken: legacyRefresh._id,
      isActive: true,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    ownerAgent = request.agent(app);
    const csrf = await ownerAgent.get("/api/auth/csrf-token");
    csrfToken = csrf.body.csrfToken;
  });

  afterAll(async () => {
    try {
      const users = await User.find({ username: { $in: fixtureUsernames } }).select("_id").lean();
      const ids = users.map((user) => user._id);
      await Promise.all([
        IdentityChangeChallenge.deleteMany({ user: { $in: ids } }),
        RefreshToken.deleteMany({ user: { $in: ids } }),
        Session.deleteMany({ user: { $in: ids } }),
        ActivityLog.deleteMany({ userId: { $in: ids }, module: "security" }),
      ]);
      await User.deleteMany({ username: { $in: fixtureUsernames } });
    } finally {
      await mongoose.disconnect();
      restoreEnvironment();
    }
  });

  test("authenticated CSRF-protected flow is replaceable, cancellable, single-use, and rotates sessions", async () => {
    const noCsrf = await request(app)
      .post("/api/users/me/identity-changes")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        kind: "email",
        value: "next-owner@myjourney.test",
        reauth: { method: "password", credential: "Correct!Pass123" },
      });
    expect(noCsrf.status).toBe(403);

    const ordinaryWrite = await ownerAgent
      .put("/api/users/me")
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("x-csrf-token", csrfToken)
      .send({ email: "bypass@myjourney.test", verified: { email: true } });
    expect(ordinaryWrite.status).toBe(422);

    const conflict = await ownerAgent
      .post("/api/users/me/identity-changes")
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("x-csrf-token", csrfToken)
      .send({
        kind: "email",
        value: other.email,
        reauth: { method: "password", credential: "Correct!Pass123" },
      });
    expect(conflict.status).toBe(409);
    expect(conflict.body.code).toBe("IDENTITY_CONFLICT");

    const first = await ownerAgent
      .post("/api/users/me/identity-changes")
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("x-csrf-token", csrfToken)
      .send({
        kind: "email",
        value: "first-proposal@myjourney.test",
        reauth: { method: "password", credential: "Correct!Pass123" },
      });
    expect(first.status).toBe(201);
    expect(first.body.challenge.devCode).toMatch(/^\d{6}$/);
    expect(JSON.stringify(first.body)).not.toContain("first-proposal@myjourney.test");
    expect((await User.findById(owner._id)).email).toBe("auth01-owner@myjourney.test");

    const replacement = await ownerAgent
      .post("/api/users/me/identity-changes")
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("x-csrf-token", csrfToken)
      .send({
        kind: "email",
        value: "final-owner@myjourney.test",
        reauth: { method: "password", credential: "Correct!Pass123" },
      });
    expect(replacement.status).toBe(201);
    expect(replacement.body.challenge.id).toBe(first.body.challenge.id);
    expect(await IdentityChangeChallenge.countDocuments({ user: owner._id, kind: "email" })).toBe(1);

    const foreignVerify = await request(app)
      .post(`/api/users/me/identity-changes/${replacement.body.challenge.id}/verify`)
      .set("Authorization", `Bearer ${otherToken}`)
      .set("Cookie", `csrfToken=${csrfToken}`)
      .set("x-csrf-token", csrfToken)
      .send({ code: replacement.body.challenge.devCode });
    expect(foreignVerify.status).toBe(404);

    const invalidCode = await ownerAgent
      .post(`/api/users/me/identity-changes/${replacement.body.challenge.id}/verify`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("x-csrf-token", csrfToken)
      .send({ code: "000000" });
    expect(invalidCode.status).toBe(401);
    expect(invalidCode.body.code).toBe("IDENTITY_CODE_INVALID");

    const verified = await ownerAgent
      .post(`/api/users/me/identity-changes/${replacement.body.challenge.id}/verify`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("x-csrf-token", csrfToken)
      .send({ code: replacement.body.challenge.devCode });
    expect(verified.status).toBe(200);
    expect(verified.body.user.email).toBe("final-owner@myjourney.test");
    expect(verified.body.user.verified.email).toBe(true);
    expect(verified.body.session.authenticated).toBe(true);

    const updated = await User.findById(owner._id);
    expect(updated.email).toBe("final-owner@myjourney.test");
    expect(updated.tokenVersion).toBe(1);
    expect(await IdentityChangeChallenge.countDocuments({ user: owner._id })).toBe(0);
    expect((await RefreshToken.findById(legacyRefresh._id)).revokedAt).toBeInstanceOf(Date);
    expect(await Session.countDocuments({ user: owner._id, isActive: true })).toBe(1);

    expect((await request(app).get("/api/users/me").set("Authorization", `Bearer ${ownerToken}`)).status).toBe(401);
    expect((await ownerAgent.get("/api/users/me")).status).toBe(200);

    const replay = await ownerAgent
      .post(`/api/users/me/identity-changes/${replacement.body.challenge.id}/verify`)
      .set("x-csrf-token", csrfToken)
      .send({ code: replacement.body.challenge.devCode });
    expect(replay.status).toBe(404);
    expect(replay.body.code).toBe("IDENTITY_CHALLENGE_NOT_FOUND");

    const audit = await ActivityLog.findOne({ userId: owner._id, action: "account_email_change" }).lean();
    expect(audit).toBeTruthy();
    expect(audit.description).not.toContain("auth01-owner@myjourney.test");
    expect(audit.description).not.toContain("final-owner@myjourney.test");
  });

  test("owner can cancel a pending mobile change and it cannot be replayed", async () => {
    const started = await ownerAgent
      .post("/api/users/me/identity-changes")
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("x-csrf-token", csrfToken)
      .send({
        kind: "mobile",
        value: "+14155550999",
        reauth: { method: "password", credential: "Correct!Pass123" },
      });
    expect(started.status).toBe(201);

    const cancelled = await ownerAgent
      .delete(`/api/users/me/identity-changes/${started.body.challenge.id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("x-csrf-token", csrfToken)
      .send({});
    expect(cancelled.status).toBe(200);

    const replay = await ownerAgent
      .post(`/api/users/me/identity-changes/${started.body.challenge.id}/verify`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("x-csrf-token", csrfToken)
      .send({ code: started.body.challenge.devCode });
    expect(replay.status).toBe(404);
    expect((await User.findById(owner._id)).mobile).toBe("+14155550101");
  });
});
