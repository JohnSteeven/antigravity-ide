const { body } = require("express-validator");
const { CREATOR_APPLICATION_STATUSES } = require("./constants");

const applicationValidator = [
  body("legalName").trim().isLength({ min: 2, max: 160 }).withMessage("Enter your legal name."),
  body("displayName").trim().isLength({ min: 2, max: 100 }).withMessage("Enter a public Creator name."),
  body("headline").trim().isLength({ min: 10, max: 180 }).withMessage("Creator headline must be 10–180 characters."),
  body("biography").trim().isLength({ min: 80, max: 3000 }).withMessage("Biography must be 80–3000 characters."),
  body("specialties").isArray({ min: 1, max: 20 }).withMessage("Choose at least one area of expertise."),
  body("languages").isArray({ min: 1, max: 12 }).withMessage("Choose at least one language."),
  body("motivation").trim().isLength({ min: 40, max: 3000 }).withMessage("Tell us why you want to create on MyJourney."),
  body("acceptTerms").equals("true").withMessage("Creator Terms must be accepted."),
  body("confirmContentRights").equals("true").withMessage("You must confirm that you hold the rights to submitted content."),
];

const reviewValidator = [
  body("status").isIn(CREATOR_APPLICATION_STATUSES).withMessage("Invalid Creator review status."),
  body("publicMessage").optional().isString().isLength({ max: 2000 }),
  body("privateNote").optional().isString().isLength({ max: 5000 }),
];

module.exports = { applicationValidator, reviewValidator };
