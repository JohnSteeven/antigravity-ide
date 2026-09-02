const AuditLogger = require("../audit/AuditLogger");
const LifeEvent = require("./models/LifeEvent");
const LifeNotificationDelivery = require("./models/LifeNotificationDelivery");
const LifeNotificationJob = require("./models/LifeNotificationJob");
const Notification = require("../models/Notification");
const { notFound, LifeError } = require("./domain/errors");
const eventService = require("./services/eventService");
const habitService = require("./services/habitService");
const insightService = require("./services/insightService");
const lifeDataService = require("./services/lifeDataService");
const medicationService = require("./services/medicationService");
const profileService = require("./services/profileService");
const privacyService = require("./services/privacyService");
const todayService = require("./services/todayService");
const notificationService = require("./scheduling/notificationService");
const metrics = require("./services/observability");
const capabilityService = require("./services/capabilityService");
const financeImportService = require("./services/financeImportService");
const integrationService = require("./services/integrationService");
const lifeAiService = require("./services/lifeAiService");
const planningService = require("./services/planningService");
const reportService = require("./services/reportService");
const searchService = require("./services/searchService");
const templateService = require("./services/templateService");
const webPushService = require("./services/webPushService");

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const userId = (req) => req.user._id;
const audit = (req, entity, entityId, action) => AuditLogger.log({ entity: `life_${entity}`, entityId, action, userId: userId(req), req, details: `Life ${entity} ${action}` });

const handle = (name, operation) => async (req, res, next) => {
  const startedAt = Date.now();
  try {
    await operation(req, res);
    metrics.increment(`life_request_${name}_success`);
  } catch (error) {
    metrics.increment(`life_request_${name}_failure`);
    next(error);
  } finally {
    metrics.observe(`life_request_${name}_latency_ms`, Date.now() - startedAt);
  }
};

const controller = {
  getProfile: handle("profile_get", async (req, res) => ok(res, await profileService.getOrCreateProfile(userId(req)))),
  updateProfile: handle("profile_update", async (req, res) => ok(res, await profileService.updateProfile(userId(req), req.body))),
  completeOnboarding: handle("onboarding", async (req, res) => ok(res, await profileService.completeOnboarding(userId(req), req.body))),
  skipOnboarding: handle("onboarding_skip", async (req, res) => ok(res, await profileService.skipOnboarding(userId(req), req.body))),
  today: handle("today", async (req, res) => ok(res, await todayService.getToday(userId(req), req.query.date))),

  listHabits: handle("habits_list", async (req, res) => ok(res, await habitService.listHabits(userId(req), req.query))),
  createHabit: handle("habit_create", async (req, res) => {
    const habit = await habitService.createHabit(userId(req), req.body);
    await notificationService.scheduleHabitReminders(userId(req), habit).catch(() => metrics.increment("life_notification_schedule_failures"));
    await audit(req, "habit", habit._id, "create");
    ok(res, habit, 201);
  }),
  updateHabit: handle("habit_update", async (req, res) => {
    const habit = await habitService.updateHabit(userId(req), req.params.id, req.body);
    await notificationService.scheduleHabitReminders(userId(req), habit).catch(() => metrics.increment("life_notification_schedule_failures"));
    await audit(req, "habit", habit._id, "update");
    ok(res, habit);
  }),
  setHabitStatus: handle("habit_status", async (req, res) => {
    const habit = await habitService.setHabitStatus(userId(req), req.params.id, req.body.status);
    await audit(req, "habit", habit._id, req.body.status);
    ok(res, habit);
  }),
  logEvent: handle("event_create", async (req, res) => {
    const result = await eventService.logEvent(userId(req), req.params.itemType, req.params.id, req.body);
    if (result.event.status === "snoozed") {
      const item = await eventService.assertOwnedItem(userId(req), req.params.itemType, req.params.id);
      await notificationService.scheduleSnooze(userId(req), result.event, item);
    }
    await audit(req, "event", result.event._id, result.duplicate ? "duplicate_suppressed" : result.event.status);
    ok(res, result, result.duplicate ? 200 : 201);
  }),
  history: handle("history", async (req, res) => {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const filter = { user: userId(req), ...(req.query.itemType ? { itemType: req.query.itemType } : {}), ...(req.query.itemId ? { itemId: req.query.itemId } : {}), ...(req.query.start || req.query.end ? { scheduledDate: { ...(req.query.start ? { $gte: req.query.start } : {}), ...(req.query.end ? { $lte: req.query.end } : {}) } } : {}) };
    const [items, total] = await Promise.all([LifeEvent.find(filter).sort({ occurredAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), LifeEvent.countDocuments(filter)]);
    ok(res, { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  }),

  listGoals: handle("goals_list", async (req, res) => ok(res, await lifeDataService.listGoals(userId(req), req.query))),
  createGoal: handle("goal_create", async (req, res) => { const item = await lifeDataService.createGoal(userId(req), req.body); await audit(req, "goal", item._id, "create"); ok(res, item, 201); }),
  updateGoal: handle("goal_update", async (req, res) => { const item = await lifeDataService.updateGoal(userId(req), req.params.id, req.body); await audit(req, "goal", item._id, "update"); ok(res, item); }),
  archiveGoal: handle("goal_archive", async (req, res) => { const item = await lifeDataService.archiveGoal(userId(req), req.params.id); await audit(req, "goal", item._id, "archive"); ok(res, item); }),

  listTasks: handle("tasks_list", async (req, res) => ok(res, await lifeDataService.listTasks(userId(req), req.query))),
  createTask: handle("task_create", async (req, res) => { const item = await lifeDataService.createTask(userId(req), req.body); await audit(req, "task", item._id, "create"); ok(res, item, 201); }),
  updateTask: handle("task_update", async (req, res) => { const item = await lifeDataService.updateTask(userId(req), req.params.id, req.body); await audit(req, "task", item._id, "update"); ok(res, item); }),

  listRoutines: handle("routines_list", async (req, res) => ok(res, await lifeDataService.listRoutines(userId(req), req.query))),
  createRoutine: handle("routine_create", async (req, res) => { const item = await lifeDataService.createRoutine(userId(req), req.body); await notificationService.scheduleRoutineReminders(userId(req), item).catch(() => metrics.increment("life_notification_schedule_failures")); await audit(req, "routine", item._id, "create"); ok(res, item, 201); }),
  updateRoutine: handle("routine_update", async (req, res) => { const item = await lifeDataService.updateRoutine(userId(req), req.params.id, req.body); await notificationService.scheduleRoutineReminders(userId(req), item).catch(() => metrics.increment("life_notification_schedule_failures")); await audit(req, "routine", item._id, "update"); ok(res, item); }),

  listMedications: handle("medications_list", async (req, res) => ok(res, await medicationService.listMedications(userId(req), req.query))),
  createMedication: handle("medication_create", async (req, res) => { const item = await medicationService.createMedication(userId(req), req.body); await notificationService.scheduleMedicationReminders(userId(req), item).catch(() => metrics.increment("life_notification_schedule_failures")); await audit(req, "medication", item._id, "create"); ok(res, item, 201); }),
  updateMedication: handle("medication_update", async (req, res) => { const item = await medicationService.updateMedication(userId(req), req.params.id, req.body); await notificationService.scheduleMedicationReminders(userId(req), item).catch(() => metrics.increment("life_notification_schedule_failures")); await audit(req, "medication", item._id, "update"); ok(res, item); }),

  listHealth: handle("health_list", async (req, res) => ok(res, await lifeDataService.listHealthEntries(userId(req), req.query))),
  healthSummary: handle("health_summary", async (req, res) => ok(res, await lifeDataService.healthSummary(userId(req), req.query))),
  createHealth: handle("health_create", async (req, res) => { const item = await lifeDataService.createHealthEntry(userId(req), req.body); await audit(req, "health_entry", item._id, "create"); ok(res, item, 201); }),
  deleteHealth: handle("health_delete", async (req, res) => { const item = await lifeDataService.deleteHealthEntry(userId(req), req.params.id); await audit(req, "health_entry", item._id, "delete"); ok(res, { id: item._id }); }),

  listFinance: handle("finance_list", async (req, res) => ok(res, await lifeDataService.listFinanceEntries(userId(req), req.query))),
  financeSummary: handle("finance_summary", async (req, res) => ok(res, await lifeDataService.financeSummary(userId(req), req.query))),
  createFinance: handle("finance_create", async (req, res) => { const item = await lifeDataService.createFinanceEntry(userId(req), req.body); await audit(req, "finance_entry", item._id, "create"); ok(res, item, 201); }),
  deleteFinance: handle("finance_delete", async (req, res) => { const item = await lifeDataService.deleteFinanceEntry(userId(req), req.params.id); await audit(req, "finance_entry", item._id, "delete"); ok(res, { id: item._id }); }),
  listFinancePlans: handle("finance_plans_list", async (req, res) => ok(res, await lifeDataService.listFinancePlans(userId(req), req.query))),
  createFinancePlan: handle("finance_plan_create", async (req, res) => { const item = await lifeDataService.createFinancePlan(userId(req), req.body); await audit(req, "finance_plan", item._id, "create"); ok(res, item, 201); }),
  updateFinancePlan: handle("finance_plan_update", async (req, res) => { const item = await lifeDataService.updateFinancePlan(userId(req), req.params.id, req.body); await audit(req, "finance_plan", item._id, "update"); ok(res, item); }),

  listJournal: handle("journal_list", async (req, res) => ok(res, await lifeDataService.listJournalEntries(userId(req), req.query))),
  createJournal: handle("journal_create", async (req, res) => { const item = await lifeDataService.createJournalEntry(userId(req), req.body); await audit(req, "journal_entry", item._id, "create"); ok(res, item, 201); }),
  deleteJournal: handle("journal_delete", async (req, res) => { const item = await lifeDataService.deleteJournalEntry(userId(req), req.params.id); await audit(req, "journal_entry", item._id, "delete"); ok(res, { id: item._id }); }),

  insights: handle("insights", async (req, res) => ok(res, await insightService.buildInsights(userId(req), req.query))),
  dismissInsight: handle("insight_dismiss", async (req, res) => { const item = await insightService.dismissInsight(userId(req), req.params.id); if (!item) throw notFound("Insight"); ok(res, item); }),
  insightFeedback: handle("insight_feedback", async (req, res) => { const item = await insightService.recordInsightFeedback(userId(req), req.params.id, req.body.action); if (!item) throw notFound("Insight"); ok(res, item); }),
  report: handle("report", async (req, res) => ok(res, await reportService.buildReport(userId(req), req.query))),
  planTomorrow: handle("plan_tomorrow", async (req, res) => ok(res, await planningService.planTomorrow(userId(req)))),
  search: handle("search", async (req, res) => ok(res, await searchService.searchLife(userId(req), req.query.q, req.query))),
  templates: handle("templates", async (req, res) => ok(res, templateService.listTemplates())),
  applyTemplate: handle("template_apply", async (req, res) => { const item = await templateService.applyTemplate(userId(req), req.params.key, req.body); await audit(req, "template", item._id, "apply"); ok(res, item, 201); }),
  capabilities: handle("capabilities", async (req, res) => ok(res, { ...capabilityService.getCapabilities(), integrations: integrationService.integrationStatus() })),
  aiReview: handle("ai_review", async (req, res) => ok(res, await lifeAiService.generateReview(userId(req), req.body))),
  aiAsk: handle("ai_ask", async (req, res) => ok(res, await lifeAiService.ask(userId(req), req.body.question, req.body))),
  financeImportPreview: handle("finance_import_preview", async (req, res) => ok(res, await financeImportService.previewFinanceCsv(userId(req), req.body.csvText, req.body.mapping), 201)),
  financeImportConfirm: handle("finance_import_confirm", async (req, res) => ok(res, await financeImportService.confirmFinanceImport(userId(req), req.params.id))),
  pushConfig: handle("push_config", async (req, res) => ok(res, webPushService.publicConfig())),
  pushSubscriptions: handle("push_list", async (req, res) => ok(res, await webPushService.listSubscriptions(userId(req)))),
  subscribePush: handle("push_subscribe", async (req, res) => ok(res, await webPushService.subscribe(userId(req), req.body), 201)),
  unsubscribePush: handle("push_unsubscribe", async (req, res) => ok(res, await webPushService.unsubscribe(userId(req), req.body.endpoint))),
  notifications: handle("notifications", async (req, res) => {
    const [notifications, jobs, deliveries] = await Promise.all([
      Notification.find({ user: userId(req), source: "life" }).sort({ createdAt: -1 }).limit(50).lean(),
      LifeNotificationJob.find({ user: userId(req) }).sort({ dueAt: -1 }).limit(50).lean(),
      LifeNotificationDelivery.find({ user: userId(req) }).sort({ attemptedAt: -1 }).limit(50).lean(),
    ]);
    ok(res, { notifications, upcoming: jobs.filter((job) => ["pending", "retry"].includes(job.state)).slice(0, 20).map((job) => ({ id: job._id, title: job.title, message: job.message, dueAt: job.dueAt, state: job.state })), recent: deliveries.slice(0, 20).map((delivery) => ({ id: delivery._id, channel: delivery.channel, status: delivery.status, attemptedAt: delivery.attemptedAt })) });
  }),
  readNotification: handle("notification_read", async (req, res) => { const item = await Notification.findOneAndUpdate({ _id: req.params.id, user: userId(req), source: "life" }, { $set: { status: "read", readAt: new Date() } }, { new: true }); if (!item) throw notFound("Notification"); ok(res, item); }),
  exportData: handle("export", async (req, res) => ok(res, await privacyService.exportLifeData(userId(req)))),
  deleteData: handle("delete_all", async (req, res) => {
    if (req.body.confirmation !== "DELETE MY LIFE DATA") throw new LifeError("Type DELETE MY LIFE DATA to confirm.", 422, "LIFE_DELETE_CONFIRMATION");
    const result = await privacyService.deleteAllLifeData(userId(req));
    await audit(req, "data", userId(req), "delete_all");
    ok(res, result);
  }),
};

module.exports = controller;
