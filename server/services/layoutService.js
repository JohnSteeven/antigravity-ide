/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  layoutService.js  —  Configuration-Driven Layout Engine Service
 *  MyJourney CMS  |  Phase 3: Layout Manager
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Layout = require('../models/Layout');

const DEFAULT_15_LAYOUTS = [
  {
    key: 'magazine',
    name: 'Magazine Editorial',
    description: 'Featured main hero story with 2-column sidebar feed',
    category: 'Magazine',
    layoutType: 'sidebar-right',
    isBuiltIn: true,
    cssVariables: { heroHeight: '480px', sidebarWidth: '320px', gap: '28px', columns: 2 },
    regions: {
      hero: { visible: true },
      mainContent: { visible: true, width: '2fr' },
      rightSidebar: { visible: true, width: '1fr', sticky: true },
    },
  },
  {
    key: 'cards',
    name: 'Standard Cards Grid',
    description: 'Balanced 3-column article card grid with hover effects',
    category: 'Editorial',
    layoutType: 'grid',
    isBuiltIn: true,
    cssVariables: { columns: 3, gap: '24px', cardRadius: '14px' },
  },
  {
    key: 'timeline',
    name: 'Storytelling Timeline',
    description: 'Chronological timeline feed with milestone markers',
    category: 'Timeline',
    layoutType: 'timeline',
    isBuiltIn: true,
    allowedComponents: ['timeline', 'quote', 'gallery', 'articles'],
  },
  {
    key: 'hero',
    name: 'Full Width Hero Showcase',
    description: 'Immersive full-screen background banner with CTA',
    category: 'Marketing',
    layoutType: 'full-width',
    isBuiltIn: true,
    cssVariables: { heroHeight: '600px', containerWidth: '100%' },
  },
  {
    key: 'minimal',
    name: 'Minimal Reader',
    description: 'Single-column medium-style reader focus without sidebars',
    category: 'Personal',
    layoutType: 'full-width',
    isBuiltIn: true,
    cssVariables: { containerWidth: '760px', gap: '20px' },
  },
  {
    key: 'split',
    name: 'Split Screen 50/50',
    description: 'Dual column half-and-half layout for landing features',
    category: 'Business',
    layoutType: 'split',
    isBuiltIn: true,
    cssVariables: { columns: 2, gap: '32px' },
  },
  {
    key: 'grid',
    name: 'Classic 4-Column Grid',
    description: 'Compact 4-column item grid for dense catalogs',
    category: 'Editorial',
    layoutType: 'grid',
    isBuiltIn: true,
    cssVariables: { columns: 4, gap: '16px' },
  },
  {
    key: 'masonry',
    name: 'Pinterest Masonry',
    description: 'Staggered height columns ideal for photo galleries',
    category: 'Gallery',
    layoutType: 'masonry',
    isBuiltIn: true,
    cssVariables: { columns: 3, gap: '20px' },
  },
  {
    key: 'carousel',
    name: 'Horizontal Carousel',
    description: 'Touch-scroll horizontal slider gallery',
    category: 'Gallery',
    layoutType: 'flex',
    isBuiltIn: true,
  },
  {
    key: 'portfolio',
    name: 'Project Portfolio Showcase',
    description: 'Filterable project grid with overlay stats',
    category: 'Portfolio',
    layoutType: 'grid',
    isBuiltIn: true,
    cssVariables: { columns: 3, gap: '24px', cardRadius: '16px' },
  },
  {
    key: 'documentation',
    name: 'Documentation Book',
    description: 'Left table-of-contents navigation with right page content',
    category: 'Documentation',
    layoutType: 'sidebar-left',
    isBuiltIn: true,
    cssVariables: { sidebarWidth: '260px', containerWidth: '1300px' },
    regions: {
      leftSidebar: { visible: true, width: '260px', sticky: true },
      mainContent: { visible: true, width: '1fr' },
    },
  },
  {
    key: 'knowledge-base',
    name: 'Knowledge Base Portal',
    description: 'Search banner with category cards and FAQ accordions',
    category: 'Education',
    layoutType: 'full-width',
    isBuiltIn: true,
  },
  {
    key: 'landing-page',
    name: 'SaaS Product Landing',
    description: 'High-converting multi-section landing page layout',
    category: 'Marketing',
    layoutType: 'full-width',
    isBuiltIn: true,
  },
  {
    key: 'gallery-lightbox',
    name: 'Full Photo Gallery',
    description: 'Grid of photos with full-screen lightbox preview',
    category: 'Gallery',
    layoutType: 'grid',
    isBuiltIn: true,
    cssVariables: { columns: 4, gap: '12px' },
  },
  {
    key: 'storytelling',
    name: 'Longform Narrative',
    description: 'Rich inline media storytelling layout with pull-quotes',
    category: 'Personal',
    layoutType: 'full-width',
    isBuiltIn: true,
    cssVariables: { containerWidth: '820px' },
  },
];

class LayoutService {
  /**
   * Seed default 15 layouts if empty
   */
  static async seedDefaults(userId = null) {
    try {
      const count = await Layout.countDocuments();
      if (count === 0) {
        console.info('[LayoutService] Seeding default 15 layouts...');
        const docs = DEFAULT_15_LAYOUTS.map((l) => ({
          ...l,
          status: 'published',
          createdBy: userId,
        }));
        await Layout.insertMany(docs);
        console.info(`[LayoutService] Seeded ${docs.length} layout configurations.`);
      }
    } catch (err) {
      console.error('[LayoutService] Seed error:', err.message);
    }
  }

  /**
   * Query layouts with category, search, and status filters
   */
  static async queryLayouts({ category, search, status, isTemplate }) {
    await LayoutService.seedDefaults();
    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }
    if (status) {
      query.status = status;
    }
    if (isTemplate !== undefined) {
      query.isTemplate = isTemplate === 'true';
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ name: regex }, { key: regex }, { description: regex }];
    }

    return await Layout.find(query).sort({ isBuiltIn: -1, name: 1 }).lean();
  }

  /**
   * Duplicate / clone an existing layout configuration
   */
  static async duplicate(id, userId = null) {
    const layout = await Layout.findById(id);
    if (!layout) throw new Error('Layout not found.');

    const copyDoc = layout.toObject();
    delete copyDoc._id;
    delete copyDoc.createdAt;
    delete copyDoc.updatedAt;

    copyDoc.key = `${layout.key}-copy-${Date.now().toString().slice(-4)}`;
    copyDoc.name = `${layout.name} (Copy)`;
    copyDoc.isBuiltIn = false;
    copyDoc.status = 'draft';
    copyDoc.version = 1;
    copyDoc.createdBy = userId;

    const newLayout = new Layout(copyDoc);
    await newLayout.save();
    return newLayout;
  }

  /**
   * Save layout configuration as a reusable template
   */
  static async saveAsTemplate(id, userId = null) {
    const layout = await Layout.findById(id);
    if (!layout) throw new Error('Layout not found.');

    layout.isTemplate = true;
    layout.updatedBy = userId;
    await layout.save();
    return layout;
  }
}

module.exports = LayoutService;
