const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Notification = require("../models/Notification");
const RefreshToken = require("../models/RefreshToken");
const Session = require("../models/Session");
const env = require("../config/env");
const activityLogService = require("./activityLogService");
const emailService = require("./emailService");
const {
  createAuthSession,
  clearAuthCookies,
  hashToken,
} = require("./tokenService");
const {
  createOtpChallenge,
  resendOtpChallenge,
  verifyOtpChallenge,
} = require("./otpService");

const MAX_FAILED_LOGINS = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
const DUMMY_PASSWORD_HASH = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6Ttxz7B3ceqHc4e/ANd7bYNbUimG2";
const PASSWORD_RESET_MESSAGE = "If the email exists and delivery is available, a password reset link will be sent.";

const extractRequestMeta = (req) => ({
  ip: req?.ip || req?.headers?.["x-forwarded-for"] || "unknown",
  userAgent: req?.headers?.["user-agent"] || "unknown",
  browser: "Web Browser",
  device: "Unknown Device",
  time: new Date().toUTCString(),
  requestId: req?.id || req?.headers?.["x-request-id"],
});

const safeAudit = (data) => activityLogService.createLog(data).catch(() => {});

const resetTokenHash = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const findUserByIdentifier = (identifier) => {
  const rawValue = String(identifier || "").trim();
  const value = rawValue.toLowerCase();
  const compactMobile = rawValue.replace(/\s+/g, "");
  const mobileDigits = rawValue.replace(/\D/g, "");
  const conditions = [{ email: value }, { username: value }, { mobile: compactMobile }];

  if (mobileDigits.length >= 10) {
    conditions.push({ mobile: { $regex: `${mobileDigits}$` } });
  }

  return User.findOne({ $or: conditions, isDeleted: false });
};

class AuthService {
  async register(data) {
    const {
      firstName,
      lastName,
      username,
      email,
      countryCode,
      mobile,
      password,
      newsletter,
    } = data;
    const normalizedMobile = `${countryCode}${String(mobile).replace(/\D/g, "")}`;

    const exists = await User.findOne({
      $or: [
        { email },
        { mobile: normalizedMobile },
        { username: username.trim() },
      ],
    });

    if (exists) {
      const error = new Error("An account already exists with this email, mobile, or username.");
      error.status = 409;
      throw error;
    }

    const user = await User.create({
      firstName,
      lastName,
      username,
      email,
      countryCode,
      mobile: normalizedMobile,
      passwordHash: await bcrypt.hash(password, 12),
      status: "PENDING_VERIFICATION",
      newsletter: Boolean(newsletter),
      profile: {
        avatar: "",
        coverImage: "",
        bio: "",
        location: "",
        website: "",
        skills: [],
      },
    });

    await Notification.create({
      user: user._id,
      title: "Welcome to MyJourney",
      message: "Verify your account to unlock your profile.",
    });

    return user;
  }

  async login(identifier, password, remember, req, res) {
    const user = await findUserByIdentifier(identifier);
    if (!user) {
      await bcrypt.compare(String(password || ""), DUMMY_PASSWORD_HASH);
      const error = new Error("Invalid email/mobile or password.");
      error.status = 401;
      throw error;
    }

    if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
      const error = new Error("Too many failed attempts. Please try again later.");
      error.status = 423;
      error.code = "ACCOUNT_LOCKED";
      throw error;
    }

    if (user.lockUntil) {
      await User.updateOne(
        { _id: user._id, lockUntil: { $lte: new Date() } },
        { $set: { failedLoginAttempts: 0 }, $unset: { lockUntil: 1 } }
      );
      user.failedLoginAttempts = 0;
      user.lockUntil = undefined;
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      const failedUser = await User.findOneAndUpdate(
        { _id: user._id },
        { $inc: { failedLoginAttempts: 1 } },
        { new: true }
      );
      if (Number(failedUser?.failedLoginAttempts || 0) >= MAX_FAILED_LOGINS) {
        await User.updateOne(
          { _id: user._id },
          { $set: { lockUntil: new Date(Date.now() + LOGIN_LOCK_MS) } }
        );
      }

      const error = new Error(
        Number(failedUser?.failedLoginAttempts || 0) >= MAX_FAILED_LOGINS
          ? "Too many failed attempts. Please try again later."
          : "Invalid email/mobile or password."
      );
      error.status = Number(failedUser?.failedLoginAttempts || 0) >= MAX_FAILED_LOGINS ? 423 : 401;
      error.code = Number(failedUser?.failedLoginAttempts || 0) >= MAX_FAILED_LOGINS
        ? "ACCOUNT_LOCKED"
        : "INVALID_CREDENTIALS";
      throw error;
    }

    if (user.status !== "ACTIVE" || user.isDeleted) {
      const error = new Error("This account is not available for sign in.");
      error.status = 403;
      error.code = "ACCOUNT_UNAVAILABLE";
      throw error;
    }

    if (!user.verified.email && !user.verified.mobile) {
      const error = new Error("Please verify your account before logging in.");
      error.status = 403;
      throw error;
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: { lastLoginAt: new Date(), failedLoginAttempts: 0 },
        $unset: { lockUntil: 1 },
      }
    );
    user.lastLoginAt = new Date();
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;

    const session = await createAuthSession({
      user,
      req,
      res,
      remember: Boolean(remember),
    });

    return { session, user };
  }

  async sendOtp({ identifier, userId, channel, purpose = "register" }) {
    const user = purpose === "register" && userId
      ? await User.findOne({ _id: userId, isDeleted: false })
      : await findUserByIdentifier(identifier);
    if (!user) {
      if (purpose === "register") {
        const error = new Error("Registration could not be verified. Please start again.");
        error.status = 400;
        throw error;
      }
      await bcrypt.hash("dummy_otp_timing_workload", 10);
      const now = Date.now();
      return {
        id: crypto.randomBytes(12).toString("hex"),
        channel,
        purpose,
        maskedIdentifier: channel === "email" ? "your email" : "your mobile number",
        expiresAt: now + 5 * 60 * 1000,
        resendAfter: now + 60 * 1000,
        message: "If an eligible account exists, an OTP will be sent.",
      };
    }

    if (purpose !== "register" && (user.status !== "ACTIVE" || user.isDeleted)) {
      await bcrypt.hash("dummy_otp_timing_workload", 10);
      const now = Date.now();
      return {
        id: crypto.randomBytes(12).toString("hex"),
        channel,
        purpose,
        maskedIdentifier: channel === "email" ? "your email" : "your mobile number",
        expiresAt: now + 5 * 60 * 1000,
        resendAfter: now + 60 * 1000,
        message: "If an eligible account exists, an OTP will be sent.",
      };
    }

    const destination = channel === "mobile" ? user.mobile : user.email;
    if (!destination) {
      const error = new Error(`User does not have a valid ${channel} on file.`);
      error.status = 400;
      throw error;
    }

    const challenge = await createOtpChallenge({
      user,
      channel,
      purpose,
      identifier: destination,
    });
    return purpose === "register" ? challenge : {
      ...challenge,
      maskedIdentifier: channel === "email" ? "your email" : "your mobile number",
      message: "If an eligible account exists, an OTP will be sent.",
    };
  }

  async resendOtp(challengeId) {
    return resendOtpChallenge(challengeId);
  }

  async verifyOtp(body, req, res) {
    const challenge = await verifyOtpChallenge(body);
    const user = challenge.user;

    if (!user || user.isDeleted) {
      const error = new Error("OTP challenge is no longer valid.");
      error.status = 400;
      throw error;
    }

    if (body.purpose === "password-reset") {
      if (user.status !== "ACTIVE") {
        const error = new Error("OTP challenge is no longer valid.");
        error.status = 400;
        throw error;
      }
      const resetToken = crypto.randomBytes(32).toString("hex");
      await User.updateOne(
        { _id: user._id, status: "ACTIVE", isDeleted: false },
        {
          $set: {
            passwordResetToken: resetTokenHash(resetToken),
            passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000),
          },
        }
      );

      return { user, resetToken, isPasswordReset: true };
    }

    if (body.purpose === "login-otp" && user.status !== "ACTIVE") {
      const error = new Error("OTP challenge is no longer valid.");
      error.status = 400;
      throw error;
    }
    user.verified[challenge.channel] = true;
    if (body.purpose === "register") user.status = "ACTIVE";
    user.lastLoginAt = new Date();
    await user.save();

    const session = await createAuthSession({ user, req, res });
    return { session, user, isPasswordReset: false };
  }

  async requestPasswordReset(identifierOrEmail, req) {
    const requestMeta = extractRequestMeta(req);
    const emailInput = String(identifierOrEmail || "").toLowerCase().trim();

    const user = await User.findOne({
      $or: [{ email: emailInput }, { username: emailInput }],
      isDeleted: false,
    });

    if (!user) {
      await bcrypt.hash("dummy_timing_workload", 10);

      await safeAudit({
        action: "PASSWORD_RESET_FAILED",
        description: "Password reset requested for an unknown account identifier.",
        module: "auth",
        status: "failure",
        ipAddress: requestMeta.ip,
        userAgent: requestMeta.userAgent,
      });

      return { success: true, message: PASSWORD_RESET_MESSAGE };
    }

    if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = resetTokenHash(rawToken);

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    try {
      const delivery = await emailService.sendPasswordResetEmail({
        to: user.email,
        token: rawToken,
        name: user.firstName,
        requestMeta,
      });
      if (delivery?.delivered === false) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        await safeAudit({
          userId: user._id,
          action: "PASSWORD_RESET_DELIVERY_UNAVAILABLE",
          description: "Password reset delivery provider was unavailable.",
          module: "auth",
          status: "failure",
          ipAddress: requestMeta.ip,
          userAgent: requestMeta.userAgent,
        });
        return { success: true, message: PASSWORD_RESET_MESSAGE };
      }
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      await safeAudit({
        userId: user._id,
        action: "PASSWORD_RESET_FAILED",
        description: "Password reset email dispatch failed.",
        module: "auth",
        status: "failure",
        ipAddress: requestMeta.ip,
        userAgent: requestMeta.userAgent,
      });

      return { success: true, message: PASSWORD_RESET_MESSAGE };
    }

    await safeAudit({
      userId: user._id,
      action: "PASSWORD_RESET_REQUESTED",
      description: "Password reset link dispatched.",
      module: "auth",
      status: "success",
      ipAddress: requestMeta.ip,
      userAgent: requestMeta.userAgent,
    });

    return { success: true, message: PASSWORD_RESET_MESSAGE };
  }

  async validateResetToken(rawToken) {
    if (!rawToken || typeof rawToken !== "string") {
      return { valid: false, reason: "invalid", message: "Password reset token is required." };
    }

    const hashedToken = resetTokenHash(rawToken.trim());
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      isDeleted: false,
    }).select("+passwordResetExpires");

    if (!user) {
      return { valid: false, reason: "invalid", message: "This password reset link is invalid or has already been used." };
    }

    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      return { valid: false, reason: "expired", message: "This password reset link has expired. Request a new one." };
    }

    return { valid: true, email: user.email };
  }

  async cleanupExpiredTokens() {
    try {
      await User.updateMany(
        { passwordResetExpires: { $lt: new Date() } },
        { $unset: { passwordResetToken: 1, passwordResetExpires: 1 } }
      );
    } catch (err) {
      console.error('[authService] Failed to clean up expired tokens.', { errorType: err?.name || 'Error' });
    }
  }

  async resetPasswordWithToken(rawToken, password, confirmPassword, req, res) {
    const requestMeta = extractRequestMeta(req);
    if (!rawToken || typeof rawToken !== "string") {
      const error = new Error("Password reset token is required.");
      error.status = 400;
      throw error;
    }

    const hashedToken = resetTokenHash(rawToken.trim());

    // 1. Fetch user to check password history
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      isDeleted: false,
    }).select("+passwordHash +passwordHistory +passwordResetToken +passwordResetExpires");

    if (!user) {
      await safeAudit({
        action: "PASSWORD_RESET_FAILED",
        description: "Attempted password reset with invalid or non-existent token",
        module: "auth",
        status: "failure",
        ipAddress: requestMeta.ip,
        userAgent: requestMeta.userAgent,
      });

      const error = new Error("Password reset link is invalid or has already been used.");
      error.status = 400;
      throw error;
    }

    // 2. Check Expiry
    if (!user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      await safeAudit({
        userId: user._id,
        action: "PASSWORD_RESET_TOKEN_EXPIRED",
        description: "Attempted password reset with an expired token",
        module: "auth",
        status: "failure",
        ipAddress: requestMeta.ip,
        userAgent: requestMeta.userAgent,
      });

      const error = new Error("This password reset link has expired. Request a new one.");
      error.status = 400;
      throw error;
    }

    // 3. Password History Check (Current + Last 5 passwords)
    const isSameCurrent = await bcrypt.compare(password, user.passwordHash);
    if (isSameCurrent) {
      const error = new Error("New password cannot be the same as your current password.");
      error.status = 400;
      throw error;
    }

    const historyHashes = user.passwordHistory || [];
    for (const oldHash of historyHashes) {
      const isHistoricalMatch = await bcrypt.compare(password, oldHash);
      if (isHistoricalMatch) {
        const error = new Error("New password cannot be one of your last 5 passwords.");
        error.status = 400;
        throw error;
      }
    }

    // 4. Single Atomic findOneAndUpdate Operation (prevents parallel tab consumption)
    const newPasswordHash = await bcrypt.hash(password, 12);
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
      },
      {
        $set: {
          passwordHash: newPasswordHash,
          lastPasswordChange: new Date(),
        },
        $inc: { tokenVersion: 1 },
        $unset: { passwordResetToken: 1, passwordResetExpires: 1 },
        $push: {
          passwordHistory: {
            $each: [user.passwordHash],
            $slice: -5, // keep max 5 recent hashes
          },
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      const error = new Error("Password reset link is invalid or has already been consumed.");
      error.status = 400;
      throw error;
    }

    // 5. Invalidate Sessions & Clear Cookies
    await RefreshToken.updateMany({ user: updatedUser._id }, { revokedAt: new Date() });
    await Session.updateMany({ user: updatedUser._id }, { isActive: false });
    clearAuthCookies(res);

    // 6. Security Email & Audit Log
    try {
      await emailService.sendPasswordChangedNotificationEmail({
        to: updatedUser.email,
        name: updatedUser.firstName,
        requestMeta,
      });
    } catch (emailErr) {
      console.error('[authService] Password-change notification failed.', { errorType: emailErr?.name || 'Error' });
    }

    await safeAudit({
      userId: updatedUser._id,
      action: "PASSWORD_RESET_COMPLETED",
      description: "Password reset completed successfully via atomic update. All active sessions revoked.",
      module: "auth",
      status: "success",
      ipAddress: requestMeta.ip,
      userAgent: requestMeta.userAgent,
    });

    return {
      success: true,
      message: "Password updated successfully. For your security, you've been signed out on all devices. Please sign in again.",
    };
  }

  async resetPassword(resetToken, password, res) {
    return this.resetPasswordWithToken(resetToken, password, password, null, res);
  }

  async refreshToken(token, req, res) {
    let decoded;
    try {
      decoded = jwt.verify(token, env.jwtRefreshSecret, { algorithms: ["HS256"] });
    } catch (error) {
      clearAuthCookies(res);
      const invalid = new Error("Refresh token expired.");
      invalid.status = 401;
      throw invalid;
    }

    const tokenRecord = await RefreshToken.findOneAndUpdate(
      {
        tokenHash: hashToken(token),
        user: decoded.sub,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      },
      { $set: { revokedAt: new Date() } },
      { new: false }
    );

    if (!tokenRecord) {
      clearAuthCookies(res);
      const error = new Error("Refresh token expired.");
      error.status = 401;
      throw error;
    }

    const user = await User.findById(decoded.sub);

    if (!user || user.status !== "ACTIVE" || user.isDeleted) {
      clearAuthCookies(res);
      const error = new Error("Account is unavailable.");
      error.status = 401;
      throw error;
    }

    await Session.updateMany({ refreshToken: tokenRecord._id }, { isActive: false });

    const remainingMs = (Number(decoded.exp || 0) * 1000) - Date.now();
    const session = await createAuthSession({
      user,
      req,
      res,
      remember: remainingMs > 2 * 24 * 60 * 60 * 1000,
    });
    return { session, user };
  }

  async logout(token, res) {
    if (token) {
      const tokenHash = hashToken(token);
      const tokenRecord = await RefreshToken.findOneAndUpdate(
        { tokenHash },
        { revokedAt: new Date() }
      );

      if (tokenRecord) {
        await Session.updateMany(
          { refreshToken: tokenRecord._id },
          { isActive: false }
        );
      }
    }
    clearAuthCookies(res);
  }

  async changePassword(userId, currentPassword, newPassword, req, res) {
    const requestMeta = extractRequestMeta(req);
    const user = await User.findById(userId).select("+passwordHash +passwordHistory");
    if (!user) {
      const error = new Error("User not found.");
      error.status = 404;
      throw error;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      await safeAudit({
        userId: user._id,
        action: "INVALID_CURRENT_PASSWORD",
        description: "Failed password change attempt: Incorrect current password",
        module: "auth",
        status: "failure",
        ipAddress: requestMeta.ip,
        userAgent: requestMeta.userAgent,
        metadata: {
          requestId: requestMeta.requestId,
          country: requestMeta.country,
          city: requestMeta.city,
          browser: requestMeta.browser,
          os: requestMeta.os,
          device: requestMeta.device,
        },
      });

      const error = new Error("Current password is incorrect.");
      error.status = 400;
      throw error;
    }

    const isSameCurrent = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSameCurrent) {
      await safeAudit({
        userId: user._id,
        action: "PASSWORD_REUSED",
        description: "Failed password change attempt: Proposed password matches current password",
        module: "auth",
        status: "failure",
        ipAddress: requestMeta.ip,
        userAgent: requestMeta.userAgent,
      });

      const error = new Error("New password cannot be the same as your current password.");
      error.status = 400;
      throw error;
    }

    const historyHashes = user.passwordHistory || [];
    for (const oldHash of historyHashes) {
      const isHistoricalMatch = await bcrypt.compare(newPassword, oldHash);
      if (isHistoricalMatch) {
        await safeAudit({
          userId: user._id,
          action: "PASSWORD_REUSED",
          description: "Failed password change attempt: Proposed password exists in recent password history",
          module: "auth",
          status: "failure",
          ipAddress: requestMeta.ip,
          userAgent: requestMeta.userAgent,
        });

        const error = new Error("New password cannot be one of your last 5 passwords.");
        error.status = 400;
        throw error;
      }
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    const limit = env.passwordHistoryLimit || 5;

    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      {
        $set: {
          passwordHash: newPasswordHash,
          lastPasswordChange: new Date(),
        },
        $inc: { tokenVersion: 1 },
        $push: {
          passwordHistory: {
            $each: [user.passwordHash],
            $slice: -limit,
          },
        },
      },
      { new: true }
    );

    await RefreshToken.updateMany({ user: updatedUser._id }, { revokedAt: new Date() });
    await Session.updateMany({ user: updatedUser._id }, { isActive: false });
    clearAuthCookies(res);

    try {
      await emailService.sendPasswordChangedNotificationEmail({
        to: updatedUser.email,
        name: updatedUser.firstName,
        requestMeta,
      });
    } catch (emailErr) {
      console.error('[authService] Password-change notification failed.', { errorType: emailErr?.name || 'Error' });
    }

    await safeAudit({
      userId: updatedUser._id,
      action: "PASSWORD_CHANGED",
      description: "User successfully updated password from account security. All active sessions revoked.",
      module: "auth",
      status: "success",
      ipAddress: requestMeta.ip,
      userAgent: requestMeta.userAgent,
      metadata: {
        requestId: requestMeta.requestId,
        country: requestMeta.country,
        city: requestMeta.city,
        browser: requestMeta.browser,
        os: requestMeta.os,
        device: requestMeta.device,
        timestamp: new Date().toISOString(),
      },
    });

    return {
      success: true,
      message: "Password changed successfully. All active sessions have been revoked.",
    };
  }
}

module.exports = new AuthService();
