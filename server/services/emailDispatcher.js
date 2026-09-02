const env = require("../config/env");
const activityLogRepository = require("../repositories/activityLogRepository");

class EmailDispatcher {
  constructor() {
    this.maxRetries = env.smtp.maxRetries || 3;
  }

  /**
   * Enqueue an email job for asynchronous processing.
   * Isolates API HTTP controllers from SMTP latency and provider errors.
   */
  enqueue(jobType, payload) {
    setImmediate(() => {
      this._processJob(jobType, payload, 1).catch((err) => {
        console.error(`[emailDispatcher] Critical error processing "${jobType}":`, err.message);
      });
    });
  }

  async _processJob(jobType, payload, attempt) {
    const emailService = require("./emailService");
    const handler = emailService.handlers?.[jobType];

    if (!handler) {
      console.warn(`[emailDispatcher] Unknown email job type: "${jobType}"`);
      return;
    }

    try {
      await handler(payload);
    } catch (err) {
      console.warn(`[emailDispatcher] Attempt ${attempt}/${this.maxRetries} failed for "${jobType}": ${err.message}`);

      if (attempt < this.maxRetries) {
        const delay = Math.pow(2, attempt) * 500; // 1s, 2s, 4s backoff
        setTimeout(() => {
          this._processJob(jobType, payload, attempt + 1).catch(() => {});
        }, delay);
      } else {
        console.error(`[emailDispatcher] All ${this.maxRetries} attempts failed for email "${jobType}".`);
        
        // Record non-sensitive failure log
        await activityLogRepository.create({
          action: "email_dispatch_failed",
          description: `Email dispatch failed for type "${jobType}"`,
          module: "email",
        }).catch(() => {});
      }
    }
  }
}

module.exports = new EmailDispatcher();
