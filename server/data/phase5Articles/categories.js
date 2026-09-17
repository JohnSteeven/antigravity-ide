"use strict";

const { CANONICAL_ARTICLE_CATEGORIES, CANONICAL_CATEGORY_SLUGS } = require("../../config/constants");

const PHASE5_CATEGORY_METADATA = Object.freeze({
  life: {
    name: "Life",
    slug: "life",
    description: "Personal notes on habits, relationships, and ordinary days.",
    icon: "heart",
    sortOrder: 1,
  },
  reflections: {
    name: "Reflections",
    slug: "reflections",
    description: "Slower essays about meaning, change, and self-awareness.",
    icon: "feather",
    sortOrder: 2,
  },
  experiences: {
    name: "Experiences",
    slug: "experiences",
    description: "Memorable moments, personal encounters, and turning points from real experience.",
    icon: "compass",
    sortOrder: 3,
  },
  lessons: {
    name: "Lessons",
    slug: "lessons",
    description: "Practical lessons learned through wins, mistakes, and repair.",
    icon: "award",
    sortOrder: 4,
  },
  travel: {
    name: "Travel",
    slug: "travel",
    description: "Places, movement, verified logistical facts, and what the road teaches.",
    icon: "send",
    sortOrder: 5,
  },
});

module.exports = {
  CANONICAL_ARTICLE_CATEGORIES,
  CANONICAL_CATEGORY_SLUGS,
  PHASE5_CATEGORY_METADATA,
};
