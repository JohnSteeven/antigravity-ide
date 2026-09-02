const LifeTask = require("../models/LifeTask");
const { addLocalDays, localDateKey } = require("../domain/time");
const profileService = require("./profileService");
const todayService = require("./todayService");

const planTomorrow = async (userId) => {
  const profile = await profileService.getOrCreateProfile(userId);
  const today = localDateKey(new Date(), profile.timezone);
  const tomorrow = addLocalDays(today, 1);
  const [current, next, unfinished] = await Promise.all([
    todayService.getToday(userId, today), todayService.getToday(userId, tomorrow),
    LifeTask.find({ user: userId, localDate: today, status: "active" }).sort({ priority: -1, createdAt: 1 }).limit(50).lean(),
  ]);
  const eveningCount = next.timeline.groups.evening?.length || 0;
  const suggestions = [];
  if (eveningCount >= 7) suggestions.push({ type: "overload", message: `Tomorrow has ${eveningCount} items in the evening. Consider moving one only if that would make the day easier.` });
  if (unfinished.length) suggestions.push({ type: "carry", message: `${unfinished.length} one-time action${unfinished.length === 1 ? " is" : "s are"} still open today. Recurring habits will not be carried.`, actions: unfinished.slice(0, 10).map((task) => ({ id: task._id, title: task.title })) });
  return { date: tomorrow, recurringCount: next.timeline.total, unfinishedOneTimeActions: unfinished.slice(0, 10), suggestions, currentCompleted: current.summary.completed };
};

module.exports = { planTomorrow };
