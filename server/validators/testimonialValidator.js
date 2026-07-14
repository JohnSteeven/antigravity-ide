const { body } = require("express-validator");

const testimonialValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required."),
  body("testimonial")
    .trim()
    .notEmpty()
    .withMessage("Testimonial text is required."),
  body("rating")
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5."),
];

module.exports = {
  testimonialValidator,
};
