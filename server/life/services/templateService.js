const habitService = require("./habitService");
const lifeDataService = require("./lifeDataService");
const profileService = require("./profileService");
const { localDateKey } = require("../domain/time");
const { LifeError } = require("../domain/errors");

const TEMPLATES = Object.freeze([
  { key: "morning-routine", category: "Daily rhythm", name: "Morning routine", description: "A gentle three-step start.", kind: "routine", time: "07:30", steps: ["Drink water", "Stretch", "Choose today's focus"] },
  { key: "evening-routine", category: "Daily rhythm", name: "Evening routine", description: "Close the day without a scorecard.", kind: "routine", time: "21:30", steps: ["Prepare tomorrow", "Quiet reflection", "Settle for sleep"] },
  { key: "deep-work", category: "Focus", name: "Deep work", description: "A repeatable focus window.", kind: "routine", time: "09:00", steps: ["Clear distractions", "Choose one outcome", "Work for one focused block"] },
  { key: "reading", category: "Learning", name: "Read for 20 minutes", description: "A small daily reading practice.", kind: "habit", time: "20:30", target: 20, unit: "minutes", measurementType: "duration", preferredPeriod: "evening" },
  { key: "hydration", category: "Health", name: "Drink water", description: "A customizable hydration reminder.", kind: "habit", time: "10:00", target: 1, unit: "glass", measurementType: "count", preferredPeriod: "morning" },
  { key: "weekly-planning", category: "Planning", name: "Weekly planning", description: "Review goals and choose a few priorities.", kind: "routine", time: "18:00", steps: ["Review active goals", "Choose this week's priorities", "Schedule the next useful actions"], scheduleType: "specific_weekdays", weekdays: [0] },
]);

const listTemplates = () => TEMPLATES.map((template) => ({ ...template, steps: template.steps ? [...template.steps] : undefined }));

const applyTemplate = async (userId, key, customization = {}) => {
  const template = TEMPLATES.find((item) => item.key === key);
  if (!template) throw new LifeError("Choose an available Life template.", 404, "LIFE_TEMPLATE_NOT_FOUND");
  const profile = await profileService.getOrCreateProfile(userId);
  const startDate = localDateKey(new Date(), profile.timezone);
  const time = customization.time || template.time;
  const schedule = {
    type: customization.scheduleType || template.scheduleType || "daily",
    startDate,
    times: [time],
    weekdays: customization.weekdays || template.weekdays || [],
  };
  const reminder = { enabled: Boolean(customization.reminderEnabled), times: [time], channels: customization.channels?.length ? customization.channels : ["in_app"] };
  if (template.kind === "habit") {
    return habitService.createHabit(userId, {
      name: String(customization.name || template.name).slice(0, 120), why: template.description,
      intent: "build", measurementType: template.measurementType, target: customization.target ?? template.target,
      unit: customization.unit || template.unit, preferredPeriod: template.preferredPeriod, schedule, reminder,
    });
  }
  const removed = new Set((customization.removedSteps || []).map(String));
  const steps = (customization.steps || template.steps).filter((step) => !removed.has(step)).slice(0, 30);
  if (!steps.length) throw new LifeError("Keep at least one routine step.", 422, "LIFE_TEMPLATE_EMPTY");
  return lifeDataService.createRoutine(userId, {
    name: String(customization.name || template.name).slice(0, 120), schedule, reminder,
    items: steps.map((title, order) => ({ title: String(title).slice(0, 120), order, linkedType: "routine_only" })),
  });
};

module.exports = { applyTemplate, listTemplates };
