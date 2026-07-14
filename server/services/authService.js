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
  const conditions = [{ email: value }, { mobile: compactMobile }];

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

  async sendOtp({ userId, identifier, channel, purpose }) {
    const user = userId
      ? await User.findById(userId)
      : await findUserByIdentifier(identifier);

    if (!user) {
      const error = new Error("User not found.");
      error.status = 404;
      throw error;
    }

    const target = channel === "mobile" ? user.mobile : user.email;
    return createOtpChallenge({
      user,
      identifier: target,
      channel,
      purpose,
    });
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

  async resetPassword(resetToken, password, res) {
    const reset = await PasswordReset.findOne({
      tokenHash: resetTokenHash(resetToken),
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!reset) {
      const error = new Error("Password reset link expired. Please request a fresh OTP.");
      error.status = 400;
      throw error;
    }

    const user = await User.findById(reset.user);
    user.passwordHash = await bcrypt.hash(password, 12);
    await user.save();

    reset.usedAt = new Date();
    await reset.save();
    await RefreshToken.updateMany({ user: user._id }, { revokedAt: new Date() });
    await Session.updateMany({ user: user._id }, { isActive: false });
    clearAuthCookies(res);
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

  async changePassword(userId, currentPassword, newPassword) {
    const User = require("../models/User");
    const bcrypt = require("bcrypt");
    const activityLogRepository = require("../repositories/activityLogRepository");

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found.");
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new Error("Incorrect current password.");
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.tokenVersion = (user.tokenVersion || 0) + 1; // force logout other devices
    user.lastPasswordChange = new Date();
    await user.save();

    await activityLogRepository.create({
      userId,
      action: "user_password_change",
      description: `User @${user.username} successfully changed password.`,
      module: "auth",
      status: "success",
    });

    return user;
  }
}

module.exports = new AuthService();
