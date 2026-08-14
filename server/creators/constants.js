const CREATOR_APPLICATION_STATUSES = Object.freeze([
  "applied",
  "under_review",
  "more_info_required",
  "interview",
  "verification",
  "approved",
  "active",
  "rejected",
  "restricted",
  "suspended",
  "deactivated",
]);

const CREATOR_PROFILE_STATUSES = Object.freeze([
  "approved",
  "active",
  "restricted",
  "suspended",
  "deactivated",
]);

const CREATOR_CONTENT_TYPES = Object.freeze([
  "article",
  "story",
  "course",
  "video",
  "podcast",
  "resource",
  "series",
]);

const CREATOR_WORKFLOW_STATUSES = Object.freeze([
  "draft",
  "submitted",
  "under_review",
  "changes_requested",
  "approved",
  "scheduled",
  "published",
  "rejected",
  "archived",
]);

const APPLICATION_TRANSITIONS = Object.freeze({
  applied: ["under_review", "rejected"],
  under_review: ["more_info_required", "interview", "verification", "approved", "rejected"],
  more_info_required: ["applied", "under_review", "rejected"],
  interview: ["verification", "approved", "rejected"],
  verification: ["approved", "rejected"],
  approved: ["active", "restricted", "suspended", "deactivated"],
  active: ["restricted", "suspended", "deactivated"],
  restricted: ["active", "suspended", "deactivated"],
  suspended: ["active", "deactivated"],
  rejected: [],
  deactivated: ["active"],
});

const RECOMMENDED_STORY_LAYOUTS = Object.freeze([
  "classic-reader",
  "reader-image-right",
  "alternating-editorial",
  "chapter-journey",
  "magazine-feature",
  "minimal-longform",
]);

module.exports = {
  APPLICATION_TRANSITIONS,
  CREATOR_APPLICATION_STATUSES,
  CREATOR_CONTENT_TYPES,
  CREATOR_PROFILE_STATUSES,
  CREATOR_WORKFLOW_STATUSES,
  RECOMMENDED_STORY_LAYOUTS,
};
