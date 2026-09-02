const express = require("express");
const { validationResult } = require("express-validator");
const {
  changePasswordValidator,
  registerValidator,
  sendOtpValidator,
  resendOtpValidator,
  verifyOtpValidator,
  loginValidator,
  loginOtpRequestValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require("../validators/authValidator");
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { authLimiter, changePasswordLimiter, emailRateLimiter, issueCsrfToken, otpAccountLimiter } = require("../middleware/security");
const { handleValidation } = require("../middleware/errorHandler");

const router = express.Router();
const validate = handleValidation(validationResult);

router.get("/csrf-token", issueCsrfToken);
router.get("/me", authenticate, authController.me);

router.post("/register", authLimiter, registerValidator, validate, authController.register);
router.post("/send-otp", authLimiter, otpAccountLimiter, sendOtpValidator, validate, authController.sendOtp);
router.post("/resend-otp", authLimiter, otpAccountLimiter, resendOtpValidator, validate, authController.resendOtp);
router.post("/verify-otp", authLimiter, verifyOtpValidator, validate, authController.verifyOtp);

router.post("/login", authLimiter, loginValidator, validate, authController.login);
router.post("/login/otp/request", authLimiter, otpAccountLimiter, loginOtpRequestValidator, validate, authController.requestLoginOtp);

router.post("/forgot-password", authLimiter, emailRateLimiter, forgotPasswordValidator, validate, authController.forgotPassword);
router.get("/reset-password/validate/:token", authLimiter, authController.validateResetToken);
router.post("/reset-password", authLimiter, resetPasswordValidator, validate, authController.resetPassword);
router.post("/reset-password/:token", authLimiter, resetPasswordValidator, validate, authController.resetPassword);

router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);
router.post("/change-password", authenticate, changePasswordLimiter, changePasswordValidator, validate, authController.changePassword);

module.exports = router;
