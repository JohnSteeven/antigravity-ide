const crypto = require("crypto");
const { addLocalDays } = require("../domain/time");

const SCENARIOS = Object.freeze(["new-user", "habit-heavy", "health-tracking", "goal-focused", "money-tracking", "long-history", "notification-heavy"]);
const id = () => crypto.randomBytes(12).toString("hex");

const buildLifeFixture = (scenario, { userId = id(), today = "2026-08-11" } = {}) => {
  if (!SCENARIOS.includes(scenario)) throw new Error(`Unknown Life fixture: ${scenario}`);
  const fixture = { scenario, developmentOnly: true, userId, profile: { user: userId, timezone: "Asia/Kolkata", currency: "INR", onboarding: { completedAt: new Date().toISOString() } }, habits: [], scheduleVersions: [], events: [], goals: [], health: [], financeEntries: [], financePlans: [], journal: [], notificationJobs: [] };
  const addHabit = (name, index, reminder = false) => {
    const habitId = id();
    fixture.habits.push({ _id: habitId, user: userId, name, intent: "build", measurementType: "boolean", status: "active", schedule: { type: "daily", startDate: addLocalDays(today, -60), times: [`${String(7 + (index % 12)).padStart(2, "0")}:00`] }, reminder: { enabled: reminder, times: [`${String(7 + (index % 12)).padStart(2, "0")}:00`], channels: ["in_app"] } });
    fixture.scheduleVersions.push({ user: userId, itemType: "habit", itemId: habitId, version: 1, effectiveFrom: addLocalDays(today, -60), timezone: "Asia/Kolkata", schedule: fixture.habits.at(-1).schedule });
    return habitId;
  };
  if (scenario === "new-user") { fixture.profile.onboarding = { completedAt: null, skippedAt: null }; return fixture; }
  const habitCount = scenario === "habit-heavy" ? 40 : scenario === "notification-heavy" ? 25 : 5;
  Array.from({ length: habitCount }, (_, index) => addHabit(`Fixture habit ${index + 1}`, index, scenario === "notification-heavy"));
  if (["long-history", "habit-heavy"].includes(scenario)) for (let day = 0; day < (scenario === "long-history" ? 365 : 30); day += 1) fixture.events.push({ user: userId, itemType: "habit", itemId: fixture.habits[day % fixture.habits.length]._id, scheduledDate: addLocalDays(today, -day), status: day % 9 === 0 ? "skipped" : "completed", idempotencyKey: `fixture:${scenario}:${day}` });
  if (scenario === "health-tracking") for (let day = 0; day < 60; day += 1) fixture.health.push({ user: userId, type: "water", localDate: addLocalDays(today, -day), canonicalValue: 1500 + (day % 4) * 250, canonicalUnit: "ml" }, { user: userId, type: "sleep", localDate: addLocalDays(today, -day), durationMinutes: 390 + (day % 6) * 15 });
  if (scenario === "goal-focused") fixture.goals = Array.from({ length: 8 }, (_, index) => ({ user: userId, title: `Fixture goal ${index + 1}`, startDate: addLocalDays(today, -30), progressStrategy: "milestones", milestones: [{ title: "Begin", completedAt: new Date() }, { title: "Continue" }] }));
  if (scenario === "money-tracking") for (let day = 0; day < 120; day += 1) fixture.financeEntries.push({ user: userId, type: "expense", amountMinor: 10000 + day, currency: day % 10 ? "INR" : "USD", category: "Fixture", localDate: addLocalDays(today, -day) });
  if (scenario === "notification-heavy") fixture.notificationJobs = fixture.habits.flatMap((habit, index) => Array.from({ length: 14 }, (_, day) => ({ user: userId, itemType: "habit", itemId: habit._id, occurrenceDate: addLocalDays(today, day), dueAt: new Date(Date.now() + day * 86400000), channel: "in_app", dedupeKey: `fixture:${habit._id}:${day}:${index}` })));
  return fixture;
};

module.exports = { buildLifeFixture, SCENARIOS };
