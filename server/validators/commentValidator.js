const { body } = require("express-validator");

const COMMENT_STATUSES = Object.freeze(["pending", "approved", "rejected", "spam", "hidden"]);
const COMMENT_UPDATE_FIELDS = Object.freeze(["status", "body", "isPinned"]);

const updateCommentValidator = [
  body().custom((payload) => {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("A comment update object is required.");
    }
    const fields = Object.keys(payload);
    if (fields.length === 0) throw new Error("At least one comment update field is required.");
    if (fields.some((field) => !COMMENT_UPDATE_FIELDS.includes(field))) {
      throw new Error("Comment update contains an unsupported field.");
    }
    return true;
  }),
  body("status")
    .optional()
    .isIn(COMMENT_STATUSES)
    .withMessage("Invalid comment status."),
  body("body")
    .optional()
    .trim()
    .isLength({ min: 3, max: 1000 })
    .withMessage("Comment body must be between 3 and 1000 characters."),
  body("isPinned")
    .optional()
    .isBoolean({ strict: true })
    .withMessage("isPinned must be a boolean."),
];

module.exports = { COMMENT_STATUSES, COMMENT_UPDATE_FIELDS, updateCommentValidator };
