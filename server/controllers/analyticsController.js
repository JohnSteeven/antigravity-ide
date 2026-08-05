/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  analyticsController.js  —  Content Analytics API Controller
 *  MyJourney CMS  |  Stage 2 — Phase 18: Content Intelligence & Reader Analytics
 * ─────────────────────────────────────────────────────────────────────────────
 */

const AnalyticsService = require('../services/analyticsService');

exports.trackEvent = async (req, res) => {
  try {
    const { eventType, contentId, contentType, durationSec, scrollPercent, referrer, meta } = req.body;
    await AnalyticsService.recordEvent({
      eventType,
      contentId,
      contentType,
      durationSec,
      scrollPercent,
      referrer,
      meta,
      req,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Tracking error', message: err.message });
  }
};

exports.getOverview = async (req, res) => {
  try {
    const stats = await AnalyticsService.getOverviewStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch overview analytics', message: err.message });
  }
};
