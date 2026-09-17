"use strict";

const EDITORIAL_BYLINE = "MyJourney Editorial";

const CANONICAL_ARTICLE_CATEGORIES = Object.freeze([
  "Life",
  "Reflections",
  "Experiences",
  "Lessons",
  "Travel",
]);

const CANONICAL_CATEGORY_SLUGS = Object.freeze([
  "life",
  "reflections",
  "experiences",
  "lessons",
  "travel",
]);

const EXCLUDED_RESET_CATEGORIES = Object.freeze([
  "news",
  "coding",
]);

const EDITORIAL_PROVENANCE_TYPES = Object.freeze({
  FIRST_PERSON_AUTHORIZED: "first_person_authorized",
  REPORTED_CASE_STUDY: "reported_case_study",
});

module.exports = {
  EDITORIAL_BYLINE,
  CANONICAL_ARTICLE_CATEGORIES,
  CANONICAL_CATEGORY_SLUGS,
  EXCLUDED_RESET_CATEGORIES,
  EDITORIAL_PROVENANCE_TYPES,
};
