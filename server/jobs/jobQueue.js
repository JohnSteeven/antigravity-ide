"use strict";

const { z } = require("zod");
const crypto = require("crypto");
const { redisManager } = require("../redis/redisClient");
const activityLogRepository = require("../repositories/activityLogRepository");

class JobQueueError extends Error {
  constructor(message, code = "JOB_QUEUE_ERROR", status = 400) {
    super(message);
    this.name = "JobQueueError";
    this.code = code;
    this.status = status;
  }
}

// ─── Allowlisted Job Types ──────────────────────────────────────────────────
const JOB_TYPES = {
  EMAIL_DISPATCH: "EMAIL_DISPATCH",
  NOTIFICATION_DISPATCH: "NOTIFICATION_DISPATCH",
  MAINTENANCE_CLEANUP: "MAINTENANCE_CLEANUP",
  MEDIA_SYNC: "MEDIA_SYNC",
};

// ─── Payload Schemas ────────────────────────────────────────────────────────
const payloadSchemas = {
  [JOB_TYPES.EMAIL_DISPATCH]: z.object({
    jobType: z.string().min(1),
    payload: z.record(z.any()),
    recipient: z.string().optional(),
  }),
  [JOB_TYPES.NOTIFICATION_DISPATCH]: z.object({
    recipientId: z.string().min(1),
    eventType: z.string().min(1),
    entityId: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }),
  [JOB_TYPES.MAINTENANCE_CLEANUP]: z.object({
    task: z.enum(["stale_otp", "expired_tokens", "all"]),
    maxRecords: z.number().int().positive().optional(),
  }),
  [JOB_TYPES.MEDIA_SYNC]: z.object({
    assetId: z.string().min(1),
    action: z.string().min(1),
    provider: z.string().optional(),
  }),
};

class JobQueue {
  constructor(options = {}) {
    this.redis = options.redis || redisManager;
    this.maxRetries = options.maxRetries || 3;
    this.jobHandlers = new Map();
    this.inFlightJobs = new Set();
    this.isDraining = false;
    this.queue = []; // In-memory fallback / test queue
    this.stats = {
      enqueued: 0,
      processed: 0,
      failed: 0,
      retried: 0,
      deduplicated: 0,
    };

    this._registerDefaultHandlers();
  }

  _registerDefaultHandlers() {
    // 1. Transactional Email Dispatcher
    this.registerHandler(JOB_TYPES.EMAIL_DISPATCH, async (data) => {
      const emailService = require("../services/emailService");
      const handler = emailService.handlers?.[data.jobType];
      if (!handler) {
        throw new JobQueueError(`Unknown email handler: ${data.jobType}`, "UNKNOWN_EMAIL_HANDLER", 400);
      }
      return handler(data.payload);
    });

    // 2. Scheduled / Maintenance Cleanup
    this.registerHandler(JOB_TYPES.MAINTENANCE_CLEANUP, async (data) => {
      const results = {};
      if (data.task === "stale_otp" || data.task === "all") {
        const OTP = require("../models/OTP");
        const res = await OTP.deleteMany({ expiresAt: { $lt: new Date() } });
        results.staleOtpDeleted = res.deletedCount || 0;
      }
      if (data.task === "expired_tokens" || data.task === "all") {
        const authService = require("../services/authService");
        if (typeof authService.cleanupExpiredTokens === "function") {
          await authService.cleanupExpiredTokens();
          results.expiredTokensCleaned = true;
        }
      }
      return results;
    });

    // 3. Notification Dispatch
    this.registerHandler(JOB_TYPES.NOTIFICATION_DISPATCH, async (data) => {
      // Safe async notification fanout handler
      return { recipientId: data.recipientId, eventType: data.eventType, dispatched: true };
    });

    // 4. Media Sync Followup
    this.registerHandler(JOB_TYPES.MEDIA_SYNC, async (data) => {
      return { assetId: data.assetId, action: data.action, synced: true };
    });
  }

  registerHandler(jobType, handler) {
    if (!JOB_TYPES[jobType]) {
      throw new JobQueueError(`Cannot register handler for unknown job type: ${jobType}`, "INVALID_JOB_TYPE", 400);
    }
    this.jobHandlers.set(jobType, handler);
  }

  validatePayload(type, payload) {
    const schema = payloadSchemas[type];
    if (!schema) {
      throw new JobQueueError(`Unknown job type: "${type}". Allowed: ${Object.keys(JOB_TYPES).join(", ")}`, "UNKNOWN_JOB_TYPE", 400);
    }
    const result = schema.safeParse(payload);
    if (!result.success) {
      const issues = result.error?.issues || result.error?.errors || [];
      const details = issues.map((e) => `${e.path?.join(".") || "payload"}: ${e.message}`).join(", ");
      throw new JobQueueError(`Invalid payload for job "${type}": ${details}`, "INVALID_JOB_PAYLOAD", 422);
    }
    return result.data;
  }

  async checkDeduplication(deduplicationKey, ttlSeconds = 300) {
    if (!deduplicationKey) return false;
    const key = `queue:dedup:${deduplicationKey}`;
    const exists = await this.redis.exists(key);
    if (exists) return true;
    await this.redis.set(key, "1", { EX: ttlSeconds });
    return false;
  }

  async enqueue(type, payload, options = {}) {
    if (this.isDraining) {
      throw new JobQueueError("Queue is draining and cannot accept new jobs.", "QUEUE_DRAINING", 503);
    }

    if (!JOB_TYPES[type]) {
      throw new JobQueueError(`Job type "${type}" is not allowlisted.`, "UNSUPPORTED_JOB_TYPE", 400);
    }

    const validatedPayload = this.validatePayload(type, payload);
    const jobId = options.jobId || `job_${crypto.randomBytes(12).toString("hex")}`;
    const deduplicationKey = options.deduplicationKey;

    if (deduplicationKey) {
      const isDuplicate = await this.checkDeduplication(deduplicationKey, options.dedupTtlSeconds || 300);
      if (isDuplicate) {
        this.stats.deduplicated++;
        return { jobId, status: "deduplicated", deduplicationKey };
      }
    }

    const job = {
      id: jobId,
      type,
      payload: validatedPayload,
      attempt: 1,
      maxRetries: options.maxRetries || this.maxRetries,
      createdAt: new Date(),
      deduplicationKey,
    };

    this.queue.push(job);
    this.stats.enqueued++;

    if (!options.deferExecution && process.env.NODE_ENV !== "test") {
      setImmediate(() => this._processNext());
    }

    return { jobId, status: "enqueued", type };
  }

  async _processNext() {
    if (this.isDraining || this.queue.length === 0) return;
    const job = this.queue.shift();
    if (!job) return;

    this.inFlightJobs.add(job.id);
    const handler = this.jobHandlers.get(job.type);

    try {
      if (!handler) {
        throw new JobQueueError(`No handler registered for job type: ${job.type}`, "NO_JOB_HANDLER", 500);
      }

      await handler(job.payload);
      this.stats.processed++;
    } catch (err) {
      console.warn(`[JobQueue] Attempt ${job.attempt}/${job.maxRetries} failed for job "${job.type}" (${job.id}): ${err.message}`);

      if (job.attempt < job.maxRetries) {
        job.attempt++;
        this.stats.retried++;
        const backoffMs = Math.pow(2, job.attempt) * 200; // 400ms, 800ms, 1600ms
        setTimeout(() => {
          this.queue.push(job);
          this._processNext();
        }, backoffMs);
      } else {
        this.stats.failed++;
        console.error(`[JobQueue] Job "${job.type}" (${job.id}) failed permanently after ${job.maxRetries} attempts.`);

        // Record non-sensitive audit log
        await activityLogRepository.create({
          action: "job_failed_permanently",
          description: `Background job ${job.type} failed permanently`,
          module: "jobs",
        }).catch(() => {});
      }
    } finally {
      this.inFlightJobs.delete(job.id);
      if (this.queue.length > 0) {
        setImmediate(() => this._processNext());
      }
    }
  }

  async processNextSync() {
    if (this.queue.length === 0) return null;
    const job = this.queue.shift();
    if (!job) return null;

    this.inFlightJobs.add(job.id);
    const handler = this.jobHandlers.get(job.type);

    try {
      if (!handler) {
        throw new JobQueueError(`No handler registered for job type: ${job.type}`, "NO_JOB_HANDLER", 500);
      }
      const result = await handler(job.payload);
      this.stats.processed++;
      return { success: true, result, jobId: job.id };
    } catch (err) {
      this.stats.failed++;
      throw err;
    } finally {
      this.inFlightJobs.delete(job.id);
    }
  }

  async shutdown(timeoutMs = 5000) {
    this.isDraining = true;
    const startTime = Date.now();

    while (this.inFlightJobs.size > 0 && Date.now() - startTime < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    this.queue = [];
    return {
      drained: this.inFlightJobs.size === 0,
      activeRemaining: this.inFlightJobs.size,
    };
  }

  getHealth() {
    return {
      status: this.isDraining ? "draining" : "ready",
      queueSize: this.queue.length,
      inFlightCount: this.inFlightJobs.size,
      stats: { ...this.stats },
    };
  }
}

const defaultJobQueue = new JobQueue();

module.exports = {
  JOB_TYPES,
  JobQueue,
  JobQueueError,
  defaultJobQueue,
};
