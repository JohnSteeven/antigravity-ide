/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  navigationController.js  —  Navigation Engine API Controller
 *  MyJourney CMS  |  Phase 4: Navigation Builder
 * ─────────────────────────────────────────────────────────────────────────────
 */

const NavigationZone = require('../models/NavigationZone');
const NavigationItem = require('../models/NavigationItem');
const NavigationService = require('../services/navigationService');
const AuditLogger = require('../audit/AuditLogger');

// ── Item Handlers ────────────────────────────────────────────────────────────

exports.getNavTree = async (req, res) => {
  try {
    const zoneKey = req.query.zone || req.params.zone || 'primary-header';
    const userRole = req.user?.role?.name || req.user?.role || 'public';
    const tree = await NavigationService.getNavTree(zoneKey, { userRole, userId: req.user?.id });
    res.json({ success: true, data: tree });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch navigation tree', message: err.message });
  }
};

exports.getItemById = async (req, res) => {
  try {
    const item = await NavigationItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not Found', message: 'Navigation item not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch navigation item', message: err.message });
  }
};

exports.createItem = async (req, res) => {
  try {
    const { title, zoneKey, parent, type, internalRoute, externalUrl, target, icon, badge, description, featureFlag, roles, sortOrder } = req.body;

    const item = new NavigationItem({
      title,
      zoneKey: zoneKey || 'primary-header',
      parent: parent || null,
      type: type || 'internal',
      internalRoute: internalRoute || '/',
      externalUrl: externalUrl || '',
      target: target || '_self',
      icon: icon || '',
      badge: badge || { text: '', color: '#2e7d5a' },
      description: description || '',
      featureFlag: featureFlag || null,
      roles: roles || [],
      sortOrder: sortOrder ?? 0,
      createdBy: req.user?.id,
    });

    await item.save();

    await AuditLogger.log({
      entity: 'navigation_item',
      entityId: item._id,
      action: 'create',
      userId: req.user?.id,
      after: item,
      req,
      details: `Created nav item '${item.title}' in zone '${item.zoneKey}'`,
    });

    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create navigation item', message: err.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const item = await NavigationItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not Found', message: 'Navigation item not found' });

    const oldDoc = item.toObject();
    const { title, type, internalRoute, externalUrl, target, icon, badge, description, featureFlag, roles, sortOrder, status, parent } = req.body;

    if (title !== undefined) item.title = title;
    if (type !== undefined) item.type = type;
    if (internalRoute !== undefined) item.internalRoute = internalRoute;
    if (externalUrl !== undefined) item.externalUrl = externalUrl;
    if (target !== undefined) item.target = target;
    if (icon !== undefined) item.icon = icon;
    if (badge !== undefined) item.badge = badge;
    if (description !== undefined) item.description = description;
    if (featureFlag !== undefined) item.featureFlag = featureFlag;
    if (roles !== undefined) item.roles = roles;
    if (sortOrder !== undefined) item.sortOrder = sortOrder;
    if (status !== undefined) item.status = status;
    if (parent !== undefined) item.parent = parent;

    item.version = (item.version || 1) + 1;
    item.updatedBy = req.user?.id;

    await item.save();

    await AuditLogger.log({
      entity: 'navigation_item',
      entityId: item._id,
      action: 'update',
      userId: req.user?.id,
      before: oldDoc,
      after: item,
      req,
      details: `Updated nav item '${item.title}'`,
    });

    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update navigation item', message: err.message });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const item = await NavigationItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not Found', message: 'Navigation item not found' });
    // Remove child references
    await NavigationItem.deleteMany({ parent: req.params.id });

    res.json({ success: true, message: `Navigation item '${item.title}' deleted.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete navigation item', message: err.message });
  }
};

exports.recordClick = async (req, res) => {
  try {
    await NavigationService.recordClick(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Click track error', message: err.message });
  }
};

exports.getBreadcrumb = async (req, res) => {
  try {
    const pathStr = req.query.path || '/';
    const trail = await NavigationService.getBreadcrumb(pathStr);
    res.json({ success: true, data: trail });
  } catch (err) {
    res.status(500).json({ error: 'Breadcrumb error', message: err.message });
  }
};

exports.validateLinks = async (req, res) => {
  try {
    const report = await NavigationService.validateLinks();
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ error: 'Validation error', message: err.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const popularItems = await NavigationItem.find({ clicks: { $gt: 0 } })
      .sort({ clicks: -1 })
      .limit(10)
      .lean();
    res.json({ success: true, data: popularItems });
  } catch (err) {
    res.status(500).json({ error: 'Analytics error', message: err.message });
  }
};

// ── Zone Handlers ────────────────────────────────────────────────────────────

exports.getZones = async (req, res) => {
  try {
    await NavigationService.seedDefaults(req.user?.id);
    const zones = await NavigationZone.find().sort({ name: 1 }).lean();
    res.json({ success: true, data: zones });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch zones', message: err.message });
  }
};

exports.createZone = async (req, res) => {
  try {
    const { key, name, description, responsiveMode } = req.body;
    const existing = await NavigationZone.findOne({ key: key.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'Duplicate Key', message: `Zone '${key}' already exists.` });
    }

    const zone = new NavigationZone({
      key: key.toLowerCase(),
      name,
      description: description || '',
      responsiveMode: responsiveMode || {},
      createdBy: req.user?.id,
    });

    await zone.save();
    res.status(201).json({ success: true, data: zone });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create zone', message: err.message });
  }
};
