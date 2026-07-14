const { body } = require("express-validator");

const updateProfileValidator = [
  body("firstName").optional().trim().notEmpty().withMessage("First name cannot be empty."),
  body("lastName").optional().trim().notEmpty().withMessage("Last name cannot be empty."),
  body("username").optional().trim().isLength({ min: 3 }).withMessage("Username must be at least 3 characters."),
  body("email").optional().trim().isEmail().normalizeEmail().withMessage("Must be a valid email address."),
  body("mobile").optional().trim().isLength({ min: 8, max: 18 }).withMessage("Must be a valid mobile number."),
  body("profile.bio").optional().trim().isLength({ max: 700 }).withMessage("Bio cannot exceed 700 characters."),
  body("profile.skills").optional().isArray().withMessage("Skills must be an array of strings."),
  body("profile.avatar").optional().trim().isURL().withMessage("Avatar must be a valid URL."),
  body("profile.coverImage").optional().trim().isURL().withMessage("Cover image must be a valid URL."),
];

module.exports = {
  updateProfileValidator,
};
