const { body } = require("express-validator");

const contactMessageValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required."),
  body("email")
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("A valid email is required."),
  body("subject")
    .trim()
    .notEmpty()
    .withMessage("Subject is required.")
    .isLength({ max: 200 })
    .withMessage("Subject cannot exceed 200 characters."),
  body("inquiryType")
    .optional({ checkFalsy: true })
    .trim(),
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required.")
    .isLength({ max: 2000 })
    .withMessage("Message cannot exceed 2000 characters."),
];

module.exports = {
  contactMessageValidator,
};
