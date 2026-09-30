import { apiRequest } from "../../../services/authService";
import { queueOrSend } from "../offline/offlineQueue";

const query = (params = {}) => {
  const value = new URLSearchParams(Object.entries(params).filter(([, item]) => item !== undefined && item !== "" && item !== null)).toString();
  return value ? `?${value}` : "";
};
const get = (path, params) => apiRequest(`/api/life${path}${query(params)}`);
const send = (path, method, body) => apiRequest(`/api/life${path}`, { method, body: body === undefined ? undefined : JSON.stringify(body) });
const queuedSend = (path, method, body, operationType) => queueOrSend({ path: `/api/life${path}`, method, body, operationType });

export const lifeApi = {
  profile: () => get("/profile"),
  updateProfile: (body) => send("/profile", "PATCH", body),
  completeOnboarding: (body) => send("/onboarding/complete", "POST", body),
  skipOnboarding: (body = {}) => send("/onboarding/skip", "POST", body),
  today: (date) => get("/today", { date }),
  capabilities: () => get("/capabilities"),
  search: (q) => get("/search", { q }),
  templates: () => get("/templates"),
  applyTemplate: (key, body) => send(`/templates/${key}/apply`, "POST", body),

  habits: (params) => get("/habits", params),
  habitAnalytics: (id, params) => get(`/habits/${id}/analytics`, params),
  createHabit: (body) => send("/habits", "POST", body),
  updateHabit: (id, body) => send(`/habits/${id}`, "PATCH", body),
  setHabitStatus: (id, status) => send(`/habits/${id}/status`, "PATCH", { status }),
  logEvent: (itemType, id, body) => ["habit", "task", "goal_action"].includes(itemType)
    ? queuedSend(`/events/${itemType}/${id}`, "POST", body, "event.log")
    : send(`/events/${itemType}/${id}`, "POST", body),
  history: (params) => get("/history", params),

  tasks: (params) => get("/tasks", params),
  createTask: (body) => queuedSend("/tasks", "POST", body, "task.create"),
  updateTask: (id, body) => send(`/tasks/${id}`, "PATCH", body),
  routines: (params) => get("/routines", params),
  createRoutine: (body) => send("/routines", "POST", body),
  updateRoutine: (id, body) => send(`/routines/${id}`, "PATCH", body),
  medications: (params) => get("/medications", params),
  createMedication: (body) => send("/medications", "POST", body),
  updateMedication: (id, body) => send(`/medications/${id}`, "PATCH", body),

  goals: (params) => get("/goals", params),
  goalAnalytics: (id) => get(`/goals/${id}/analytics`),
  toggleGoalMilestone: (id, milestoneId, completed) => send(`/goals/${id}/milestones/${milestoneId}`, "PATCH", { completed }),
  addGoalMilestone: (id, body) => send(`/goals/${id}/milestones`, "POST", body),
  createGoal: (body) => send("/goals", "POST", body),
  updateGoal: (id, body) => send(`/goals/${id}`, "PATCH", body),
  archiveGoal: (id) => send(`/goals/${id}`, "DELETE"),

  health: (params) => get("/health", params),
  healthSummary: (params) => get("/health/summary", params),
  createHealth: (body) => send("/health", "POST", body),
  deleteHealth: (id) => send(`/health/${id}`, "DELETE"),

  // Health Expansion & Body Measurements
  bodyEntries: (params) => get("/health/body", params),
  bodySummary: (params) => get("/health/body/summary", params),
  createBodyEntry: (body) => send("/health/body", "POST", body),
  deleteBodyEntry: (id) => send(`/health/body/${id}`, "DELETE"),
  vitals: (params) => get("/health/vitals", params),

  // Sleep Sessions & Analytics
  sleepSessions: (params) => get("/health/sleep", params),
  sleepAnalytics: (params) => get("/health/sleep/analytics", params),
  createSleepSession: (body) => send("/health/sleep", "POST", body),
  deleteSleepSession: (id) => send(`/health/sleep/${id}`, "DELETE"),

  // Fitness & Strength
  fitnessSummary: (params) => get("/fitness", params),
  workoutSessions: (params) => get("/fitness/workouts", params),
  createWorkoutSession: (body) => send("/fitness/workouts", "POST", body),
  deleteWorkoutSession: (id) => send(`/fitness/workouts/${id}`, "DELETE"),
  strengthVolume: (params) => get("/fitness/volume", params),

  // Nutrition
  nutritionEntries: (params) => get("/nutrition", params),
  nutritionSummary: (params) => get("/nutrition/summary", params),
  createNutritionEntry: (body) => send("/nutrition", "POST", body),
  deleteNutritionEntry: (id) => send(`/nutrition/${id}`, "DELETE"),

  // Mind & Reflection
  mindSummary: (params) => get("/mind", params),
  mindEntries: (params) => get("/mind/entries", params),
  createMindEntry: (body) => send("/mind/entries", "POST", body),

  moneyEntries: (params) => get("/money/entries", params),
  moneySummary: (params) => get("/money/summary", params),
  createMoneyEntry: (body) => send("/money/entries", "POST", body),
  deleteMoneyEntry: (id) => send(`/money/entries/${id}`, "DELETE"),
  moneyPlans: (params) => get("/money/plans", params),
  createMoneyPlan: (body) => send("/money/plans", "POST", body),
  updateMoneyPlan: (id, body) => send(`/money/plans/${id}`, "PATCH", body),
  payBill: (planId, body = {}) => send(`/money/plans/${planId}/pay`, "POST", body),
  accounts: () => get("/money/accounts"),
  createAccount: (body) => send("/money/accounts", "POST", body),
  updateAccount: (id, body) => send(`/money/accounts/${id}`, "PATCH", body),
  deleteAccount: (id) => send(`/money/accounts/${id}`, "DELETE"),
  cashflow: (params) => get("/money/cashflow", params),

  journal: (params) => get("/journal", params),
  journalSearch: (params) => get("/journal/search", params),
  journalAnalytics: () => get("/journal/analytics"),
  createJournal: (body) => send("/journal", "POST", body),
  deleteJournal: (id) => send(`/journal/${id}`, "DELETE"),
  insights: (params) => get("/insights", params),
  dismissInsight: (id) => send(`/insights/${id}/dismiss`, "PATCH", {}),
  insightFeedback: (id, action) => send(`/insights/${id}/feedback`, "PATCH", { action }),
  report: (params) => get("/reports", params),
  planTomorrow: () => get("/planning/tomorrow"),
  aiReview: (body) => send("/ai/review", "POST", body),
  aiAsk: (body) => send("/ai/ask", "POST", body),
  notifications: () => get("/notifications"),
  readNotification: (id) => send(`/notifications/${id}/read`, "PATCH", {}),
  pushConfig: () => get("/push/config"),
  pushSubscriptions: () => get("/push/subscriptions"),
  subscribePush: (body) => send("/push/subscriptions", "POST", body),
  unsubscribePush: (endpoint) => send("/push/subscriptions", "DELETE", { endpoint }),
  financeImportPreview: (body) => send("/money/import/preview", "POST", body),
  financeImportConfirm: (id) => send(`/money/import/${id}/confirm`, "POST", {}),
  exportData: () => get("/settings/export"),
  deleteData: (confirmation) => send("/settings/data", "DELETE", { confirmation }),
};

export default lifeApi;
