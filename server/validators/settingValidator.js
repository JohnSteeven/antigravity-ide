const { body } = require("express-validator");

const settingValidator = [
  body("value")
    .exists()
    .withMessage("Value field is required for settings update."),
];

module.exports = {
  settingValidator,
};
