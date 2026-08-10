/**
 * StoryConfig.js — Configuration & helpers for Stories
 */

export const STORY_THEMES = [
  "resilience",
  "growth",
  "courage",
  "choices",
  "change",
  "humanity",
  "memories",
  "kindness",
  "second-chances",
  "love",
  "hope",
  "forgiveness",
];

export const normalizeTheme = (themeStr = "") =>
  String(themeStr)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

export const humanizeTheme = (themeKey = "") => {
  if (!themeKey) return "";
  return String(themeKey)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
