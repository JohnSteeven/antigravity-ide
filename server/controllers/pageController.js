/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  pageController.js  —  Page Engine API Controller
 *  MyJourney CMS  |  Phase 5: Website Builder (Page Engine)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Page = require('../models/Page');
const PageService = require('../services/pageService');
const AuditLogger = require('../audit/AuditLogger');

exports.getPages = async (req, res) => {
  try {
    await PageService.seedDefaults(req.user?.id);
    const { status, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ title: regex }, { slug: regex }];
    }

    const pages = await Page.find(query).sort({ isSystem: -1, title: 1 }).lean();
    res.json({ success: true, data: pages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pages', message: err.message });
  }
};

exports.getPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const userRole = req.user?.role?.name || req.user?.role || 'public';
    const page = await PageService.getBySlug(slug, { userRole, userId: req.user?.id });

    if (!page) {
      return res.status(404).json({ error: 'Not Found', message: `Page '/${slug}' not found or unavailable.` });
    }

    res.json({ success: true, data: page });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch page', message: err.message });
  }
};

exports.getPageById = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ error: 'Not Found', message: 'Page not found' });
    res.json({ success: true, data: page });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch page', message: err.message });
  }
};

exports.createPage = async (req, res) => {
  try {
    const { title, slug, layoutKey, seo, blocks, status, featureFlag } = req.body;

    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    const existing = await Page.findOne({ slug: cleanSlug });
    if (existing) {
      return res.status(400).json({ error: 'Duplicate Slug', message: `Page slug '/${cleanSlug}' already exists.` });
    }

    const page = new Page({
      title,
      slug: cleanSlug,
      layoutKey: layoutKey || 'magazine',
      seo: seo || {},
      blocks: blocks || [],
      status: status || 'draft',
      featureFlag: featureFlag || null,
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
    });

    await page.save();

    await AuditLogger.log({
      entity: 'page',
      entityId: page._id,
      action: 'create',
      userId: req.user?.id,
      after: page,
      req,
      details: `Created page '${page.title}' (/${page.slug})`,
    });

    res.status(201).json({ success: true, data: page });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create page', message: err.message });
  }
};

exports.updatePage = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ error: 'Not Found', message: 'Page not found' });

    const oldDoc = page.toObject();
    const { title, slug, layoutKey, seo, blocks, status, featureFlag, permissions, featuredImage } = req.body;

    if (title !== undefined) page.title = title;
    if (slug !== undefined) page.slug = slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    if (layoutKey !== undefined) page.layoutKey = layoutKey;
    if (seo !== undefined) page.seo = seo;
    if (blocks !== undefined) page.blocks = blocks;
    if (status !== undefined) page.status = status;
    if (featureFlag !== undefined) page.featureFlag = featureFlag;
    if (permissions !== undefined) page.permissions = permissions;
    if (featuredImage !== undefined) page.featuredImage = featuredImage;

    // Record History Snapshot
    page.history.push({
      version: page.version || 1,
      blocks: oldDoc.blocks || [],
      updatedBy: req.user?.id,
      timestamp: new Date(),
    });

    page.version = (page.version || 1) + 1;
    page.updatedBy = req.user?.id;

    await page.save();

    await AuditLogger.log({
      entity: 'page',
      entityId: page._id,
      action: 'update',
      userId: req.user?.id,
      before: oldDoc,
      after: page,
      req,
      details: `Updated page '${page.title}' to version v${page.version}`,
    });

    res.json({ success: true, data: page });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update page', message: err.message });
  }
};

exports.deletePage = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ error: 'Not Found', message: 'Page not found' });
    if (page.isSystem) {
      return res.status(403).json({ error: 'Protected Page', message: 'Core system pages (home, about, contact) cannot be deleted.' });
    }

    await Page.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: `Page '${page.title}' deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete page', message: err.message });
  }
};

exports.duplicatePage = async (req, res) => {
  try {
    const duplicated = await PageService.duplicate(req.params.id, req.user?.id);
    res.status(201).json({ success: true, data: duplicated });
  } catch (err) {
    res.status(500).json({ error: 'Duplication failed', message: err.message });
  }
};

exports.publishPage = async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ error: 'Not Found', message: 'Page not found' });
    page.status = 'published';
    await page.save();
    res.json({ success: true, data: page, message: `Page '${page.title}' published.` });
  } catch (err) {
    res.status(500).json({ error: 'Publish failed', message: err.message });
  }
};
