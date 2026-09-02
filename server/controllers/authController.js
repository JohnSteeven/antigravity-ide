const authService = require("../services/authService");

const safeUser = (user) => {
  const safe = user.toSafeJSON ? user.toSafeJSON() : user;
  if (safe?._id && !safe.id) {
    safe.id = safe._id.toString();
  }
  return safe;
};

class AuthController {
  async me(req, res, next) {
    try {
      const safe = safeUser(req.user);

      res.json({
        session: { authenticated: true },
        user: safe,
      });
    } catch (err) {
      next(err);
    }
  }

  async register(req, res, next) {
    try {
      const user = await authService.register(req.body);
      res.status(201).json({
        user: safeUser(user),
        verificationOptions: {
          email: user.email,
          mobile: user.mobile,
        },
        message: "Account created. Choose how you want to verify it.",
      });
    } catch (err) {
      next(err);
    }
  }

  async sendOtp(req, res, next) {
    try {
      const challenge = await authService.sendOtp(req.body);
      res.json(challenge);
    } catch (err) {
      next(err);
    }
  }

  async resendOtp(req, res, next) {
    try {
      const challenge = await authService.resendOtp(req.body.challengeId);
      res.json({
        ...challenge,
        message: `A fresh OTP was sent to ${challenge.maskedIdentifier}.`,
      });
    } catch (err) {
      next(err);
    }
  }

  async verifyOtp(req, res, next) {
    try {
      const result = await authService.verifyOtp(req.body, req, res);
      if (result.isPasswordReset) {
        return res.json({
          user: safeUser(result.user),
          resetToken: result.resetToken,
          message: "OTP verified. You can now set a new password.",
        });
      }

      const safe = safeUser(result.user);

      res.json({
        session: result.session,
        user: safe,
        message:
          req.body.purpose === "login-otp"
            ? "Logged in successfully."
            : "Account verified successfully.",
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { identifier, password, remember } = req.body;
      const { session, user } = await authService.login(identifier, password, remember, req, res);

      const safe = safeUser(user);

      res.json({
        session,
        user: safe,
        message: "Welcome back.",
      });
    } catch (err) {
      next(err);
    }
  }

  async requestLoginOtp(req, res, next) {
    try {
      const challenge = await authService.sendOtp({
        identifier: req.body.identifier,
        channel: req.body.channel,
        purpose: "login-otp",
      });
      res.json(challenge);
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const emailOrIdentifier = req.body.email || req.body.identifier;
      const result = await authService.requestPasswordReset(emailOrIdentifier, req);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async validateResetToken(req, res, next) {
    try {
      const token = req.params.token;
      const result = await authService.validateResetToken(token);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const token = req.params.token || req.body.token || req.body.resetToken;
      const { password, confirmPassword } = req.body;
      const result = await authService.resetPasswordWithToken(token, password, confirmPassword, req, res);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const token = req.cookies.refreshToken;
      if (!token) return res.status(401).json({ message: "Refresh token required." });

      const { session, user } = await authService.refreshToken(token, req, res);

      const safe = safeUser(user);

      res.json({
        session,
        user: safe,
        message: "Session refreshed.",
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      const token = req.cookies.refreshToken;
      await authService.logout(token, res);
      res.json({ message: "Logged out." });
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(req.user._id, currentPassword, newPassword, req, res);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
