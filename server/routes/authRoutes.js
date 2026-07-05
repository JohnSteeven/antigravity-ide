const crypto = require("crypto");
const bcrypt = require("bcrypt");
const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const env = require("../config/env");
const User = require("../models/User");
const Notification = require("../models/Notification");
const OTP = require("../models/OTP");
const PasswordReset = require("../models/PasswordReset");
const RefreshToken = require("../models/RefreshToken");
const Session = require("../models/Session");
const { authenticate } = require("../middleware/auth");
const { authLimiter, issueCsrfToken } = require("../middleware/security");
const { handleValidation } = require("../middleware/errorHandler");
const {
  clearAuthCookies,
  createAuthSession,
  hashToken,
} = require("../services/tokenService");
const {
  createOtpChallenge,
  verifyOtpChallenge,
} = require("../services/otpService");

const router = express.Router();
const validate = handleValidation(validationResult);
const MAX_FAILED_LOGINS = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

const findUserByIdentifier = (identifier) => {
  const rawValue = String(identifier || "").trim();
  const value = rawValue.toLowerCase();
  const compactMobile = rawValue.replace(/\s+/g, "");
  const mobileDigits = rawValue.replace(/\D/g, "");
  const conditions = [{ email: value }, { mobile: compactMobile }];

  if (mobileDigits.length >= 10) {
    conditions.push({ mobile: { $regex: `${mobileDigits}$` } });
  }

  return User.findOne({
    $or: conditions,
  });
};

const safeUser = (user) => {
  const safe = user.toSafeJSON ? user.toSafeJSON() : user;

  if (safe?._id && !safe.id) {
    safe.id = safe._id.toString();
  }

  return safe;
};

const resetTokenHash = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

router.get("/csrf-token", issueCsrfToken);

router.get("/me", authenticate, async (req, res) => {
  res.json({
    session: { authenticated: true },
    user: safeUser(req.user),
  });
});

router.post(
  "/register",
  authLimiter,
  [
    body("firstName")
      .trim()
      .isLength({ min: 2, max: 50 })
      .matches(/^[^\d]+$/)
      .withMessage("First name must be 2-50 characters and contain no numbers."),
    body("lastName")
      .trim()
      .isLength({ min: 2, max: 50 })
      .matches(/^[^\d]+$/)
      .withMessage("Last name must be 2-50 characters and contain no numbers."),
    body("username").trim().isLength({ min: 3, max: 32 }),
    body("email").trim().isEmail().normalizeEmail(),
    body("countryCode")
      .trim()
      .matches(/^\+[0-9]{1,4}$/)
      .withMessage("Enter a valid country code."),
    body("mobile")
      .trim()
      .matches(/^[0-9\s-]{10,15}$/)
      .withMessage("Enter a valid mobile number."),
    body("password")
      .isStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage("Password does not meet the requirements."),
    body("acceptTerms")
      .custom((value) => value === true || value === "true")
      .withMessage("Terms and conditions must be accepted."),
  ],
  validate,
  async (req, res, next) => {
    try {
      const {
        firstName,
        lastName,
        username,
        email,
        countryCode,
        mobile,
        password,
        newsletter,
      } = req.body;
      const normalizedMobile = `${countryCode}${String(mobile).replace(/\D/g, "")}`;
      const exists = await User.findOne({
        $or: [
          { email },
          { mobile: normalizedMobile },
          { username: username.trim() },
        ],
      });

      if (exists) {
        return res.status(409).json({
          message: "An account already exists with this email, mobile, or username.",
        });
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
          avatar:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
          coverImage:
            "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1600&q=80",
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

      res.status(201).json({
        user: safeUser(user),
        verificationOptions: {
          email: user.email,
          mobile: user.mobile,
        },
        message: "Account created. Choose how you want to verify it.",
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/send-otp",
  authLimiter,
  [
    body("channel").isIn(["email", "mobile"]),
    body("purpose").isIn(["register", "login-otp", "password-reset"]),
    body("userId").optional().isMongoId(),
    body("identifier").optional().trim().notEmpty(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { userId, identifier, channel, purpose } = req.body;
      const user = userId
        ? await User.findById(userId)
        : await findUserByIdentifier(identifier);

      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }

      const target = channel === "mobile" ? user.mobile : user.email;
      const challenge = await createOtpChallenge({
        user,
        identifier: target,
        channel,
        purpose,
      });

      res.json(challenge);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/resend-otp",
  authLimiter,
  [body("challengeId").isMongoId()],
  validate,
  async (req, res, next) => {
    try {
      const challenge = await OTP.findById(req.body.challengeId).populate("user");

      if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
        return res.status(400).json({
          message: "OTP challenge expired. Please request a new code.",
        });
      }

      if (challenge.resendAvailableAt.getTime() > Date.now()) {
        const waitFor = Math.ceil(
          (challenge.resendAvailableAt.getTime() - Date.now()) / 1000
        );
        return res.status(429).json({
          message: `Please wait ${waitFor} seconds before resending.`,
        });
      }

      const nextChallenge = await createOtpChallenge({
        user: challenge.user,
        identifier: challenge.identifier,
        channel: challenge.channel,
        purpose: challenge.purpose,
      });

      res.json({
        ...nextChallenge,
        message: `A fresh OTP was sent to ${nextChallenge.maskedIdentifier}.`,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/verify-otp",
  authLimiter,
  [
    body("challengeId").isMongoId(),
    body("code").isLength({ min: 6, max: 6 }).isNumeric(),
    body("purpose").isIn(["register", "login-otp", "password-reset"]),
  ],
  validate,
  async (req, res, next) => {
    try {
      const challenge = await verifyOtpChallenge(req.body);
      const user = challenge.user;

      if (req.body.purpose === "password-reset") {
        const resetToken = crypto.randomBytes(32).toString("hex");
        await PasswordReset.create({
          user: user._id,
          tokenHash: resetTokenHash(resetToken),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });

        return res.json({
          user: safeUser(user),
          resetToken,
          message: "OTP verified. You can now set a new password.",
        });
      }

      user.verified[challenge.channel] = true;
      user.lastLoginAt = new Date();
      await user.save();

      const session = await createAuthSession({ user, req, res });

      res.json({
        session,
        user: safeUser(user),
        message:
          req.body.purpose === "login-otp"
            ? "Logged in successfully."
            : "Account verified successfully.",
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/login",
  authLimiter,
  [body("identifier").trim().notEmpty(), body("password").notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const user = await findUserByIdentifier(req.body.identifier);

      if (!user) {
        return res.status(401).json({
          message: "Invalid email/mobile or password.",
        });
      }

      if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
        return res.status(423).json({
          code: "ACCOUNT_LOCKED",
          message: "Too many failed attempts. Please try again later.",
        });
      }

      const matches = await bcrypt.compare(req.body.password, user.passwordHash);

      if (!matches) {
        user.failedLoginAttempts = Number(user.failedLoginAttempts || 0) + 1;
        if (user.failedLoginAttempts >= MAX_FAILED_LOGINS) {
          user.lockUntil = new Date(Date.now() + LOGIN_LOCK_MS);
        }
        await user.save();

        return res.status(401).json({
          code: "INCORRECT_PASSWORD",
          message: user.lockUntil
            ? "Too many failed attempts. Please try again later."
            : "Incorrect password.",
        });
      }

      if (!user.verified.email && !user.verified.mobile) {
        return res.status(403).json({
          message: "Please verify your account before logging in.",
        });
      }

      user.lastLoginAt = new Date();
      user.failedLoginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();

      const session = await createAuthSession({
        user,
        req,
        res,
        remember: Boolean(req.body.remember),
      });

      res.json({
        session,
        user: safeUser(user),
        message: "Welcome back.",
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/login/otp/request",
  authLimiter,
  [body("identifier").trim().notEmpty(), body("channel").isIn(["email", "mobile"])],
  validate,
  async (req, res, next) => {
    try {
      const user = await findUserByIdentifier(req.body.identifier);

      if (!user) {
        return res.status(404).json({
          message: "No account exists for this email or mobile number.",
        });
      }

      const identifier = req.body.channel === "mobile" ? user.mobile : user.email;
      const challenge = await createOtpChallenge({
        user,
        identifier,
        channel: req.body.channel,
        purpose: "login-otp",
      });

      res.json(challenge);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/forgot-password",
  authLimiter,
  [body("identifier").trim().notEmpty(), body("channel").isIn(["email", "mobile"])],
  validate,
  async (req, res, next) => {
    try {
      const user = await findUserByIdentifier(req.body.identifier);

      if (!user) {
        return res.status(404).json({
          message: "No account exists for this email or mobile number.",
        });
      }

      const identifier = req.body.channel === "mobile" ? user.mobile : user.email;
      const challenge = await createOtpChallenge({
        user,
        identifier,
        channel: req.body.channel,
        purpose: "password-reset",
      });

      res.json(challenge);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/reset-password",
  authLimiter,
  [
    body("resetToken").trim().notEmpty(),
    body("password").isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const reset = await PasswordReset.findOne({
        tokenHash: resetTokenHash(req.body.resetToken),
        usedAt: null,
        expiresAt: { $gt: new Date() },
      });

      if (!reset) {
        return res.status(400).json({
          message: "Password reset link expired. Please request a fresh OTP.",
        });
      }

      const user = await User.findById(reset.user);
      user.passwordHash = await bcrypt.hash(req.body.password, 12);
      await user.save();

      reset.usedAt = new Date();
      await reset.save();
      await RefreshToken.updateMany({ user: user._id }, { revokedAt: new Date() });
      await Session.updateMany({ user: user._id }, { isActive: false });
      clearAuthCookies(res);

      res.json({ message: "Password updated successfully. Please login again." });
    } catch (error) {
      next(error);
    }
  }
);

router.post("/refresh-token", async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required." });
    }

    const tokenRecord = await RefreshToken.findOne({
      tokenHash: hashToken(refreshToken),
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (!tokenRecord) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Refresh token expired." });
    }

    const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret);
    const user = await User.findById(decoded.sub);

    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "User no longer exists." });
    }

    tokenRecord.revokedAt = new Date();
    await tokenRecord.save();
    await Session.updateMany({ refreshToken: tokenRecord._id }, { isActive: false });

    const session = await createAuthSession({ user, req, res });

    res.json({
      session,
      user: safeUser(user),
      message: "Session refreshed.",
    });
  } catch (error) {
    clearAuthCookies(res);
    next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
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
    res.json({ message: "Logged out." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
