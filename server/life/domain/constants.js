const LIFE_ITEM_TYPES = Object.freeze(["habit", "task", "routine", "goal_action", "medication", "workout"]);
const LIFE_EVENT_STATUSES = Object.freeze(["completed", "partial", "skipped", "missed", "snoozed"]);
const LIFE_EVENT_SOURCES = Object.freeze(["manual", "import", "integration", "system"]);
const HABIT_MEASUREMENT_TYPES = Object.freeze(["boolean", "quantity", "duration", "count", "limit", "avoid", "time", "custom"]);
const HABIT_INTENTS = Object.freeze(["build", "maintain", "reduce", "quit"]);
const RECURRENCE_TYPES = Object.freeze([
  "daily",
  "weekdays",
  "weekends",
  "specific_weekdays",
  "every_n_days",
  "times_per_week",
  "days_of_month",
  "monthly",
  "specific_dates",
  "custom_interval",
]);
const GOAL_STATUSES = Object.freeze(["active", "paused", "completed", "abandoned", "archived"]);
const GOAL_PROGRESS_STRATEGIES = Object.freeze(["manual", "milestones", "quantity", "linked_completions"]);
const HEALTH_ENTRY_TYPES = Object.freeze(["water", "sleep", "mood", "workout", "symptom", "medication", "metric"]);
const FINANCE_ENTRY_TYPES = Object.freeze(["expense", "income", "savings_contribution"]);
const FINANCE_PLAN_TYPES = Object.freeze(["budget", "bill", "subscription", "savings_goal"]);
const JOURNAL_ENTRY_TYPES = Object.freeze(["daily", "free", "weekly_review", "monthly_review"]);

const DEFAULT_LIFE_AREAS = Object.freeze([
  "Health", "Fitness", "Career", "Money", "Learning", "Relationships", "Family",
  "Rest", "Creativity", "Spirituality", "Travel", "Community", "Personal Growth",
]);

const DEFAULT_VISIBLE_MODULES = Object.freeze(["habits", "goals", "water", "sleep", "workouts", "mood", "money", "journal"]);

module.exports = {
  DEFAULT_LIFE_AREAS,
  DEFAULT_VISIBLE_MODULES,
  FINANCE_ENTRY_TYPES,
  FINANCE_PLAN_TYPES,
  GOAL_PROGRESS_STRATEGIES,
  GOAL_STATUSES,
  HABIT_INTENTS,
  HABIT_MEASUREMENT_TYPES,
  HEALTH_ENTRY_TYPES,
  JOURNAL_ENTRY_TYPES,
  LIFE_EVENT_SOURCES,
  LIFE_EVENT_STATUSES,
  LIFE_ITEM_TYPES,
  RECURRENCE_TYPES,
};
