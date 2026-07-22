const notificationSchedulerService = require("./services/notificationSchedulerService");

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

// Start hourly scheduler
function startScheduler() {
  console.log("[Cron] Initializing hourly notification scheduler...");
  
  // Run once shortly after start (e.g., 5 seconds) to allow server & DB setup to settle
  setTimeout(() => {
    runCronJobs();
  }, 5000);

  // Set interval to run every hour (3600000 ms)
  setInterval(() => {
    runCronJobs();
  }, 60 * 60 * 1000);
}

module.exports = { startScheduler };
