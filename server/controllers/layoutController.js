/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  layoutController.js  —  Layout Engine API Controller
 *  MyJourney CMS  |  Phase 3: Layout Manager
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Layout = require('../models/Layout');
const LayoutService = require('../services/layoutService');
const AuditLogger = require('../audit/AuditLogger');

exports.getLayouts = async (req, res) => {
  try {
    const { category, search, status, isTemplate } = req.query;
    const layouts = await LayoutService.queryLayouts({ category, search, status, isTemplate });
    res.json({ success: true, data: layouts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch layouts', message: err.message });
  }
};

exports.getLayoutById = async (req, res) => {
  try {
    const layout = await Layout.findById(req.params.id);
    if (!layout) return res.status(404).json({ error: 'Not Found', message: 'Layout configuration not found' });
    res.json({ success: true, data: layout });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch layout', message: err.message });
  }
};

exports.createLayout = async (req, res) => {
  try {
    const { key, name, description, category, layoutType, regions, cssVariables, allowedComponents } = req.body;

    const existing = await Layout.findOne({ key: key.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'Duplicate Key', message: `Layout key '${key}' already exists.` });
    }

    const layout = new Layout({
      key: key.toLowerCase(),
      name,
      description,
      category: category || 'Editorial',
      layoutType: layoutType || 'grid',
      regions: regions || {},
      cssVariables: cssVariables || {},
      allowedComponents: allowedComponents || [],
      createdBy: req.user?.id,
    });

    await layout.save();

    await AuditLogger.log({
      entity: 'layout',
      entityId: layout._id,
      action: 'create',
      userId: req.user?.id,
      after: layout,
      req,
      details: `Created layout '${layout.name}'`,
    });

    res.status(201).json({ success: true, data: layout });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create layout', message: err.message });
  }
};

exports.updateLayout = async (req, res) => {
  try {
    const layout = await Layout.findById(req.params.id);
    if (!layout) return res.status(404).json({ error: 'Not Found', message: 'Layout not found' });

    const oldDoc = layout.toObject();
    const { name, description, category, layoutType, regions, responsive, cssVariables, allowedComponents, status } = req.body;

    if (name !== undefined) layout.name = name;
    if (description !== undefined) layout.description = description;
    if (category !== undefined) layout.category = category;
    if (layoutType !== undefined) layout.layoutType = layoutType;
    if (regions !== undefined) layout.regions = regions;
    if (responsive !== undefined) layout.responsive = responsive;
    if (cssVariables !== undefined) layout.cssVariables = cssVariables;
    if (allowedComponents !== undefined) layout.allowedComponents = allowedComponents;
    if (status !== undefined) layout.status = status;

    layout.version = (layout.version || 1) + 1;
    layout.updatedBy = req.user?.id;

    await layout.save();

    await AuditLogger.log({
      entity: 'layout',
      entityId: layout._id,
      action: 'update',
      userId: req.user?.id,
      before: oldDoc,
      after: layout,
      req,
      details: `Updated layout '${layout.name}' to version ${layout.version}`,
    });

    res.json({ success: true, data: layout });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update layout', message: err.message });
  }
};

exports.deleteLayout = async (req, res) => {
  try {
    const layout = await Layout.findById(req.params.id);
    if (!layout) return res.status(404).json({ error: 'Not Found', message: 'Layout not found' });
    if (layout.isBuiltIn) {
      return res.status(403).json({ error: 'Protected', message: 'Built-in system layouts cannot be deleted.' });
    }

    await Layout.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: `Layout '${layout.name}' deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete layout', message: err.message });
  }
};

exports.duplicateLayout = async (req, res) => {
  try {
    const duplicated = await LayoutService.duplicate(req.params.id, req.user?.id);
    res.status(201).json({ success: true, data: duplicated });
  } catch (err) {
    res.status(500).json({ error: 'Duplication failed', message: err.message });
  }
};

exports.publishLayout = async (req, res) => {
  try {
    const layout = await Layout.findById(req.params.id);
    if (!layout) return res.status(404).json({ error: 'Not Found', message: 'Layout not found' });
    layout.status = 'published';
    await layout.save();
    res.json({ success: true, data: layout, message: `Layout '${layout.name}' published.` });
  } catch (err) {
    res.status(500).json({ error: 'Publish failed', message: err.message });
  }
};

exports.archiveLayout = async (req, res) => {
  try {
    const layout = await Layout.findById(req.params.id);
    if (!layout) return res.status(404).json({ error: 'Not Found', message: 'Layout not found' });
    layout.status = 'archived';
    await layout.save();
    res.json({ success: true, data: layout, message: `Layout '${layout.name}' archived.` });
  } catch (err) {
    res.status(500).json({ error: 'Archive failed', message: err.message });
  }
};
