const mongoose = require("mongoose");
const notificationSchedulerService = require("./services/notificationSchedulerService");
const lifeNotificationService = require("./life/scheduling/notificationService");
const accountDeletionService = require("./services/accountDeletionService");

const isDbReady = () => mongoose.connection.readyState === 1;

async function runCronJobs() {
  if (!isDbReady()) return;
  console.log(`[Cron] Running scheduled hourly notifications: ${new Date().toISOString()}`);
  try {
    // 1. Daily Inspirational Quotes
    await notificationSchedulerService.handleDailyQuotes();
    
    // 2. Reading Reminders
    await notificationSchedulerService.handleReadingReminders();
    
    // 3. Weekly Summary
    await notificationSchedulerService.handleWeeklySummary();
    await accountDeletionService.purgeDueAccounts({ limit: 50 });
  } catch (error) {
    console.error("[Cron] Error executing cron jobs:", error);
  }
}

async function runLifeNotificationJobs() {
  if (!isDbReady()) return;
  try {
    await lifeNotificationService.processDueNotifications({ limit: 100 });
  } catch (error) {
    console.error("[LifeOS Scheduler] Notification processing failed:", error.message);
  }
}

async function runLifeReminderMaintenance() {
  if (!isDbReady()) return;
  try {
    await lifeNotificationService.replenishReminderJobs({ daysAhead: 14, batchSize: 200, maximum: 5000 });
    await lifeNotificationService.scheduleBriefJobs({ daysAhead: 1, batchSize: 200 });
  } catch (error) {
    console.error("[LifeOS Scheduler] Reminder replenishment failed:", error.message);
  }
}

let schedulerRuntime = null;

// Start hourly scheduler
function startScheduler() {
  if (schedulerRuntime) return schedulerRuntime;
  console.log("[Cron] Initializing hourly notification scheduler...");
  
  // Run once shortly after start (e.g., 5 seconds) to allow server & DB setup to settle
  const startupTimer = setTimeout(() => {
    runCronJobs();
    runLifeReminderMaintenance();
    runLifeNotificationJobs();
  }, 5000);

  // Set interval to run every hour (3600000 ms)
  const hourlyTimer = setInterval(() => {
    runCronJobs();
    runLifeReminderMaintenance();
  }, 60 * 60 * 1000);

  // Life reminders use persistent, idempotent jobs. The minute poller is a
  // safe local/default worker; a dedicated queue worker can call the same
  // processDueNotifications boundary in production.
  const lifeNotificationTimer = setInterval(() => {
    runLifeNotificationJobs();
  }, 60 * 1000);

  schedulerRuntime = {
    close() {
      clearTimeout(startupTimer);
      clearInterval(hourlyTimer);
      clearInterval(lifeNotificationTimer);
      schedulerRuntime = null;
    },
  };
  return schedulerRuntime;
}

module.exports = { runLifeNotificationJobs, runLifeReminderMaintenance, startScheduler };
