/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  observabilityService.js  —  System Metrics & Prometheus Exporter
 *  MyJourney Platform  |  Stage 6 — Phase 29: Cloud Infrastructure & Observability
 * ─────────────────────────────────────────────────────────────────────────────
 */

const os = require('os');
const mongoose = require('mongoose');
const cacheProviderService = require('./cacheProviderService');

class ObservabilityService {
  /**
   * Get current system metrics snapshot.
   */
  static getSystemMetrics() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memoryUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);
    const cpuLoad = os.loadavg();

    return {
      uptimeSeconds: process.uptime(),
      memory: {
        totalMb: (totalMem / 1024 / 1024).toFixed(0),
        usedMb: (usedMem / 1024 / 1024).toFixed(0),
        usagePercent: memoryUsagePercent,
      },
      cpu: {
        loadAvg1m: cpuLoad[0].toFixed(2),
        loadAvg5m: cpuLoad[1].toFixed(2),
        cores: os.cpus().length,
      },
      database: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        name: mongoose.connection.name || 'myjourney',
      },
      cache: cacheProviderService.getMetrics(),
    };
  }

  /**
   * Export metrics in standard Prometheus text format.
   */
  static getPrometheusMetrics() {
    const metrics = ObservabilityService.getSystemMetrics();
    return `# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${metrics.uptimeSeconds}

# HELP memory_usage_percent System memory usage percentage
# TYPE memory_usage_percent gauge
memory_usage_percent ${metrics.memory.usagePercent}

# HELP cpu_load_1m 1-minute CPU load average
# TYPE cpu_load_1m gauge
cpu_load_1m ${metrics.cpu.loadAvg1m}

# HELP cache_hit_rate_percent Cache hit rate percentage
# TYPE cache_hit_rate_percent gauge
cache_hit_rate_percent ${metrics.cache.hitRatePercent}
`;
  }
}

module.exports = ObservabilityService;
