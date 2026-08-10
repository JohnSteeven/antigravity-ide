const baseActions = ["move", "talk", "relax", "laugh", "learn", "create", "play", "think", "plan", "rest", "journal"];

const byMood = {
  stressed: ["relax", "move", "plan", "rest"],
  sad: ["talk", "relax", "move", "journal"],
  bored: ["play", "learn", "create", "move"],
  happy: ["create", "talk", "play", "journal"],
  excited: ["create", "move", "plan", "talk"],
  calm: ["journal", "learn", "create", "plan"],
};

export const recommendActions = ({ currentMood, energy, actionFeedback = [] }) => {
  const moodActions = byMood[currentMood?.id] || baseActions;
  const helpfulIds = new Set(
    actionFeedback
      .filter((feedback) => ["yes", "a-little"].includes(feedback.value))
      .map((feedback) => feedback.actionType)
      .filter(Boolean)
  );

  return [...moodActions]
    .sort((left, right) => Number(helpfulIds.has(right)) - Number(helpfulIds.has(left)))
    .filter((action) => !(energy === "low" && action === "move"))
    .slice(0, 4);
};
