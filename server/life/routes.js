const express = require("express");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const controller = require("./controller");
const schemas = require("./validators/lifeValidators");

const router = express.Router();
const mutationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 240,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, code: "LIFE_RATE_LIMIT", message: "Too many Life updates. Pause for a moment and try again." },
});
const validId = (req, res, next, value) => {
  if (!mongoose.isValidObjectId(value)) return res.status(404).json({ success: false, code: "LIFE_NOT_FOUND", message: "Life item was not found." });
  next();
};
router.param("id", validId);

router.get("/profile", controller.getProfile);
router.patch("/profile", mutationLimiter, schemas.validate(schemas.profile), controller.updateProfile);
router.post("/onboarding/complete", mutationLimiter, schemas.validate(schemas.profile), controller.completeOnboarding);
router.post("/onboarding/skip", mutationLimiter, schemas.validate(schemas.profile), controller.skipOnboarding);
router.get("/today", controller.today);
router.get("/capabilities", controller.capabilities);
router.get("/search", controller.search);
router.get("/templates", controller.templates);
router.post("/templates/:key/apply", mutationLimiter, schemas.validate(schemas.templateApply), controller.applyTemplate);

router.get("/habits", controller.listHabits);
router.get("/habits/:id/analytics", controller.habitAnalytics);
router.post("/habits", mutationLimiter, schemas.validate(schemas.habitCreate), controller.createHabit);
router.patch("/habits/:id", mutationLimiter, schemas.validate(schemas.habitUpdate), controller.updateHabit);
router.patch("/habits/:id/status", mutationLimiter, schemas.validate(require("zod").z.object({ status: require("zod").z.enum(["active", "paused", "archived"]) })), controller.setHabitStatus);
router.post("/events/:itemType/:id", mutationLimiter, schemas.validate(schemas.event), controller.logEvent);
router.get("/history", controller.history);

router.get("/tasks", controller.listTasks);
router.post("/tasks", mutationLimiter, schemas.validate(schemas.task), controller.createTask);
router.patch("/tasks/:id", mutationLimiter, schemas.validate(schemas.taskUpdate), controller.updateTask);
router.get("/routines", controller.listRoutines);
router.post("/routines", mutationLimiter, schemas.validate(schemas.routine), controller.createRoutine);
router.patch("/routines/:id", mutationLimiter, schemas.validate(schemas.routineUpdate), controller.updateRoutine);
router.get("/medications", controller.listMedications);
router.post("/medications", mutationLimiter, schemas.validate(schemas.medication), controller.createMedication);
router.patch("/medications/:id", mutationLimiter, schemas.validate(schemas.medicationUpdate), controller.updateMedication);

router.get("/goals", controller.listGoals);
router.get("/goals/:id/analytics", controller.goalAnalytics);
router.post("/goals", mutationLimiter, schemas.validate(schemas.goal), controller.createGoal);
router.patch("/goals/:id", mutationLimiter, schemas.validate(schemas.goal.partial()), controller.updateGoal);
router.delete("/goals/:id", mutationLimiter, controller.archiveGoal);
router.patch("/goals/:id/milestones/:milestoneId", mutationLimiter, controller.toggleGoalMilestone);
router.post("/goals/:id/milestones", mutationLimiter, controller.addGoalMilestone);

router.get("/health", controller.listHealth);
router.get("/health/summary", controller.healthSummary);
router.post("/health", mutationLimiter, schemas.validate(schemas.health), controller.createHealth);
router.delete("/health/:id", mutationLimiter, controller.deleteHealth);

router.get("/health/body", controller.listBodyEntries);
router.get("/health/body/summary", controller.bodySummary);
router.post("/health/body", mutationLimiter, schemas.validate(schemas.bodyEntry), controller.createBodyEntry);
router.delete("/health/body/:id", mutationLimiter, controller.deleteBodyEntry);
router.get("/health/vitals", controller.listVitals);

router.get("/health/sleep", controller.listSleepSessions);
router.get("/health/sleep/analytics", controller.sleepAnalytics);
router.post("/health/sleep", mutationLimiter, schemas.validate(schemas.sleepSession), controller.createSleepSession);
router.delete("/health/sleep/:id", mutationLimiter, controller.deleteSleepSession);

router.get("/fitness", controller.fitnessSummary);
router.get("/fitness/workouts", controller.listWorkoutSessions);
router.get("/fitness/volume", controller.strengthVolume);
router.post("/fitness/workouts", mutationLimiter, schemas.validate(schemas.workoutSession), controller.createWorkoutSession);
router.delete("/fitness/workouts/:id", mutationLimiter, controller.deleteWorkoutSession);

router.get("/nutrition", controller.listNutritionEntries);
router.get("/nutrition/summary", controller.nutritionSummary);
router.post("/nutrition", mutationLimiter, schemas.validate(schemas.nutritionEntry), controller.createNutritionEntry);
router.delete("/nutrition/:id", mutationLimiter, controller.deleteNutritionEntry);

router.get("/mind", controller.mindSummary);
router.get("/mind/entries", controller.listMindEntries);
router.post("/mind/entries", mutationLimiter, schemas.validate(schemas.health), controller.createMindEntry);

router.get("/money/entries", controller.listFinance);
router.get("/money/summary", controller.financeSummary);
router.post("/money/entries", mutationLimiter, schemas.validate(schemas.financeEntry), controller.createFinance);
router.delete("/money/entries/:id", mutationLimiter, controller.deleteFinance);
router.get("/money/plans", controller.listFinancePlans);
router.post("/money/plans", mutationLimiter, schemas.validate(schemas.financePlan), controller.createFinancePlan);
router.patch("/money/plans/:id", mutationLimiter, controller.updateFinancePlan);
router.post("/money/plans/:id/pay", mutationLimiter, controller.markBillPaid);
router.get("/money/accounts", controller.listAccounts);
router.post("/money/accounts", mutationLimiter, schemas.validate(schemas.financeAccount), controller.createAccount);
router.patch("/money/accounts/:id", mutationLimiter, schemas.validate(schemas.financeAccountUpdate), controller.updateAccount);
router.delete("/money/accounts/:id", mutationLimiter, controller.deleteAccount);
router.get("/money/cashflow", controller.cashflowAnalytics);

router.get("/journal", controller.listJournal);
router.get("/journal/search", controller.journalSearch);
router.get("/journal/analytics", controller.journalAnalytics);
router.post("/journal", mutationLimiter, schemas.validate(schemas.journal), controller.createJournal);
router.delete("/journal/:id", mutationLimiter, controller.deleteJournal);
router.get("/insights", controller.insights);
router.patch("/insights/:id/dismiss", mutationLimiter, controller.dismissInsight);
router.patch("/insights/:id/feedback", mutationLimiter, schemas.validate(require("zod").z.object({ action: require("zod").z.enum(["dismiss", "useful", "hide_similar"]) })), controller.insightFeedback);
router.get("/reports", controller.report);
router.get("/planning/tomorrow", controller.planTomorrow);
router.post("/ai/review", mutationLimiter, schemas.validate(schemas.aiReview), controller.aiReview);
router.post("/ai/ask", mutationLimiter, schemas.validate(schemas.aiReview.extend({ question: require("zod").z.string().trim().min(1).max(500) })), controller.aiAsk);
router.get("/notifications", controller.notifications);
router.patch("/notifications/:id/read", mutationLimiter, controller.readNotification);
router.get("/push/config", controller.pushConfig);
router.get("/push/subscriptions", controller.pushSubscriptions);
router.post("/push/subscriptions", mutationLimiter, schemas.validate(schemas.pushSubscription), controller.subscribePush);
router.delete("/push/subscriptions", mutationLimiter, schemas.validate(require("zod").z.object({ endpoint: require("zod").z.string().url().max(4096) })), controller.unsubscribePush);

router.post("/money/import/preview", mutationLimiter, schemas.validate(schemas.financeImportPreview), controller.financeImportPreview);
router.post("/money/import/:id/confirm", mutationLimiter, controller.financeImportConfirm);

router.get("/settings/export", controller.exportData);
router.delete("/settings/data", mutationLimiter, controller.deleteData);

module.exports = router;
