const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const RefreshToken = require("../models/RefreshToken");
const Session = require("../models/Session");

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const signAccessToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      tokenVersion: user.tokenVersion || 0,
    },
    env.jwtAccessSecret,
    { expiresIn: env.accessTokenTtl }
  );

const signRefreshToken = (user, days = env.refreshTokenTtlDays) =>
  jwt.sign({ sub: user._id.toString(), jti: crypto.randomUUID() }, env.jwtRefreshSecret, {
    expiresIn: `${days}d`,
  });

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: env.cookieSecure,
  path: "/",
};

const setAuthCookies = (res, { accessToken, refreshToken, refreshExpiresAt }) => {
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 1000 * 60 * 15,
  });
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    expires: refreshExpiresAt,
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
};

const createAuthSession = async ({ user, req, res, remember = false }) => {
  const refreshDays = remember ? env.refreshTokenTtlDays : 1;
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user, refreshDays);
  const refreshExpiresAt = new Date(
    Date.now() + refreshDays * 24 * 60 * 60 * 1000
  );

  const refreshRecord = await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(refreshToken),
    createdByIp: req.ip,
    expiresAt: refreshExpiresAt,
  });

  const userAgent = typeof req.get === "function"
    ? req.get("user-agent")
    : (req.headers?.["user-agent"] || req.headers?.["User-Agent"] || "unknown");

  await Session.create({
    user: user._id,
    refreshToken: refreshRecord._id,
    ip: req.ip || "127.0.0.1",
    userAgent,
    expiresAt: refreshExpiresAt,
  });

  setAuthCookies(res, { accessToken, refreshToken, refreshExpiresAt });

  return {
    authenticated: true,
    remember,
    expiresAt: refreshExpiresAt,
  };
};

module.exports = {
  clearAuthCookies,
  createAuthSession,
  hashToken,
  signAccessToken,
};
