const WATER_TO_ML = Object.freeze({ ml: 1, l: 1000, oz: 29.5735 });

const toWaterMl = (amount, unit = "ml") => {
  const multiplier = WATER_TO_ML[String(unit).toLowerCase()];
  if (!multiplier || !Number.isFinite(Number(amount)) || Number(amount) < 0) {
    const error = new Error("Enter a valid water amount and unit.");
    error.status = 422;
    throw error;
  }
  return Math.round(Number(amount) * multiplier);
};

const sleepDurationMinutes = (startedAt, endedAt) => {
  const start = new Date(startedAt);
  const end = new Date(endedAt);
  const minutes = Math.round((end - start) / 60000);
  if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 24 * 60) {
    const error = new Error("Sleep end time must be after start time and within 24 hours.");
    error.status = 422;
    throw error;
  }
  return minutes;
};

const calculateGoalProgress = (goal = {}, context = {}) => {
  const strategy = goal.progressStrategy || "manual";
  if (strategy === "milestones") {
    const milestones = goal.milestones || [];
    if (!milestones.length) return 0;
    return Math.round((milestones.filter((item) => item.completedAt).length / milestones.length) * 100);
  }
  if (strategy === "quantity") {
    const target = Number(goal.targetValue) || 0;
    return target > 0 ? Math.min(100, Math.max(0, Math.round(((Number(goal.currentValue) || 0) / target) * 100))) : 0;
  }
  if (strategy === "linked_completions") {
    const target = Number(goal.targetValue) || 0;
    return target > 0 ? Math.min(100, Math.max(0, Math.round(((Number(context.linkedCompletions) || 0) / target) * 100))) : 0;
  }
  return Math.min(100, Math.max(0, Math.round(Number(goal.manualProgress) || 0)));
};

const summarizeBudget = ({ limitMinor = 0, spentMinor = 0 } = {}) => ({
  limitMinor: Math.max(0, Math.round(Number(limitMinor) || 0)),
  spentMinor: Math.max(0, Math.round(Number(spentMinor) || 0)),
  remainingMinor: Math.round(Number(limitMinor) || 0) - Math.round(Number(spentMinor) || 0),
  percentUsed: Number(limitMinor) > 0 ? Math.round((Number(spentMinor) / Number(limitMinor)) * 100) : 0,
});

module.exports = {
  calculateGoalProgress,
  sleepDurationMinutes,
  summarizeBudget,
  toWaterMl,
};
