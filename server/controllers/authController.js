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
      res.json({
        session: { authenticated: true },
        user: safeUser(req.user),
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
      const challenge = await authService.sendOtp(req.body);
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

      res.json({
        session: result.session,
        user: safeUser(result.user),
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
      res.json({
        session,
        user: safeUser(user),
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
      const challenge = await authService.sendOtp({
        identifier: req.body.identifier,
        channel: req.body.channel,
        purpose: "password-reset",
      });
      res.json(challenge);
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { resetToken, password } = req.body;
      await authService.resetPassword(resetToken, password, res);
      res.json({ message: "Password updated successfully. Please login again." });
    } catch (err) {
      next(err);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const token = req.cookies.refreshToken || req.body.refreshToken;
      if (!token) return res.status(401).json({ message: "Refresh token required." });
      
      const { session, user } = await authService.refreshToken(token, req, res);
      res.json({
        session,
        user: safeUser(user),
        message: "Session refreshed.",
      });
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      const token = req.cookies.refreshToken || req.body.refreshToken;
      await authService.logout(token, res);
      res.json({ message: "Logged out." });
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new passwords are required." });
      }
      await authService.changePassword(req.user._id, currentPassword, newPassword);
      res.json({ success: true, message: "Password updated successfully." });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
