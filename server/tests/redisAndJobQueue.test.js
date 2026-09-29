"use strict";

const { redisManager, RedisClientManager, MemoryRedisAdapter, RedisError } = require("../redis/redisClient");
const { JobQueue, JOB_TYPES, JobQueueError } = require("../jobs/jobQueue");
const emailDispatcher = require("../services/emailDispatcher");
const RedisCache = require("../cache/RedisCache");

describe("Phase 22 — Redis and Background Jobs Foundation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("1. Redis Client Abstraction and Memory Fallback", () => {
    it("uses in-memory Redis adapter in test environment", async () => {
      const client = await redisManager.connect();
      expect(client).toBeDefined();
      expect(client.isReady).toBe(true);

      await redisManager.set("test_key", "test_value", { EX: 60 });
      const val = await redisManager.get("test_key");
      expect(val).toBe("test_value");

      await redisManager.del("test_key");
      const deletedVal = await redisManager.get("test_key");
      expect(deletedVal).toBeNull();
    });

    it("handles connection failure when Redis is strictly required in production", async () => {
      const customManager = new RedisClientManager();
      const prevEnv = process.env.NODE_ENV;
      const prevReq = process.env.REQUIRE_REDIS;

      try {
        process.env.NODE_ENV = "production";
        process.env.REQUIRE_REDIS = "true";

        await expect(customManager.connect({ url: "" })).rejects.toMatchObject({
          code: "REDIS_UNAVAILABLE",
          status: 503,
        });
      } finally {
        process.env.NODE_ENV = prevEnv;
        process.env.REQUIRE_REDIS = prevReq;
      }
    });

    it("supports namespaced keys and ping", async () => {
      const adapter = new MemoryRedisAdapter();
      expect(await adapter.ping()).toBe("PONG");
      expect(redisManager.getKey("custom_key")).toBe("myjourney:custom_key");
      expect(redisManager.getKey("myjourney:already_prefixed")).toBe("myjourney:already_prefixed");
    });

    it("RedisCache uses redisManager and supports get, set, delete, and flush", async () => {
      const cache = new RedisCache();
      await cache.set("article_123", { title: "Test Article" }, 60);

      const cached = await cache.get("article_123");
      expect(cached).toEqual({ title: "Test Article" });

      await cache.delete("article_123");
      const afterDel = await cache.get("article_123");
      expect(afterDel).toBeNull();

      const health = await cache.health();
      expect(health.driver).toBe("redis");
    });
  });

  describe("2. Background Job System: Validation, Enqueue, and Handlers", () => {
    let queue;

    beforeEach(() => {
      queue = new JobQueue();
    });

    afterEach(async () => {
      await queue.shutdown(100);
    });

    it("enqueues valid allowlisted jobs", async () => {
      const result = await queue.enqueue(
        JOB_TYPES.EMAIL_DISPATCH,
        {
          jobType: "otp",
          payload: { to: "user@example.com", code: "123456", purpose: "register" },
          recipient: "user@example.com",
        },
        { deferExecution: true }
      );

      expect(result.status).toBe("enqueued");
      expect(result.jobId).toMatch(/^job_[0-9a-f]+/);
      expect(queue.stats.enqueued).toBe(1);
    });

    it("rejects unknown job types immediately", async () => {
      await expect(
        queue.enqueue("UNKNOWN_SUSPICIOUS_JOB", { data: 123 }, { deferExecution: true })
      ).rejects.toMatchObject({
        code: "UNSUPPORTED_JOB_TYPE",
        status: 400,
      });
    });

    it("validates payload schema and rejects malformed payloads with 422", async () => {
      // Missing required fields
      await expect(
        queue.enqueue(
          JOB_TYPES.EMAIL_DISPATCH,
          { jobType: "" }, // empty string invalid
          { deferExecution: true }
        )
      ).rejects.toMatchObject({
        code: "INVALID_JOB_PAYLOAD",
        status: 422,
      });
    });

    it("enforces idempotency via deduplicationKey and prevents duplicate enqueue", async () => {
      const dedupKey = `test_dedup_${Date.now()}`;

      const first = await queue.enqueue(
        JOB_TYPES.MAINTENANCE_CLEANUP,
        { task: "stale_otp" },
        { deduplicationKey: dedupKey, deferExecution: true }
      );
      expect(first.status).toBe("enqueued");

      // Second enqueue with identical deduplication key
      const second = await queue.enqueue(
        JOB_TYPES.MAINTENANCE_CLEANUP,
        { task: "stale_otp" },
        { deduplicationKey: dedupKey, deferExecution: true }
      );
      expect(second.status).toBe("deduplicated");
      expect(queue.stats.deduplicated).toBe(1);
    });
  });

  describe("3. Execution, Retries, Backoff, and Worker Shutdown", () => {
    let queue;

    beforeEach(() => {
      queue = new JobQueue({ maxRetries: 3 });
    });

    afterEach(async () => {
      await queue.shutdown(100);
    });

    it("executes registered job handlers synchronously in test mode", async () => {
      let executed = false;
      queue.registerHandler(JOB_TYPES.NOTIFICATION_DISPATCH, async (data) => {
        executed = true;
        return { recipientId: data.recipientId, status: "sent" };
      });

      await queue.enqueue(
        JOB_TYPES.NOTIFICATION_DISPATCH,
        { recipientId: "user_456", eventType: "course_milestone" },
        { deferExecution: true }
      );

      const processed = await queue.processNextSync();
      expect(executed).toBe(true);
      expect(processed.success).toBe(true);
      expect(queue.stats.processed).toBe(1);
    });

    it("records failure when job execution exhausts maximum retries", async () => {
      queue.registerHandler(JOB_TYPES.MEDIA_SYNC, async () => {
        throw new Error("Simulated media provider failure");
      });

      await queue.enqueue(
        JOB_TYPES.MEDIA_SYNC,
        { assetId: "asset_999", action: "sync_transcription" },
        { deferExecution: true }
      );

      await expect(queue.processNextSync()).rejects.toThrow("Simulated media provider failure");
      expect(queue.stats.failed).toBe(1);
    });

    it("gracefully drains active jobs on shutdown and refuses new jobs", async () => {
      const shutdownResult = await queue.shutdown(500);
      expect(shutdownResult.drained).toBe(true);

      // Attempting to enqueue after drain must reject
      await expect(
        queue.enqueue(JOB_TYPES.MAINTENANCE_CLEANUP, { task: "all" })
      ).rejects.toMatchObject({
        code: "QUEUE_DRAINING",
        status: 503,
      });
    });
  });

  describe("4. Integration: Email Dispatcher and Maintenance Cleanup", () => {
    it("emailDispatcher routes through canonical JobQueue with automatic deduplication key", async () => {
      const result = await emailDispatcher.enqueue("welcome", {
        to: "newuser@example.com",
        token: "tok_123",
      }, { deferExecution: true });

      expect(result.status).toBe("enqueued");
      expect(result.jobId).toBeDefined();
    });

    it("executes scheduled MAINTENANCE_CLEANUP task safely", async () => {
      const queue = new JobQueue();
      let cleaned = false;

      queue.registerHandler(JOB_TYPES.MAINTENANCE_CLEANUP, async (data) => {
        cleaned = true;
        return { task: data.task, deleted: 0 };
      });

      await queue.enqueue(
        JOB_TYPES.MAINTENANCE_CLEANUP,
        { task: "stale_otp" },
        { deferExecution: true }
      );

      const res = await queue.processNextSync();
      expect(cleaned).toBe(true);
      expect(res.result.task).toBe("stale_otp");
      await queue.shutdown(100);
    });
  });
});
