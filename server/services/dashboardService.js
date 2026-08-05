/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  dashboardService.js  —  Enterprise Dashboard & Widget Service
 *  MyJourney CMS  |  Stage 2 — Phase 16: Dashboard & Widget Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const WidgetDefinition = require('../models/WidgetDefinition');
const DashboardLayout = require('../models/DashboardLayout');

const DEFAULT_WIDGETS = [
  {
    widgetId: 'quick_actions',
    name: 'Quick Action Shortcuts',
    category: 'System',
    icon: 'Zap',
    defaultSize: 'full',
    description: '1-Click shortcuts for creating articles, uploading media, and creating pages.',
  },
  {
    widgetId: 'workflow_inbox',
    name: 'Editorial Workflow Inbox',
    category: 'Workflow',
    icon: 'Inbox',
    defaultSize: 'medium',
    description: 'Displays articles and pages awaiting review or approval.',
  },
  {
    widgetId: 'publishing_calendar',
    name: 'Publishing Calendar Timeline',
    category: 'Automation',
    icon: 'Calendar',
    defaultSize: 'medium',
    description: 'Displays scheduled publication jobs and content releases.',
  },
  {
    widgetId: 'recent_leads',
    name: 'Customer Leads & Submissions',
    category: 'Marketing',
    icon: 'Users',
    defaultSize: 'medium',
    description: 'Displays incoming customer form leads and pipeline status.',
  },
  {
    widgetId: 'storage_usage',
    name: 'Media DAM & Storage Usage',
    category: 'Media',
    icon: 'HardDrive',
    defaultSize: 'small',
    description: 'Tracks total media assets, folder count, and storage space.',
  },
  {
    widgetId: 'plugin_health',
    name: 'Plugin Platform Health',
    category: 'Plugins',
    icon: 'Box',
    defaultSize: 'small',
    description: 'Diagnostic status of active extension plugins.',
  },
];

class DashboardService {
  /**
   * Seed default widget definitions & default role layout if empty
   */
  static async seedDefaults(userId = null) {
    try {
      const count = await WidgetDefinition.countDocuments();
      if (count === 0) {
        console.info('[DashboardService] Seeding default widget definitions...');
        await WidgetDefinition.insertMany(DEFAULT_WIDGETS);
        console.info(`[DashboardService] Seeded ${DEFAULT_WIDGETS.length} default widgets.`);
      }

      const layoutCount = await DashboardLayout.countDocuments({ isDefault: true });
      if (layoutCount === 0) {
        console.info('[DashboardService] Seeding default administrator layout...');
        const defaultLayout = new DashboardLayout({
          userId: null,
          role: 'Administrator',
          name: 'Administrator Workspace',
          isDefault: true,
          widgets: DEFAULT_WIDGETS.map((w, idx) => ({
            widgetId: w.widgetId,
            size: w.defaultSize,
            order: idx + 1,
            isCollapsed: false,
          })),
        });
        await defaultLayout.save();
        console.info('[DashboardService] Seeded default administrator layout.');
      }
    } catch (err) {
      console.error('[DashboardService] Seed error:', err.message);
    }
  }

  /**
   * Get user dashboard layout (falls back to role default)
   */
  static async getUserDashboard(userId, userRole = 'Administrator') {
    await DashboardService.seedDefaults();

    let layout = null;
    if (userId) {
      layout = await DashboardLayout.findOne({ userId }).lean();
    }

    if (!layout) {
      layout = await DashboardLayout.findOne({ isDefault: true, role: userRole }).lean();
    }

    if (!layout) {
      layout = await DashboardLayout.findOne({ isDefault: true }).lean();
    }

    return layout;
  }

  /**
   * Save or update user personalized dashboard layout
   */
  static async saveUserDashboard(userId, widgetsData) {
    let layout = await DashboardLayout.findOne({ userId });

    if (!layout) {
      layout = new DashboardLayout({
        userId,
        name: 'Personalized Workspace',
        isDefault: false,
        widgets: widgetsData,
      });
    } else {
      layout.widgets = widgetsData;
    }

    await layout.save();
    return layout;
  }
}

module.exports = DashboardService;
