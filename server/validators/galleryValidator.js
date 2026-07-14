const { body } = require("express-validator");

const galleryValidator = [
  body("url")
    .trim()
    .notEmpty()
    .withMessage("Media URL is required."),
  body("album")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Album name cannot be empty if specified."),
];

module.exports = {
  galleryValidator,
};
