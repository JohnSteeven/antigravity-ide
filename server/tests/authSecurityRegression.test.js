const jwt = require("jsonwebtoken");

const loadAuthService = ({ tokenRecord, user } = {}) => {
  jest.resetModules();
  const createAuthSession = jest.fn().mockResolvedValue({ authenticated: true });
  const clearAuthCookies = jest.fn();
  const RefreshToken = {
    findOneAndUpdate: jest.fn().mockResolvedValue(tokenRecord ?? { _id: "refresh-record-1" }),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  };
  const Session = { updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }) };
  const User = {
    findById: jest.fn().mockResolvedValue(user ?? {
      _id: "64b000000000000000000001",
      status: "ACTIVE",
      isDeleted: false,
      tokenVersion: 0,
    }),
  };

  jest.doMock("../config/env", () => ({
    jwtRefreshSecret: "test-refresh-secret",
    passwordHistoryLimit: 5,
  }));
  jest.doMock("../models/User", () => User);
  jest.doMock("../models/Notification", () => ({ create: jest.fn() }));
  jest.doMock("../models/RefreshToken", () => RefreshToken);
  jest.doMock("../models/Session", () => Session);
  jest.doMock("../services/activityLogService", () => ({ createLog: jest.fn().mockResolvedValue(undefined) }));
  jest.doMock("../services/emailService", () => ({}));
  jest.doMock("../services/otpService", () => ({
    createOtpChallenge: jest.fn(),
    resendOtpChallenge: jest.fn(),
    verifyOtpChallenge: jest.fn(),
  }));
  jest.doMock("../services/tokenService", () => ({
    createAuthSession,
    clearAuthCookies,
    hashToken: (value) => `hash:${value}`,
  }));

  return {
    authService: require("../services/authService"),
    clearAuthCookies,
    createAuthSession,
    RefreshToken,
    Session,
    User,
  };
};

describe("authentication security regressions", () => {
  afterEach(() => jest.restoreAllMocks());

  test("refresh rotation atomically consumes a token and rejects replay", async () => {
    const runtime = loadAuthService();
    const rawToken = jwt.sign(
      { sub: "64b000000000000000000001", jti: "jti-1" },
      "test-refresh-secret",
      { algorithm: "HS256", expiresIn: "30d" }
    );
    runtime.RefreshToken.findOneAndUpdate
      .mockResolvedValueOnce({ _id: "refresh-record-1" })
      .mockResolvedValueOnce(null);
    const req = { ip: "127.0.0.1", headers: {} };
    const res = { cookie: jest.fn(), clearCookie: jest.fn() };

    await expect(runtime.authService.refreshToken(rawToken, req, res)).resolves.toMatchObject({
      session: { authenticated: true },
    });
    await expect(runtime.authService.refreshToken(rawToken, req, res)).rejects.toMatchObject({ status: 401 });

    expect(runtime.RefreshToken.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenHash: `hash:${rawToken}`,
        user: "64b000000000000000000001",
        revokedAt: null,
      }),
      expect.objectContaining({ $set: { revokedAt: expect.any(Date) } }),
      { new: false }
    );
    expect(runtime.createAuthSession).toHaveBeenCalledTimes(1);
  });

  test("refresh cannot create a session for a suspended account", async () => {
    const runtime = loadAuthService({
      user: {
        _id: "64b000000000000000000001",
        status: "SUSPENDED",
        isDeleted: false,
      },
    });
    const rawToken = jwt.sign(
      { sub: "64b000000000000000000001", jti: "jti-2" },
      "test-refresh-secret",
      { algorithm: "HS256", expiresIn: "1d" }
    );

    await expect(runtime.authService.refreshToken(rawToken, { headers: {} }, {}))
      .rejects.toMatchObject({ status: 401, message: "Account is unavailable." });
    expect(runtime.createAuthSession).not.toHaveBeenCalled();
    expect(runtime.clearAuthCookies).toHaveBeenCalled();
  });

  test("logout clears auth cookies even when the refresh cookie is absent", async () => {
    const runtime = loadAuthService();
    await runtime.authService.logout(undefined, {});
    expect(runtime.clearAuthCookies).toHaveBeenCalledTimes(1);
  });
});

describe("session revocation security regressions", () => {
  const loadSessionService = ({ sessions = [] } = {}) => {
    jest.resetModules();
    const sessionFindChain = {
      sort: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(sessions),
    };
    const Session = {
      find: jest.fn().mockReturnValue(sessionFindChain),
      findOneAndUpdate: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: sessions.length }),
    };
    const refreshFindChain = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({ _id: "refresh-current" }),
    };
    const RefreshToken = {
      findOne: jest.fn().mockReturnValue(refreshFindChain),
      findOneAndUpdate: jest.fn(),
      updateMany: jest.fn(),
    };

    jest.doMock("../models/Session", () => Session);
    jest.doMock("../models/RefreshToken", () => RefreshToken);
    jest.doMock("../models/ActivityLog", () => ({ create: jest.fn().mockResolvedValue(undefined) }));
    jest.doMock("../services/tokenService", () => ({ hashToken: (value) => `hash:${value}` }));

    return { service: require("../services/sessionService"), Session, RefreshToken };
  };

  test("identifies the current session through the hashed refresh-token record", async () => {
    const current = {
      _id: { toString: () => "session-current" },
      refreshToken: "refresh-current",
      createdAt: new Date(),
    };
    const runtime = loadSessionService({ sessions: [current] });
    const result = await runtime.service.getActiveSessions(
      { _id: "64b000000000000000000001" },
      { cookies: { refreshToken: "raw-refresh-token" } }
    );

    expect(runtime.RefreshToken.findOne).toHaveBeenCalledWith(expect.objectContaining({
      tokenHash: "hash:raw-refresh-token",
      revokedAt: null,
    }));
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "session-current", isCurrent: true });
  });

  test("returns an honest empty list instead of fabricating a current session", async () => {
    const runtime = loadSessionService({ sessions: [] });
    await expect(runtime.service.getActiveSessions(
      { _id: "64b000000000000000000001" },
      { cookies: {} }
    )).resolves.toEqual([]);
  });

  test("revoking a session also revokes its backing refresh token", async () => {
    const runtime = loadSessionService();
    runtime.Session.findOneAndUpdate.mockResolvedValue({
      refreshToken: "64b000000000000000000099",
      browser: "Browser",
      os: "OS",
    });
    runtime.RefreshToken.findOneAndUpdate.mockResolvedValue({});

    await runtime.service.revokeSession(
      "64b000000000000000000001",
      "64b000000000000000000002",
      { headers: {} }
    );

    expect(runtime.RefreshToken.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: "64b000000000000000000099",
        user: "64b000000000000000000001",
        revokedAt: null,
      }),
      expect.objectContaining({ $set: { revokedAt: expect.any(Date) } })
    );
  });
});
