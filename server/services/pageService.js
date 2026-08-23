/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  pageService.js  —  Page Engine Service Layer
 *  MyJourney CMS  |  Phase 5: Website Builder (Page Engine)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Page = require('../models/Page');
const Layout = require('../models/Layout');
const FeatureFlagService = require('./featureFlagService');

const DEFAULT_SYSTEM_PAGES = [
  {
    title: 'Home',
    slug: 'home',
    layoutKey: 'hero',
    isSystem: true,
    status: 'published',
    seo: { metaTitle: 'Home — MyJourney', metaDescription: 'Welcome to MyJourney blog and portfolio platform.' },
    blocks: [
      { id: 'b_hero1', type: 'hero', region: 'hero', order: 1, props: { title: 'Welcome to MyJourney', subtitle: 'Explore insights on technology, coding, and life', buttonText: 'Read Articles', buttonLink: '/articles' } },
      { id: 'b_feat1', type: 'featured_articles', region: 'mainContent', order: 2, props: { title: 'Featured Stories', count: 3 } },
      { id: 'b_quote1', type: 'quote', region: 'mainContent', order: 3, props: { quote: 'Simplicity is prerequisite for reliability.', author: 'Edsger W. Dijkstra' } },
    ],
  },
  {
    title: 'About',
    slug: 'about',
    layoutKey: 'minimal',
    isSystem: true,
    status: 'published',
    seo: { metaTitle: 'About — MyJourney', metaDescription: 'Learn more about MyJourney and its author.' },
    blocks: [
      { id: 'b_rich1', type: 'rich_text', region: 'mainContent', order: 1, props: { title: 'About MyJourney', body: 'MyJourney is a modern enterprise CMS platform built for performance and simplicity.' } },
    ],
  },
  {
    title: 'Contact',
    slug: 'contact',
    layoutKey: 'split',
    isSystem: true,
    status: 'published',
    seo: { metaTitle: 'Contact Us — MyJourney', metaDescription: 'Get in touch with us.' },
    blocks: [
      { id: 'b_cta1', type: 'cta', region: 'mainContent', order: 1, props: { title: 'Get In Touch', subtitle: 'Have a question or proposal? Send us a message.', buttonText: 'Send Email' } },
    ],
  },
  {
    title: 'Privacy Policy',
    slug: 'privacy',
    layoutKey: 'minimal',
    isSystem: true,
    status: 'published',
    seo: { metaTitle: 'Privacy Policy — MyJourney' },
    blocks: [
      { id: 'b_privacy1', type: 'rich_text', region: 'mainContent', order: 1, props: { title: 'Privacy Policy', body: 'Your privacy is important to us. We do not collect or sell personal data.' } },
    ],
  },
  {
    title: 'Terms of Service',
    slug: 'terms',
    layoutKey: 'minimal',
    isSystem: true,
    status: 'published',
    seo: { metaTitle: 'Terms of Service — MyJourney' },
    blocks: [
      { id: 'b_terms1', type: 'rich_text', region: 'mainContent', order: 1, props: { title: 'Terms of Service', body: 'By accessing MyJourney you agree to our terms of use.' } },
    ],
  },
];

class PageService {
  /**
   * Seed default system pages if empty
   */
  static async seedDefaults(userId = null) {
    try {
      const count = await Page.countDocuments();
      if (count === 0) {
        console.info('[PageService] Seeding default system pages...');
        const docs = DEFAULT_SYSTEM_PAGES.map((p) => ({
          ...p,
          createdBy: userId,
        }));
        await Page.insertMany(docs);
        console.info(`[PageService] Seeded ${docs.length} system pages.`);
      }
    } catch (err) {
      console.error('[PageService] Seed error:', err.message);
    }
  }

  /**
   * Resolve public page by slug (evaluates feature flags, dates, roles, and blocks)
   */
  static async getBySlug(slug, context = {}) {
    await PageService.seedDefaults();

    const page = await Page.findOne({
      slug: slug.toLowerCase(),
      status: 'published',
    }).lean();

    if (!page) return null;

    const now = new Date();
    // 1. Date scheduling check
    if (page.publishDate && now < new Date(page.publishDate)) return null;
    if (page.expireDate && now > new Date(page.expireDate)) return null;

    // 2. Feature flag check
    if (page.featureFlag) {
      const evalResult = await FeatureFlagService.evaluate(page.featureFlag, context);
      if (!evalResult.allowed) return null;
    }

    // 3. Role restriction check
    const userRole = context.userRole || 'public';
    if (page.permissions?.roles?.length > 0 && !page.permissions.roles.includes(userRole)) {
      return null;
    }

    // 4. Evaluate blocks feature flags & roles
    const validBlocks = [];
    for (const block of page.blocks || []) {
      if (!block.visibility) continue;
      if (block.featureFlag) {
        const flagEval = await FeatureFlagService.evaluate(block.featureFlag, context);
        if (!flagEval.allowed) continue;
      }
      if (block.roles?.length > 0 && !block.roles.includes(userRole)) continue;
      validBlocks.push(block);
    }

    // Increment page views count asynchronously
    Page.findByIdAndUpdate(page._id, { $inc: { views: 1 } }).catch(() => {});

    // Retrieve associated layout document
    const layout = (await Layout.findOne({ key: page.layoutKey, status: 'published' }).lean()) || null;

    const {
      history: _history,
      createdBy: _createdBy,
      updatedBy: _updatedBy,
      __v: _pageVersionKey,
      ...publicPage
    } = page;
    let publicLayout = null;
    if (layout) {
      const {
        createdBy: _layoutCreatedBy,
        updatedBy: _layoutUpdatedBy,
        __v: _layoutVersionKey,
        ...safeLayout
      } = layout;
      publicLayout = safeLayout;
    }

    return {
      ...publicPage,
      blocks: validBlocks,
      layout: publicLayout,
    };
  }

  /**
   * Duplicate page configuration
   */
  static async duplicate(pageId, userId = null) {
    const page = await Page.findById(pageId);
    if (!page) throw new Error('Page not found.');

    const copyDoc = page.toObject();
    delete copyDoc._id;
    delete copyDoc.createdAt;
    delete copyDoc.updatedAt;

    copyDoc.title = `${page.title} (Copy)`;
    copyDoc.slug = `${page.slug}-copy-${Date.now().toString().slice(-4)}`;
    copyDoc.isSystem = false;
    copyDoc.status = 'draft';
    copyDoc.version = 1;
    copyDoc.views = 0;
    copyDoc.createdBy = userId;

    const newPage = new Page(copyDoc);
    await newPage.save();
    return newPage;
  }
}

module.exports = PageService;
