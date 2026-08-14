const COURSE_LEVELS = Object.freeze(["beginner", "intermediate", "advanced", "all_levels"]);
const LESSON_TYPES = Object.freeze(["video", "text", "audio", "mixed", "practice"]);
const PUBLICATION_STATUSES = Object.freeze(["draft", "scheduled", "published", "archived"]);
const ACCESS_LEVELS = Object.freeze(["free", "premium"]);

const MEDIA_LIMITS = Object.freeze({
  image: 10 * 1024 * 1024,
  document: 25 * 1024 * 1024,
  resource: 50 * 1024 * 1024,
  audio: 250 * 1024 * 1024,
  video: 2 * 1024 * 1024 * 1024,
});

module.exports = { ACCESS_LEVELS, COURSE_LEVELS, LESSON_TYPES, MEDIA_LIMITS, PUBLICATION_STATUSES };
