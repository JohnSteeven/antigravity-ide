const { body } = require("express-validator");
const { EDITORIAL_PROVENANCE_TYPES } = require("../config/constants");

const VALID_PROVENANCE_TYPES = [
  EDITORIAL_PROVENANCE_TYPES.FIRST_PERSON_AUTHORIZED,
  EDITORIAL_PROVENANCE_TYPES.REPORTED_CASE_STUDY,
];

const validateEditorialProvenance = (provenance, { category = "", isPublishing = false } = {}) => {
  const errors = [];
  const isExperiences = String(category).toLowerCase().trim() === "experiences";

  if (!provenance) {
    if (isExperiences && isPublishing) {
      errors.push("Experiences articles require editorialProvenance (first_person_authorized or reported_case_study).");
    }
    return { valid: errors.length === 0, errors };
  }

  const { provenanceType, subjectIdentity, authorizationReference, caseStudySource, sourceDocumentation } = provenance;

  if (!provenanceType || !VALID_PROVENANCE_TYPES.includes(provenanceType)) {
    errors.push("Editorial provenance must be either 'first_person_authorized' or 'reported_case_study'.");
    return { valid: false, errors };
  }

  if (provenanceType === EDITORIAL_PROVENANCE_TYPES.FIRST_PERSON_AUTHORIZED) {
    if (!authorizationReference && !subjectIdentity) {
      errors.push("First-person authorized experiences require an authorization reference or subject identity.");
    }
  }

  if (provenanceType === EDITORIAL_PROVENANCE_TYPES.REPORTED_CASE_STUDY) {
    const hasSource = Boolean(caseStudySource) || (Array.isArray(sourceDocumentation) && sourceDocumentation.length > 0);
    if (!hasSource) {
      errors.push("Reported case studies require a case study source or source documentation.");
    }
  }

  return { valid: errors.length === 0, errors };
};

const validateTravelVerification = (verification) => {
  const errors = [];
  if (!verification || typeof verification !== "object") return { valid: true, errors: [] };

  if (verification.currency && !/^[A-Z]{3}$/i.test(verification.currency)) {
    errors.push("Currency must be a valid 3-letter currency code.");
  }

  if (verification.lastVerifiedAt && isNaN(new Date(verification.lastVerifiedAt).getTime())) {
    errors.push("lastVerifiedAt must be a valid date.");
  }

  if (verification.budgetVerifiedAt && isNaN(new Date(verification.budgetVerifiedAt).getTime())) {
    errors.push("budgetVerifiedAt must be a valid date.");
  }

  if (verification.officialSources && !Array.isArray(verification.officialSources)) {
    errors.push("officialSources must be an array of references.");
  }

  return { valid: errors.length === 0, errors };
};

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
    .isIn(["draft", "review", "published", "archived", "scheduled"])
    .withMessage("Invalid status value."),
  body("accessLevel")
    .optional()
    .isIn(["free", "premium"])
    .withMessage("Access must be Free or Premium."),
  body("editorialProvenance")
    .optional()
    .custom((provenance, { req }) => {
      const result = validateEditorialProvenance(provenance, {
        category: req.body.category,
        isPublishing: req.body.status === "published",
      });
      if (!result.valid) throw new Error(result.errors.join(" "));
      return true;
    }),
  body("travelVerification")
    .optional()
    .custom((verification) => {
      const result = validateTravelVerification(verification);
      if (!result.valid) throw new Error(result.errors.join(" "));
      return true;
    }),
];

const addCommentValidator = [
  body("body")
    .trim()
    .notEmpty()
    .withMessage("Comment text is required.")
    .isLength({ min: 3 })
    .withMessage("Comment body must be at least 3 characters.")
    .isLength({ max: 1000 })
    .withMessage("Comment body cannot exceed 1000 characters."),
];

module.exports = {
  createArticleValidator,
  addCommentValidator,
  validateEditorialProvenance,
  validateTravelVerification,
};
