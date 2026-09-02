/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  dashboardController.js  —  Dashboard & Widget API Controller
 *  MyJourney CMS  |  Stage 2 — Phase 16: Dashboard & Widget Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const WidgetDefinition = require('../models/WidgetDefinition');
const DashboardLayout = require('../models/DashboardLayout');
const DashboardService = require('../services/dashboardService');
const AuditLogger = require('../audit/AuditLogger');

exports.getLayout = async (req, res) => {
  try {
    const userRole = req.user?.role?.name || req.user?.role || 'Administrator';
    const layout = await DashboardService.getUserDashboard(req.user?.id, userRole);
    res.json({ success: true, data: layout });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard layout', message: err.message });
  }
};

exports.saveLayout = async (req, res) => {
  try {
    const { widgets } = req.body;
    const layout = await DashboardService.saveUserDashboard(req.user?.id, widgets);

    await AuditLogger.log({
      entity: 'dashboard_layout',
      entityId: layout._id,
      action: 'update',
      userId: req.user?.id,
      after: layout,
      req,
      details: 'Updated personalized dashboard layout configuration.',
    });

    res.json({ success: true, data: layout });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save dashboard layout', message: err.message });
  }
};

exports.getWidgets = async (req, res) => {
  try {
    await DashboardService.seedDefaults(req.user?.id);
    const widgets = await WidgetDefinition.find().sort({ category: 1, name: 1 }).lean();
    res.json({ success: true, data: widgets });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch widget registry', message: err.message });
  }
};

exports.resetLayout = async (req, res) => {
  try {
    if (req.user?.id) {
      await DashboardLayout.deleteOne({ userId: req.user.id });
    }
    const userRole = req.user?.role?.name || req.user?.role || 'Administrator';
    const defaultLayout = await DashboardService.getUserDashboard(null, userRole);
    res.json({ success: true, data: defaultLayout, message: 'Reset dashboard to role default.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset layout', message: err.message });
  }
};
