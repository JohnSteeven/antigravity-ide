const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const RefreshToken = require("../models/RefreshToken");
const Session = require("../models/Session");

const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const durationToMs = (value, fallbackMs) => {
  const match = String(value || "").trim().match(/^(\d+)\s*([smhd])$/i);
  if (!match) return fallbackMs;
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return Number(match[1]) * multipliers[match[2].toLowerCase()];
};

const signAccessToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      tokenVersion: user.tokenVersion || 0,
    },
    env.jwtAccessSecret,
    { algorithm: "HS256", expiresIn: env.accessTokenTtl }
  );

const signRefreshToken = (user, days = env.refreshTokenTtlDays) =>
  jwt.sign({ sub: user._id.toString(), jti: crypto.randomUUID() }, env.jwtRefreshSecret, {
    algorithm: "HS256",
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
    maxAge: durationToMs(env.accessTokenTtl, 15 * 60 * 1000),
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
    ipAddress: req.ip || "unknown",
    userAgent: String(userAgent || "unknown").slice(0, 512),
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
  durationToMs,
  hashToken,
  signAccessToken,
};
