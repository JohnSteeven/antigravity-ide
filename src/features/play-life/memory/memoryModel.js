export const getMemorySnapshot = (state) => ({
  savedMoments: state?.savedMoments || [],
  completedChallenges: (state?.actionsTaken || []).filter((action) => action.status === "completed"),
  helpfulActions: (state?.actionFeedback || []).filter((feedback) => ["yes", "a-little"].includes(feedback.value)),
  preferences: {
    jokeAffinity: state?.preferences?.jokeAffinity || 0,
    tone: state?.preferences?.tone || "balanced",
  },
});

export const removeSavedMoment = (state, momentId) => ({
  ...state,
  savedMoments: (state.savedMoments || []).filter((moment) => moment.id !== momentId),
});
