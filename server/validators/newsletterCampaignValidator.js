const { body } = require("express-validator");

const campaignValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Campaign title is required."),
  body("subject")
    .trim()
    .notEmpty()
    .withMessage("Subject is required."),
  body("body")
    .trim()
    .notEmpty()
    .withMessage("Newsletter content body is required."),
];

module.exports = {
  campaignValidator,
};
