/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  navigationService.js  —  Navigation Engine Service
 *  MyJourney CMS  |  Phase 4: Navigation Builder
 * ─────────────────────────────────────────────────────────────────────────────
 */

const NavigationZone = require('../models/NavigationZone');
const NavigationItem = require('../models/NavigationItem');
const FeatureFlagService = require('./featureFlagService');
const Category = require('../models/Category');

const DEFAULT_ZONES = [
  { key: 'primary-header', name: 'Primary Header', description: 'Top main navigation bar', isBuiltIn: true },
  { key: 'secondary-header', name: 'Secondary Header', description: 'Top bar quick links', isBuiltIn: true },
  { key: 'footer', name: 'Footer Main', description: 'Bottom website footer links', isBuiltIn: true },
  { key: 'footer-columns', name: 'Footer Columns', description: 'Multi-column footer directory', isBuiltIn: true },
  { key: 'sidebar', name: 'Public Sidebar', description: 'Article sidebar navigation', isBuiltIn: true },
  { key: 'cms-sidebar', name: 'CMS Sidebar', description: 'Admin control panel sidebar', isBuiltIn: true },
  { key: 'profile-menu', name: 'Profile Dropdown', description: 'User account dropdown menu', isBuiltIn: true },
  { key: 'mobile-drawer', name: 'Mobile Drawer', description: 'Mobile responsive side drawer', isBuiltIn: true },
  { key: 'mega-menu', name: 'Mega Menu', description: 'Full-width rich mega dropdown', isBuiltIn: true },
];

const DEFAULT_PRIMARY_ITEMS = [
  { title: 'Home', zoneKey: 'primary-header', type: 'internal', internalRoute: '/', sortOrder: 1, icon: 'Home' },
  { title: 'Stories', zoneKey: 'primary-header', type: 'internal', internalRoute: '/articles', sortOrder: 2, icon: 'BookOpen' },
  { title: 'Categories', zoneKey: 'primary-header', type: 'auto_categories', sortOrder: 3, icon: 'Grid' },
  { title: 'About', zoneKey: 'primary-header', type: 'internal', internalRoute: '/about', sortOrder: 4, icon: 'User' },
  { title: 'Contact', zoneKey: 'primary-header', type: 'internal', internalRoute: '/contact', sortOrder: 5, icon: 'Mail' },
];

class NavigationService {
  /**
   * Seed default zones & items if database is empty
   */
  static async seedDefaults(userId = null) {
    try {
      const zoneCount = await NavigationZone.countDocuments();
      if (zoneCount === 0) {
        console.info('[NavigationService] Seeding default navigation zones...');
        await NavigationZone.insertMany(DEFAULT_ZONES.map((z) => ({ ...z, createdBy: userId })));
        console.info(`[NavigationService] Seeded ${DEFAULT_ZONES.length} zones.`);
      }

      const itemCount = await NavigationItem.countDocuments();
      if (itemCount === 0) {
        console.info('[NavigationService] Seeding primary header menu items...');
        await NavigationItem.insertMany(DEFAULT_PRIMARY_ITEMS.map((i) => ({ ...i, createdBy: userId })));
        console.info(`[NavigationService] Seeded primary header items.`);
      }
    } catch (err) {
      console.error('[NavigationService] Seed error:', err.message);
    }
  }

  /**
   * Get evaluated navigation item tree for a zone
   */
  static async getNavTree(zoneKey, context = {}) {
    await NavigationService.seedDefaults();

    const rawItems = await NavigationItem.find({
      zoneKey: zoneKey.toLowerCase(),
      status: 'published',
    })
      .sort({ sortOrder: 1 })
      .lean();

    // 1. Evaluate Feature Flags & Role restrictions
    const userRole = context.userRole || 'public';
    const validItems = [];

    for (const item of rawItems) {
      // Check feature flag if set
      if (item.featureFlag) {
        const flagEval = await FeatureFlagService.evaluate(item.featureFlag, context);
        if (!flagEval.allowed) continue;
      }

      // Check role restriction if set
      if (item.roles?.length > 0 && !item.roles.includes(userRole)) {
        continue;
      }

      validItems.push(item);
    }

    // 2. Auto-expand 'auto_categories' items if present
    const finalItems = [];
    for (const item of validItems) {
      if (item.type === 'auto_categories') {
        const categories = await Category.find({
          isDeleted: false,
          isActive: true,
          status: 'published',
          visibility: 'public',
          showInNavigation: true,
        }).select('name slug').lean();
        const catChildren = categories.map((c, idx) => ({
          _id: `auto_cat_${c._id}`,
          title: c.name,
          type: 'internal',
          internalRoute: `/category/${c.slug}`,
          sortOrder: idx,
        }));
        finalItems.push({ ...item, children: catChildren });
      } else {
        finalItems.push(item);
      }
    }

    // 3. Build nested parent-child tree
    return NavigationService._buildTree(finalItems);
  }

  /**
   * Build hierarchical parent-child tree
   */
  static _buildTree(items = []) {
    const map = {};
    const roots = [];

    items.forEach((item) => {
      map[item._id] = { ...item, children: item.children || [] };
    });

    items.forEach((item) => {
      if (item.parent && map[item.parent]) {
        map[item.parent].children.push(map[item._id]);
      } else {
        roots.push(map[item._id]);
      }
    });

    return roots;
  }

  /**
   * Track item click count for popularity analytics
   */
  static async recordClick(itemId) {
    await NavigationItem.findByIdAndUpdate(itemId, { $inc: { clicks: 1 } });
  }

  /**
   * Generate automatic breadcrumb trail for path
   */
  static async getBreadcrumb(pathStr = '/') {
    const parts = (pathStr || '/').split('/').filter(Boolean);
    const trail = [{ title: 'Home', url: '/' }];

    let currentAcc = '';
    for (const p of parts) {
      currentAcc += `/${p}`;
      const title = p.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      trail.push({ title, url: currentAcc });
    }

    return trail;
  }

  /**
   * Health Scanner: Validate navigation items for dead links or deleted pages
   */
  static async validateLinks() {
    const items = await NavigationItem.find({ status: 'published' }).lean();
    const results = [];

    for (const item of items) {
      let isHealthy = true;
      let issue = null;

      if (item.type === 'internal' && !item.internalRoute) {
        isHealthy = false;
        issue = 'Missing internal route path.';
      } else if (item.type === 'external' && !item.externalUrl) {
        isHealthy = false;
        issue = 'Missing external URL.';
      }

      results.push({
        id: item._id,
        title: item.title,
        zoneKey: item.zoneKey,
        url: item.internalRoute || item.externalUrl,
        isHealthy,
        issue,
      });
    }

    return { total: items.length, healthy: results.filter((r) => r.isHealthy).length, issues: results.filter((r) => !r.isHealthy) };
  }
}

module.exports = NavigationService;
