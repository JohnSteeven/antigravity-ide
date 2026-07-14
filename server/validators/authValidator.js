const { body } = require("express-validator");

const registerValidator = [
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
  body("username")
    .trim()
    .isLength({ min: 3, max: 32 })
    .withMessage("Username must be between 3 and 32 characters."),
  body("email")
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("Must be a valid email address."),
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
    .withMessage("Password does not meet the complexity requirements."),
  body("acceptTerms")
    .custom((value) => value === true || value === "true")
    .withMessage("Terms and conditions must be accepted."),
];

const sendOtpValidator = [
  body("channel")
    .isIn(["email", "mobile"])
    .withMessage("Channel must be email or mobile."),
  body("purpose")
    .isIn(["register", "login-otp", "password-reset"])
    .withMessage("Invalid purpose for OTP challenge."),
  body("userId")
    .optional()
    .isMongoId()
    .withMessage("User ID must be a valid Mongo ID."),
  body("identifier")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Identifier cannot be empty."),
];

const resendOtpValidator = [
  body("challengeId")
    .isMongoId()
    .withMessage("Challenge ID must be a valid Mongo ID."),
];

const verifyOtpValidator = [
  body("challengeId")
    .isMongoId()
    .withMessage("Challenge ID must be a valid Mongo ID."),
  body("code")
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage("OTP code must be a 6-digit number."),
  body("purpose")
    .isIn(["register", "login-otp", "password-reset"])
    .withMessage("Invalid purpose for OTP verification."),
];

const loginValidator = [
  body("identifier")
    .trim()
    .notEmpty()
    .withMessage("Email/mobile identifier is required."),
  body("password")
    .notEmpty()
    .withMessage("Password is required."),
];

const loginOtpRequestValidator = [
  body("identifier")
    .trim()
    .notEmpty()
    .withMessage("Identifier is required."),
  body("channel")
    .isIn(["email", "mobile"])
    .withMessage("Channel must be email or mobile."),
];

const forgotPasswordValidator = [
  body("identifier")
    .trim()
    .notEmpty()
    .withMessage("Identifier is required."),
  body("channel")
    .isIn(["email", "mobile"])
    .withMessage("Channel must be email or mobile."),
];

const resetPasswordValidator = [
  body("resetToken")
    .trim()
    .notEmpty()
    .withMessage("Reset token is required."),
  body("password")
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage("Password does not meet the complexity requirements."),
];

module.exports = {
  registerValidator,
  sendOtpValidator,
  resendOtpValidator,
  verifyOtpValidator,
  loginValidator,
  loginOtpRequestValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
};
