const { body } = require("express-validator");

const createArticleValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required."),
  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required."),
  body("status")
    .optional()
    .isIn(["draft", "published", "archived", "scheduled"])
    .withMessage("Invalid status value."),
];

const addCommentValidator = [
  body("body")
    .trim()
    .notEmpty()
    .withMessage("Comment text is required."),
];

module.exports = {
  createArticleValidator,
  addCommentValidator,
};
