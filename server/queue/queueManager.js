/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  queueManager.js  —  Background Job Queue Manager
 *  MyJourney CMS  |  Phase -1: CMS Core
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Abstract background task queue interface.
 *  Supports explicit in-memory background processing for a single process.
 *  Unimplemented provider names fail closed rather than pretending to enqueue.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const config = require('../config/configRegistry');

class MemoryQueue {
  constructor() {
    this.handlers = new Map();
    this.jobs = [];
  }

  process(name, handler) {
    this.handlers.set(name, handler);
  }

  async add(name, data = {}) {
    const job = { id: Date.now().toString(), name, data, createdAt: new Date() };
    this.jobs.push(job);

    // Process asynchronously in background
    setImmediate(async () => {
      const handler = this.handlers.get(name);
      if (handler) {
        try {
          await handler(job);
        } catch (err) {
          console.error(`[Queue] MemoryQueue job ${name} failed:`, err.message);
        }
      }
    });

    return job;
  }
}

let _queueInstance = null;

function getQueue() {
  if (!_queueInstance) {
    const driver = config.get('queue.driver', 'memory');
    if (driver !== 'memory') {
      const error = new Error('The configured durable queue adapter is unavailable.');
      error.status = 503;
      error.code = 'QUEUE_DRIVER_UNAVAILABLE';
      throw error;
    }
    console.info(`[Queue] Initializing background queue driver: ${driver}`);
    _queueInstance = new MemoryQueue();
  }
  return _queueInstance;
}

module.exports = {
  add: (name, data) => getQueue().add(name, data),
  process: (name, handler) => getQueue().process(name, handler),
  capability: () => ({
    driver: config.get('queue.driver', 'memory'),
    available: config.get('queue.driver', 'memory') === 'memory',
    durable: false,
    distributed: false,
  }),
};
