import { apiRequest } from "../../../services/authService";
import { queueOrSend } from "../offline/offlineQueue";

const query = (params = {}) => {
  const value = new URLSearchParams(Object.entries(params).filter(([, item]) => item !== undefined && item !== "" && item !== null)).toString();
  return value ? `?${value}` : "";
};
const get = (path, params) => apiRequest(`/api/life${path}${query(params)}`);
const send = (path, method, body) => apiRequest(`/api/life${path}`, { method, body: body === undefined ? undefined : JSON.stringify(body) });
const queuedSend = (path, method, body, type) => queueOrSend({ path: `/api/life${path}`, method, body, type });

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
  createHabit: (body) => send("/habits", "POST", body),
  updateHabit: (id, body) => send(`/habits/${id}`, "PATCH", body),
  setHabitStatus: (id, status) => send(`/habits/${id}/status`, "PATCH", { status }),
  logEvent: (itemType, id, body) => queuedSend(`/events/${itemType}/${id}`, "POST", body, "event"),
  history: (params) => get("/history", params),

  tasks: (params) => get("/tasks", params),
  createTask: (body) => queuedSend("/tasks", "POST", body, "task"),
  updateTask: (id, body) => send(`/tasks/${id}`, "PATCH", body),
  routines: (params) => get("/routines", params),
  createRoutine: (body) => send("/routines", "POST", body),
  updateRoutine: (id, body) => send(`/routines/${id}`, "PATCH", body),
  medications: (params) => get("/medications", params),
  createMedication: (body) => send("/medications", "POST", body),
  updateMedication: (id, body) => send(`/medications/${id}`, "PATCH", body),

  goals: (params) => get("/goals", params),
  createGoal: (body) => send("/goals", "POST", body),
  updateGoal: (id, body) => send(`/goals/${id}`, "PATCH", body),
  archiveGoal: (id) => send(`/goals/${id}`, "DELETE"),

  health: (params) => get("/health", params),
  healthSummary: (params) => get("/health/summary", params),
  createHealth: (body) => queuedSend("/health", "POST", body, "health"),
  deleteHealth: (id) => send(`/health/${id}`, "DELETE"),

  moneyEntries: (params) => get("/money/entries", params),
  moneySummary: (params) => get("/money/summary", params),
  createMoneyEntry: (body) => queuedSend("/money/entries", "POST", body, "finance"),
  deleteMoneyEntry: (id) => send(`/money/entries/${id}`, "DELETE"),
  moneyPlans: (params) => get("/money/plans", params),
  createMoneyPlan: (body) => send("/money/plans", "POST", body),
  updateMoneyPlan: (id, body) => send(`/money/plans/${id}`, "PATCH", body),

  journal: (params) => get("/journal", params),
  createJournal: (body) => queuedSend("/journal", "POST", body, "journal"),
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
