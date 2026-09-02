const express = require("express");
const request = require("supertest");

const send = (name, status = 200) => (req, res) => res.status(status).json({ success: true, data: { operation: name, user: req.user._id } });
jest.mock("../life/controller", () => ({
  getProfile: send("profile"), updateProfile: send("profile-update"), completeOnboarding: send("onboarding"), skipOnboarding: send("onboarding-skip"), today: send("today"),
  listHabits: send("habits"), createHabit: send("habit-create", 201), updateHabit: send("habit-update"), setHabitStatus: send("habit-status"), logEvent: send("completion", 201), history: send("history"),
  listTasks: send("tasks"), createTask: send("task-create", 201), updateTask: send("task-update"), listRoutines: send("routines"), createRoutine: send("routine-create", 201), updateRoutine: send("routine-update"),
  listMedications: send("medications"), createMedication: send("medication-create", 201), updateMedication: send("medication-update"),
  listGoals: send("goals"), createGoal: send("goal-create", 201), updateGoal: send("goal-update"), archiveGoal: send("goal-archive"),
  listHealth: send("health"), healthSummary: send("health-summary"), createHealth: send("health-create", 201), deleteHealth: send("health-delete"),
  listFinance: send("money"), financeSummary: send("money-summary"), createFinance: send("money-create", 201), deleteFinance: send("money-delete"), listFinancePlans: send("plans"), createFinancePlan: send("plan-create", 201), updateFinancePlan: send("plan-update"),
  listJournal: send("journal"), createJournal: send("journal-create", 201), deleteJournal: send("journal-delete"), insights: send("weekly-report"), dismissInsight: send("insight-dismiss"), notifications: send("notifications"), exportData: send("export"), deleteData: send("delete-data"),
  capabilities: send("capabilities"), search: send("search"), templates: send("templates"), applyTemplate: send("template-apply", 201),
  insightFeedback: send("insight-feedback"), report: send("report"), planTomorrow: send("plan-tomorrow"), aiReview: send("ai-review"), aiAsk: send("ai-ask"),
  readNotification: send("notification-read"), pushConfig: send("push-config"), pushSubscriptions: send("push-list"), subscribePush: send("push-subscribe", 201), unsubscribePush: send("push-unsubscribe"),
  financeImportPreview: send("finance-import-preview", 201), financeImportConfirm: send("finance-import-confirm"),
}));

const lifeRoutes = require("../life/routes");
const app = express();
app.use(express.json());
app.use("/api/life", (req, res, next) => {
  if (req.headers.authorization !== "Bearer user-a") return res.status(401).json({ success: false });
  req.user = { _id: "user-a" };
  next();
}, lifeRoutes);

const id = "64b000000000000000000001";

describe("Life API route integration", () => {
  test("all Life endpoints are private", async () => expect((await request(app).get("/api/life/today")).status).toBe(401));

  test.each([
    ["get", "/api/life/profile", null, 200, "profile"],
    ["patch", "/api/life/profile", { timezone: "Asia/Kolkata" }, 200, "profile-update"],
    ["post", "/api/life/onboarding/skip", {}, 200, "onboarding-skip"],
    ["get", "/api/life/today?date=2026-08-11", null, 200, "today"],
    ["get", "/api/life/capabilities", null, 200, "capabilities"],
    ["get", "/api/life/search?q=gym", null, 200, "search"],
    ["get", "/api/life/templates", null, 200, "templates"],
    ["post", "/api/life/templates/reading/apply", { name: "Read", time: "20:30", reminderEnabled: false }, 201, "template-apply"],
    ["post", "/api/life/habits", { name: "Walk", schedule: { type: "daily", startDate: "2026-08-11" } }, 201, "habit-create"],
    ["patch", `/api/life/habits/${id}`, { name: "Walk gently" }, 200, "habit-update"],
    ["patch", `/api/life/habits/${id}/status`, { status: "archived" }, 200, "habit-status"],
    ["post", `/api/life/events/habit/${id}`, { status: "completed", scheduledDate: "2026-08-11", clientMutationId: "device-a-123" }, 201, "completion"],
    ["post", "/api/life/medications", { name: "Recorded medicine", doseText: "As entered", schedule: { type: "daily", startDate: "2026-08-11", times: ["08:00"] }, reminder: { enabled: true, times: ["08:00"], channels: ["in_app"] } }, 201, "medication-create"],
    ["get", "/api/life/history", null, 200, "history"],
    ["post", "/api/life/goals", { title: "Learn" }, 201, "goal-create"],
    ["patch", `/api/life/goals/${id}`, { manualProgress: 25 }, 200, "goal-update"],
    ["delete", `/api/life/goals/${id}`, null, 200, "goal-archive"],
    ["post", "/api/life/health", { type: "water", value: 250, unit: "ml" }, 201, "health-create"],
    ["get", "/api/life/health/summary", null, 200, "health-summary"],
    ["post", "/api/life/money/entries", { type: "expense", amount: 12.5, currency: "USD" }, 201, "money-create"],
    ["get", "/api/life/money/summary", null, 200, "money-summary"],
    ["post", "/api/life/journal", { type: "weekly_review", body: "A useful week." }, 201, "journal-create"],
    ["get", "/api/life/insights?start=2026-08-05&end=2026-08-11", null, 200, "weekly-report"],
    ["patch", `/api/life/insights/${id}/feedback`, { action: "useful" }, 200, "insight-feedback"],
    ["get", "/api/life/reports?days=30", null, 200, "report"],
    ["get", "/api/life/planning/tomorrow", null, 200, "plan-tomorrow"],
    ["post", "/api/life/ai/review", { days: 7 }, 200, "ai-review"],
    ["post", "/api/life/ai/ask", { days: 7, question: "What changed?" }, 200, "ai-ask"],
    ["get", "/api/life/notifications", null, 200, "notifications"],
    ["get", "/api/life/push/config", null, 200, "push-config"],
    ["post", "/api/life/push/subscriptions", { endpoint: "https://push.example/sub", keys: { p256dh: "key", auth: "auth" } }, 201, "push-subscribe"],
    ["post", "/api/life/money/import/preview", { csvText: "date,amount\n2026-08-11,12" }, 201, "finance-import-preview"],
    ["post", `/api/life/money/import/${id}/confirm`, {}, 200, "finance-import-confirm"],
  ])("%s %s maps through private validation/controller boundary", async (method, path, body, status, operation) => {
    let call = request(app)[method](path).set("Authorization", "Bearer user-a");
    if (body) call = call.send(body);
    const response = await call;
    expect(response.status).toBe(status);
    expect(response.body.data).toMatchObject({ operation, user: "user-a" });
  });

  test("invalid create payloads fail before controller execution", async () => {
    const response = await request(app).post("/api/life/habits").set("Authorization", "Bearer user-a").send({ name: "", schedule: {} });
    expect(response.status).toBe(422);
    expect(response.body.code).toBe("LIFE_VALIDATION");
  });
});
