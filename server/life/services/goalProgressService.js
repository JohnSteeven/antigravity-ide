const LifeEvent = require("../models/LifeEvent");
const { calculateGoalProgress } = require("../domain/calculations");

const progressForGoals = async (userId, goals = []) => {
  const linkedIds = [...new Set(goals.flatMap((goal) => (goal.linkedHabits || []).map(String)))];
  let counts = new Map();
  if (linkedIds.length) {
    const objectIds = goals.flatMap((goal) => goal.linkedHabits || []);
    const rows = await LifeEvent.aggregate([
      { $match: { user: userId, itemType: "habit", itemId: { $in: objectIds } } },
      { $sort: { occurredAt: 1, createdAt: 1 } },
      { $group: { _id: { itemId: "$itemId", scheduledDate: "$scheduledDate", occurrenceKey: "$occurrenceKey" }, status: { $last: "$status" } } },
      { $match: { status: "completed" } },
      { $group: { _id: "$_id.itemId", count: { $sum: 1 } } },
    ]);
    counts = new Map(rows.map((row) => [String(row._id), row.count]));
  }
  return new Map(goals.map((goal) => [String(goal._id), calculateGoalProgress(goal, { linkedCompletions: (goal.linkedHabits || []).reduce((sum, habitId) => sum + (counts.get(String(habitId)) || 0), 0) })]));
};

module.exports = { progressForGoals };
