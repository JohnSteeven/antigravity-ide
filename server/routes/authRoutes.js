const express = require("express");
const { validationResult } = require("express-validator");
const {
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
const { authLimiter, issueCsrfToken } = require("../middleware/security");
const { handleValidation } = require("../middleware/errorHandler");

const router = express.Router();
const validate = handleValidation(validationResult);

router.get("/csrf-token", issueCsrfToken);
router.get("/me", authenticate, authController.me);

router.post("/register", authLimiter, registerValidator, validate, authController.register);
router.post("/send-otp", authLimiter, sendOtpValidator, validate, authController.sendOtp);
router.post("/resend-otp", authLimiter, resendOtpValidator, validate, authController.resendOtp);
router.post("/verify-otp", authLimiter, verifyOtpValidator, validate, authController.verifyOtp);

router.post("/login", authLimiter, loginValidator, validate, authController.login);
router.post("/login/otp/request", authLimiter, loginOtpRequestValidator, validate, authController.requestLoginOtp);

router.post("/forgot-password", authLimiter, forgotPasswordValidator, validate, authController.forgotPassword);
router.post("/reset-password", authLimiter, resetPasswordValidator, validate, authController.resetPassword);

router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);
router.post("/change-password", authenticate, authController.changePassword);

module.exports = router;
