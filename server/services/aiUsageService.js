/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  aiUsageService.js  —  AI Analytics & Usage Aggregation
 *  MyJourney CMS  |  Stage 3 — Phase 20A: AI Infrastructure
 * ─────────────────────────────────────────────────────────────────────────────
 */

const AIUsageLog = require('../models/AIUsageLog');
const AIProvider = require('../models/AIProvider');

class AIUsageService {
  /**
   * Get aggregated analytics for the AI Analytics dashboard.
   * @param {number} days  - Number of days to look back (default: 30)
   */
  static async getAnalytics(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [totals, byProvider, byAction, byDay, topTemplates, recentErrors] = await Promise.all([
      // Total stats
      AIUsageLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            successRequests: { $sum: { $cond: ['$success', 1, 0] } },
            totalTokens: { $sum: '$totalTokens' },
            totalCostUsd: { $sum: '$estimatedCostUsd' },
            avgLatencyMs: { $avg: '$latencyMs' },
            acceptedCount: { $sum: { $cond: [{ $eq: ['$outputAccepted', true] }, 1, 0] } },
            trackedCount: { $sum: { $cond: [{ $ne: ['$outputAccepted', null] }, 1, 0] } },
          },
        },
      ]),

      // By provider
      AIUsageLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: '$provider',
            requests: { $sum: 1 },
            tokens: { $sum: '$totalTokens' },
            costUsd: { $sum: '$estimatedCostUsd' },
          },
        },
        { $sort: { requests: -1 } },
      ]),

      // By action
      AIUsageLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
            avgTokens: { $avg: '$totalTokens' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Daily request volume (last N days)
      AIUsageLog.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            requests: { $sum: 1 },
            tokens: { $sum: '$totalTokens' },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Top prompt templates
      AIUsageLog.aggregate([
        { $match: { createdAt: { $gte: since }, templateKey: { $ne: null } } },
        { $group: { _id: '$templateKey', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),

      // Recent errors
      AIUsageLog.find({ success: false, createdAt: { $gte: since } })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('provider action errorMessage createdAt')
        .lean(),
    ]);

    const t = totals[0] || {};
    const acceptanceRate =
      t.trackedCount > 0 ? Math.round((t.acceptedCount / t.trackedCount) * 100) : null;

    return {
      period: { days, since },
      totals: {
        requests: t.totalRequests || 0,
        successRate: t.totalRequests
          ? Math.round((t.successRequests / t.totalRequests) * 100)
          : 100,
        tokens: t.totalTokens || 0,
        estimatedCostUsd: Math.round((t.totalCostUsd || 0) * 10000) / 10000,
        avgLatencyMs: Math.round(t.avgLatencyMs || 0),
        acceptanceRate,
      },
      byProvider,
      byAction,
      dailyVolume: byDay,
      topTemplates,
      recentErrors,
    };
  }

  /**
   * Mark a usage log entry as accepted or discarded.
   */
  static async markAcceptance(logId, accepted) {
    return AIUsageLog.findByIdAndUpdate(logId, { outputAccepted: accepted }, { new: true });
  }

  /**
   * Reset daily token counters for all providers (call via cron at midnight).
   */
  static async resetDailyCounters() {
    await AIProvider.updateMany({}, { $set: { dailyTokensUsed: 0, lastResetDaily: new Date() } });
    console.info('[AIUsageService] Daily token counters reset.');
  }

  /**
   * Reset monthly token counters (call via cron on 1st of month).
   */
  static async resetMonthlyCounters() {
    await AIProvider.updateMany({}, { $set: { monthlyTokensUsed: 0, lastResetMonthly: new Date() } });
    console.info('[AIUsageService] Monthly token counters reset.');
  }
}

module.exports = AIUsageService;
