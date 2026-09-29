"use strict";

const { defaultJobQueue, JOB_TYPES } = require("../jobs/jobQueue");

class EmailDispatcher {
  constructor(queue = defaultJobQueue) {
    this.queue = queue;
  }

  /**
   * Enqueue an email job for asynchronous processing.
   * Isolates API HTTP controllers from SMTP latency and provider errors.
   */
  enqueue(jobType, payload, options = {}) {
    const deduplicationKey = options.deduplicationKey || (payload.to && jobType ? `email_${jobType}_${payload.to}` : undefined);

    return this.queue.enqueue(
      JOB_TYPES.EMAIL_DISPATCH,
      {
        jobType,
        payload,
        recipient: payload.to,
      },
      {
        ...options,
        deduplicationKey,
      }
    ).catch((err) => {
      console.error(`[emailDispatcher] Failed to enqueue "${jobType}":`, err.message);
      return { status: "failed", error: err.message };
    });
  }
}

module.exports = new EmailDispatcher();
