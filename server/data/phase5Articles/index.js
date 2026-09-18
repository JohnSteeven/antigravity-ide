"use strict";

/**
 * Phase 5 Article Catalog Foundation & Scaffolding
 *
 * NOTE: As per Phase 5 Step 1 boundaries, the full 70+ article catalog
 * will be generated in subsequent steps. This file provides the schema
 * foundation, canonical category bindings, and blueprint validation.
 */

const {
  CANONICAL_ARTICLE_CATEGORIES,
  CANONICAL_CATEGORY_SLUGS,
  PHASE5_CATEGORY_METADATA,
} = require("./categories");
const { EDITORIAL_BYLINE } = require("../../config/constants");

const lifeArticles = require("./life");
const reflectionsArticles = require("./reflections");
const lessonsArticles = require("./lessons");
const experiencesArticles = require("./experiences");
const travelArticles = require("./travel");

// Catalog blueprint registry: structured by category
const phase5Catalog = Object.freeze({
  life: lifeArticles,
  reflections: reflectionsArticles,
  lessons: lessonsArticles,
  experiences: experiencesArticles,
  travel: travelArticles,
});

const canonicalArticles = Object.freeze([
  ...lifeArticles,
  ...reflectionsArticles,
  ...lessonsArticles,
  ...experiencesArticles,
  ...travelArticles,
]);

/**
 * Validate a candidate Phase 5 article object before insertion
 */
const validatePhase5ArticleBlueprint = (article) => {
  const errors = [];
  if (!article.title || typeof article.title !== "string" || !article.title.trim()) {
    errors.push("Title is required and must be non-empty.");
  }
  if (!article.slug || typeof article.slug !== "string" || !article.slug.trim()) {
    errors.push("Slug is required and must be non-empty.");
  }
  if (!article.category || !CANONICAL_ARTICLE_CATEGORIES.includes(article.category)) {
    errors.push(`Category must be one of: ${CANONICAL_ARTICLE_CATEGORIES.join(", ")}`);
  }
  if (article.category === "Experiences") {
    if (!article.editorialProvenance || article.editorialProvenance.provenanceType !== "reported_case_study") {
      errors.push("Experiences articles require valid editorialProvenance with provenanceType 'reported_case_study'.");
    }
  }
  if (article.category === "Travel") {
    if (!article.travelVerification || !article.travelVerification.lastVerifiedAt || !article.travelVerification.currency) {
      errors.push("Travel articles require valid travelVerification with lastVerifiedAt and currency.");
    }
  }
  return { valid: errors.length === 0, errors };
};

module.exports = {
  EDITORIAL_BYLINE,
  CANONICAL_ARTICLE_CATEGORIES,
  CANONICAL_CATEGORY_SLUGS,
  PHASE5_CATEGORY_METADATA,
  phase5Catalog,
  canonicalArticles,
  validatePhase5ArticleBlueprint,
};
