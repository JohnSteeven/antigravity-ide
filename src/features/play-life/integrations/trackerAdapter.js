export const toTrackerEvent = (action, feedback = null) => ({
  source: "play-life",
  category: action?.type || "reflection",
  label: action?.label || "Play Life moment",
  completedAt: action?.completedAt || action?.at || new Date().toISOString(),
  userReportedHelpfulness: feedback?.value || null,
});

export const createTrackerAdapter = (writer = null) => ({
  isConnected: Boolean(writer),
  async record(action, feedback) {
    if (!writer) return { stored: false, reason: "tracker-not-connected" };
    return writer(toTrackerEvent(action, feedback));
  },
});
