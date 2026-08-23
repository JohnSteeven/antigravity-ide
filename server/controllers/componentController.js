/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  componentController.js  —  Component Manifest API Controller
 *  MyJourney CMS  |  Phase 8: Component Library & Block Marketplace
 * ─────────────────────────────────────────────────────────────────────────────
 */

const ComponentManifest = require('../models/ComponentManifest');
const ComponentManifestService = require('../services/componentManifestService');
const AuditLogger = require('../audit/AuditLogger');

exports.getComponents = async (req, res) => {
  try {
    const { category, search, status } = req.query;
    const query = {};
    if (category && category !== 'All') query.category = category;
    if (status) query.status = status;
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ name: regex }, { key: regex }, { description: regex }];
    }

    const components = await ComponentManifestService.getManifests(query);
    res.json({ success: true, data: components });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch components', message: err.message });
  }
};

exports.getComponentById = async (req, res) => {
  try {
    const component = await ComponentManifest.findById(req.params.id);
    if (!component) return res.status(404).json({ error: 'Not Found', message: 'Component manifest not found' });
    res.json({ success: true, data: component });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch component', message: err.message });
  }
};

exports.createComponent = async (req, res) => {
  try {
    const { key, name, category, icon, description, schema, defaultProps, supportedRegions } = req.body;
    const cleanKey = key.toLowerCase().trim();

    const existing = await ComponentManifest.findOne({ key: cleanKey });
    if (existing) {
      return res.status(400).json({ error: 'Duplicate Key', message: `Component key '${cleanKey}' already exists.` });
    }

    const component = new ComponentManifest({
      key: cleanKey,
      name,
      category: category || 'Content',
      icon: icon || 'Box',
      description: description || '',
      propSchema: schema || { props: [] },
      defaultProps: defaultProps || {},
      supportedRegions: supportedRegions || ['mainContent'],
      isBuiltIn: false,
      createdBy: req.user?.id,
    });

    await component.save();
    res.status(201).json({ success: true, data: component });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create component manifest', message: err.message });
  }
};

exports.updateComponent = async (req, res) => {
  try {
    const component = await ComponentManifest.findById(req.params.id);
    if (!component) return res.status(404).json({ error: 'Not Found', message: 'Component manifest not found' });

    const oldDoc = component.toObject();
    const { name, category, icon, description, schema, defaultProps, status, featureFlag } = req.body;

    if (name !== undefined) component.name = name;
    if (category !== undefined) component.category = category;
    if (icon !== undefined) component.icon = icon;
    if (description !== undefined) component.description = description;
    if (schema !== undefined) component.propSchema = schema;
    if (defaultProps !== undefined) component.defaultProps = defaultProps;
    if (status !== undefined) component.status = status;
    if (featureFlag !== undefined) component.featureFlag = featureFlag;

    component.version = (component.version || 1) + 1;
    component.updatedBy = req.user?.id;

    await component.save();

    await AuditLogger.log({
      entity: 'component_manifest',
      entityId: component._id,
      action: 'update',
      userId: req.user?.id,
      before: oldDoc,
      after: component,
      req,
      details: `Updated component manifest '${component.key}' to version v${component.version}`,
    });

    res.json({ success: true, data: component });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update component', message: err.message });
  }
};

exports.deleteComponent = async (req, res) => {
  try {
    const component = await ComponentManifest.findById(req.params.id);
    if (!component) return res.status(404).json({ error: 'Not Found', message: 'Component manifest not found' });
    if (component.isBuiltIn) {
      return res.status(400).json({ error: 'Built-in Protected', message: 'Built-in core block components cannot be deleted.' });
    }

    await ComponentManifest.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: `Component '${component.key}' deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete component', message: err.message });
  }
};
