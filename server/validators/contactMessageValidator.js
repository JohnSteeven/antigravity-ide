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
    .withMessage("Subject is required."),
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required."),
];

module.exports = {
  contactMessageValidator,
};
