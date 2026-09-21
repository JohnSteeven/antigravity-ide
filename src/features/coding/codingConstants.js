/**
 * ─────────────────────────────────────────────────────────────────────────────
 * codingConstants.js — Stable Presentation Metadata Only
 *
 * NOTE: Authoritative curriculum data (lesson counts, progress, monetization,
 * durations, project existence) MUST be fetched dynamically from the database.
 * This file contains strictly presentation/branding helpers.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const CANONICAL_TRACKS = [
  {
    key: "html",
    courseSlug: "html-foundations",
    label: "HTML",
    accent: "#f97316",
    icon: "🌐",
    tagline: "Semantic structure, forms, and web documents",
    isPremium: false,
  },
  {
    key: "css",
    courseSlug: "css-foundations",
    label: "CSS",
    accent: "#38bdf8",
    icon: "🎨",
    tagline: "Modern responsive layouts, Flexbox, and Grid",
    isPremium: false,
  },
  {
    key: "javascript",
    courseSlug: "javascript-foundations",
    label: "JavaScript",
    accent: "#eab308",
    icon: "⚡",
    tagline: "Algorithmic logic, DOM manipulation, and modern ES6+",
    isPremium: true,
  },
  {
    key: "python",
    courseSlug: "python-foundations",
    label: "Python",
    accent: "#3b82f6",
    accentAlt: "#fbbf24",
    icon: "🐍",
    tagline: "Core computer science, syntax, and computational thinking",
    isPremium: true,
  },
];

const TRACK_TO_SLUG = {
  html: "html-foundations",
  css: "css-foundations",
  javascript: "javascript-foundations",
  python: "python-foundations",
};

const SLUG_TO_TRACK = {
  "html-foundations": "html",
  "css-foundations": "css",
  "javascript-foundations": "javascript",
  "python-foundations": "python",
};

export const trackToCourseSlug = (track = "") => {
  const clean = String(track || "").toLowerCase().trim();
  return TRACK_TO_SLUG[clean] || clean;
};

export const courseSlugToTrack = (slug = "") => {
  const clean = String(slug || "").toLowerCase().trim();
  return SLUG_TO_TRACK[clean] || clean;
};

export const RESOURCE_CATEGORIES = [
  { id: "all", label: "All Resources" },
  { id: "cheat_sheet", label: "Cheat Sheets" },
  { id: "course_notes", label: "Course Notes" },
  { id: "practice_set", label: "Practice Sets" },
  { id: "project_file", label: "Project Files" },
  { id: "reference_guide", label: "Reference Guides" },
  { id: "interview_prep", label: "Interview Prep" },
];

