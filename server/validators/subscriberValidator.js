const { body } = require("express-validator");

const subscribeValidator = [
  body("email")
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("A valid email is required."),
];

module.exports = {
  subscribeValidator,
};
