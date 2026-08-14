const { body } = require("express-validator");
const { STORY_LAYOUT_IDS } = require("../utils/storyContent");

const storyWriteValidator = [
  body("title").trim().notEmpty().withMessage("Title is required."),
  body("contentType").optional().equals("story").withMessage("Content type must be story."),
  body("storyLayout").optional().isIn(STORY_LAYOUT_IDS).withMessage("Invalid Story layout."),
  body("storySections").optional().isArray().withMessage("Story sections must be an array."),
  body("status").optional().isIn(["draft", "published", "archived", "scheduled"]).withMessage("Invalid status value."),
  body("accessLevel").optional().isIn(["free", "premium"]).withMessage("Access must be Free or Premium."),
];

module.exports = { storyWriteValidator };
