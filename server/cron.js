const notificationSchedulerService = require("./services/notificationSchedulerService");
const lifeNotificationService = require("./life/scheduling/notificationService");

async function runCronJobs() {
  console.log(`[Cron] Running scheduled hourly notifications: ${new Date().toISOString()}`);
  try {
    // 1. Daily Inspirational Quotes
    await notificationSchedulerService.handleDailyQuotes();
    
    // 2. Reading Reminders
    await notificationSchedulerService.handleReadingReminders();
    
    // 3. Weekly Summary
    await notificationSchedulerService.handleWeeklySummary();
  } catch (error) {
    console.error("[Cron] Error executing cron jobs:", error);
  }
}

async function runLifeNotificationJobs() {
  try {
    await lifeNotificationService.processDueNotifications({ limit: 100 });
  } catch (error) {
    console.error("[LifeOS Scheduler] Notification processing failed:", error.message);
  }
}

async function runLifeReminderMaintenance() {
  try {
    await lifeNotificationService.replenishReminderJobs({ daysAhead: 14, batchSize: 200, maximum: 5000 });
  } catch (error) {
    console.error("[LifeOS Scheduler] Reminder replenishment failed:", error.message);
  }
}

// Start hourly scheduler
function startScheduler() {
  console.log("[Cron] Initializing hourly notification scheduler...");
  
  // Run once shortly after start (e.g., 5 seconds) to allow server & DB setup to settle
  setTimeout(() => {
    runCronJobs();
    runLifeReminderMaintenance();
    runLifeNotificationJobs();
  }, 5000);

  // Set interval to run every hour (3600000 ms)
  setInterval(() => {
    runCronJobs();
    runLifeReminderMaintenance();
  }, 60 * 60 * 1000);

  // Life reminders use persistent, idempotent jobs. The minute poller is a
  // safe local/default worker; a dedicated queue worker can call the same
  // processDueNotifications boundary in production.
  setInterval(() => {
    runLifeNotificationJobs();
  }, 60 * 1000);
}

module.exports = { runLifeNotificationJobs, runLifeReminderMaintenance, startScheduler };
