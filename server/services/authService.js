const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Notification = require("../models/Notification");
const PasswordReset = require("../models/PasswordReset");
const RefreshToken = require("../models/RefreshToken");
const Session = require("../models/Session");
const env = require("../config/env");
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

  return User.findOne({ $or: conditions });
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
      newsletter: Boolean(newsletter),
      profile: {
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
        coverImage: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1600&q=80",
        bio: "Reader, builder, and collector of meaningful stories.",
        skills: ["Reading", "Writing", "Reflection"],
        bookmarks: [],
        likedArticles: [],
        savedArticles: [],
        comments: [],
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

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      user.failedLoginAttempts = Number(user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= MAX_FAILED_LOGINS) {
        user.lockUntil = new Date(Date.now() + LOGIN_LOCK_MS);
      }
      await user.save();

      const error = new Error(user.lockUntil ? "Too many failed attempts. Please try again later." : "Incorrect password.");
      error.status = 401;
      error.code = "INCORRECT_PASSWORD";
      throw error;
    }

    if (!user.verified.email && !user.verified.mobile) {
      const error = new Error("Please verify your account before logging in.");
      error.status = 403;
      throw error;
    }

    user.lastLoginAt = new Date();
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const session = await createAuthSession({
      user,
      req,
      res,
      remember: Boolean(remember),
    });

    return { session, user };
  }

  async sendOtp({ identifier, userId, channel, purpose = "register" }) {
    const user = userId
      ? await User.findOne({ _id: userId, isDeleted: false })
      : await findUserByIdentifier(identifier);
    if (!user) {
      const error = new Error("No active user account found matching those details.");
      error.status = 404;
      throw error;
    }

    const destination = channel === "mobile" ? user.mobile : user.email;
    if (!destination) {
      const error = new Error(`User does not have a valid ${channel} on file.`);
      error.status = 400;
      throw error;
    }

    return createOtpChallenge({
      user,
      channel,
      purpose,
      identifier: destination,
    });
  }

  async resendOtp(challengeId) {
    return resendOtpChallenge(challengeId);
  }

  async verifyOtp(body, req, res) {
    const challenge = await verifyOtpChallenge(body);
    const user = challenge.user;

    if (body.purpose === "password-reset") {
      const resetToken = crypto.randomBytes(32).toString("hex");
      await PasswordReset.create({
        user: user._id,
        tokenHash: resetTokenHash(resetToken),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      });

      return { user, resetToken, isPasswordReset: true };
    }

    user.verified[challenge.channel] = true;
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

      await activityLogService.createLog({
        action: "PASSWORD_RESET_FAILED",
        description: `Password reset requested for non-existent address: ${emailInput}`,
        module: "auth",
        status: "failure",
        ipAddress: requestMeta.ip,
        userAgent: requestMeta.userAgent,
      });

      return { success: true, message: "If the email exists, a password reset link has been sent." };
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
      await emailService.sendPasswordResetEmail({
        to: user.email,
        token: rawToken,
        name: user.firstName,
        requestMeta,
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      await activityLogService.createLog({
        userId: user._id,
        userEmail: user.email,
        action: "PASSWORD_RESET_FAILED",
        description: `Failed to dispatch reset email: ${err.message}`,
        module: "auth",
        status: "failure",
        ipAddress: requestMeta.ip,
        userAgent: requestMeta.userAgent,
      });

      return { success: true, message: "If the email exists, a password reset link has been sent." };
    }

    await activityLogService.createLog({
      userId: user._id,
      userEmail: user.email,
      action: "PASSWORD_RESET_REQUESTED",
      description: `Password reset link dispatched to ${user.email}`,
      module: "auth",
      status: "success",
      ipAddress: requestMeta.ip,
      userAgent: requestMeta.userAgent,
    });

    return { success: true, message: "If the email exists, a password reset link has been sent." };
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
      console.error("[authService] Failed to cleanup expired tokens:", err.message);
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
      await activityLogService.createLog({
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

      await activityLogService.createLog({
        userId: user._id,
        userEmail: user.email,
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
      console.error("[authService] Failed to send password changed notification:", emailErr.message);
    }

    await activityLogService.createLog({
      userId: updatedUser._id,
      userEmail: updatedUser.email,
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
    const tokenRecord = await RefreshToken.findOne({
      tokenHash: hashToken(token),
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenRecord) {
      clearAuthCookies(res);
      const error = new Error("Refresh token expired.");
      error.status = 401;
      throw error;
    }

    const decoded = jwt.verify(token, env.jwtRefreshSecret);
    const user = await User.findById(decoded.sub);

    if (!user) {
      clearAuthCookies(res);
      const error = new Error("User no longer exists.");
      error.status = 401;
      throw error;
    }

    tokenRecord.revokedAt = new Date();
    await tokenRecord.save();
    await Session.updateMany({ refreshToken: tokenRecord._id }, { isActive: false });

    const session = await createAuthSession({ user, req, res });
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
      clearAuthCookies(res);
    }
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
      await activityLogService.createLog({
        userId: user._id,
        userEmail: user.email,
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
      await activityLogService.createLog({
        userId: user._id,
        userEmail: user.email,
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
        await activityLogService.createLog({
          userId: user._id,
          userEmail: user.email,
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
      console.error("[authService] Failed to send password changed notification email:", emailErr.message);
    }

    await activityLogService.createLog({
      userId: updatedUser._id,
      userEmail: updatedUser.email,
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
