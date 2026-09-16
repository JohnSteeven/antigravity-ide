/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  pageService.js  —  Page Engine Service Layer
 *  MyJourney CMS  |  Phase 5: Website Builder (Page Engine)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Page = require('../models/Page');
const Layout = require('../models/Layout');
const FeatureFlagService = require('./featureFlagService');
const crypto = require('crypto');

// Fingerprints identify only the exact former generated legal placeholders.
// Keep existing rows editable in Admin; never present them as approved policy.
const LEGACY_LEGAL_BODY_HASHES = Object.freeze({
  privacy: 'df2697cca664a0f28b8c5a7582c0f5bf96c44559682a3b5416eb4dbbb12386d2',
  terms: 'daffb2744053656ba7acae87c94281ad8075b2978a78c9c2ca2f419507685287',
});

class PageService {
  static isLegacyLegalPlaceholder(page) {
    const expectedHash = LEGACY_LEGAL_BODY_HASHES[page?.slug];
    if (!page?.isSystem || !expectedHash || page.blocks?.length !== 1) return false;
    const body = page.blocks[0]?.props?.body;
    return typeof body === 'string' && crypto.createHash('sha256').update(body).digest('hex') === expectedHash;
  }

  /**
   * Resolve public page by slug (evaluates feature flags, dates, roles, and blocks)
   */
  static async getBySlug(slug, context = {}) {
    const page = await Page.findOne({
      slug: String(slug || '').toLowerCase(),
      status: 'published',
      visibility: 'public',
    }).lean();

    // Private/member/password delivery has no authorization flow in this
    // public endpoint. Admin editing remains available through the ID route.
    if (!page || page.status !== 'published' || page.visibility !== 'public') return null;
    if (PageService.isLegacyLegalPlaceholder(page)) return null;

    const now = new Date();
    // 1. Date scheduling check
    if (page.publishDate && (!Number.isFinite(new Date(page.publishDate).getTime()) || now < new Date(page.publishDate))) return null;
    if (page.expireDate && (!Number.isFinite(new Date(page.expireDate).getTime()) || now >= new Date(page.expireDate))) return null;

    // 2. Feature flag check
    if (page.featureFlag) {
      const evalResult = await FeatureFlagService.evaluate(page.featureFlag, { ...context, requireRegistered: true });
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
        const flagEval = await FeatureFlagService.evaluate(block.featureFlag, { ...context, requireRegistered: true });
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
      permissions: _permissions,
      settings: _settings,
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
