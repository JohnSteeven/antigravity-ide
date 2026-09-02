/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  HealthMonitor.js  —  System Health & Telemetry Monitor
 *  MyJourney CMS  |  Phase -1: CMS Core
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Aggregates status checks across database, cache, storage, queue, and mail.
 *  Exposes status as Green/Yellow/Red for the CMS Admin Health Dashboard.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose     = require('mongoose');
const cache        = require('../cache/cacheManager');
const StorageFactory = require('../storage/StorageFactory');
const config       = require('../config/configRegistry');

class HealthMonitor {
  /**
   * Run full system health diagnostic
   */
  static async getSystemHealth() {
    const startTime = Date.now();

    const [dbCheck, cacheCheck, storageCheck, emailCheck] = await Promise.all([
      HealthMonitor.checkMongo(),
      HealthMonitor.checkCache(),
      HealthMonitor.checkStorage(),
      HealthMonitor.checkEmail(),
    ]);

    const checks = {
      mongodb:  dbCheck,
      cache:    cacheCheck,
      storage:  storageCheck,
      email:    emailCheck,
    };

    // Determine aggregate system status
    const statuses = Object.values(checks).map(c => c.status);
    let overallStatus = 'green';
    if (statuses.includes('red')) {
      overallStatus = 'red';
    } else if (statuses.includes('yellow')) {
      overallStatus = 'yellow';
    }

    return {
      status: overallStatus,
      uptimeSeconds: process.uptime(),
      timestamp: new Date().toISOString(),
      responseTimeMs: Date.now() - startTime,
      memory: {
        rssMB: (process.memoryUsage().rss / 1024 / 1024).toFixed(1),
        heapUsedMB: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1),
      },
      checks,
    };
  }

  static async checkMongo() {
    try {
      const state = mongoose.connection.readyState;
      const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
      const isOk = state === 1;

      return {
        status: isOk ? 'green' : 'red',
        connection: stateMap[state] || 'unknown',
        dbName: mongoose.connection.name || 'n/a',
      };
    } catch (err) {
      return { status: 'red', error: err.message };
    }
  }

  static async checkCache() {
    try {
      return await cache.health();
    } catch (err) {
      return { status: 'yellow', driver: config.get('cache.driver', 'memory'), error: err.message };
    }
  }

  static async checkStorage() {
    try {
      const storage = StorageFactory.instance;
      return await storage.health();
    } catch (err) {
      return { status: 'red', error: err.message };
    }
  }

  static async checkEmail() {
    const host = config.get('smtp.host');
    if (!host) {
      return { status: 'yellow', configured: false, message: 'SMTP host not configured (Email disabled)' };
    }
    return { status: 'green', configured: true, host };
  }
}

module.exports = HealthMonitor;
