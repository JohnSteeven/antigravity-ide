const { body } = require("express-validator");

const createCategoryValidator = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required."),
];

module.exports = {
  createCategoryValidator,
};
