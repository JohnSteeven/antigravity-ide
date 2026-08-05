/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  contentModelingController.js  —  Headless Content Modeling API Controller
 *  MyJourney CMS  |  Phase 9: Enterprise Content Modeling Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

const ContentType = require('../models/ContentType');
const ContentEntry = require('../models/ContentEntry');
const ContentModelingService = require('../services/contentModelingService');
const AuditLogger = require('../audit/AuditLogger');

// ── Content Type Schema Handlers ─────────────────────────────────────────────

exports.getContentTypes = async (req, res) => {
  try {
    await ContentModelingService.seedDefaults(req.user?.id);
    const types = await ContentType.find().sort({ isBuiltIn: -1, name: 1 }).lean();
    res.json({ success: true, data: types });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch content types', message: err.message });
  }
};

exports.getContentTypeById = async (req, res) => {
  try {
    const contentType = await ContentType.findById(req.params.id);
    if (!contentType) return res.status(404).json({ error: 'Not Found', message: 'Content type not found' });
    res.json({ success: true, data: contentType });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch content type', message: err.message });
  }
};

exports.createContentType = async (req, res) => {
  try {
    const { key, name, singularName, description, icon, fields } = req.body;
    const cleanKey = key.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-');

    const existing = await ContentType.findOne({ key: cleanKey });
    if (existing) {
      return res.status(400).json({ error: 'Duplicate Key', message: `Content type key '${cleanKey}' already exists.` });
    }

    const contentType = new ContentType({
      key: cleanKey,
      name,
      singularName: singularName || name,
      description: description || '',
      icon: icon || 'Folder',
      fields: fields || [],
      isBuiltIn: false,
      createdBy: req.user?.id,
    });

    await contentType.save();
    res.status(201).json({ success: true, data: contentType });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create content type', message: err.message });
  }
};

exports.updateContentType = async (req, res) => {
  try {
    const contentType = await ContentType.findById(req.params.id);
    if (!contentType) return res.status(404).json({ error: 'Not Found', message: 'Content type not found' });

    const oldDoc = contentType.toObject();
    const { name, singularName, description, icon, fields, status } = req.body;

    if (name !== undefined) contentType.name = name;
    if (singularName !== undefined) contentType.singularName = singularName;
    if (description !== undefined) contentType.description = description;
    if (icon !== undefined) contentType.icon = icon;
    if (fields !== undefined) contentType.fields = fields;
    if (status !== undefined) contentType.status = status;

    contentType.updatedBy = req.user?.id;
    await contentType.save();

    await AuditLogger.log({
      entity: 'content_type',
      entityId: contentType._id,
      action: 'update',
      userId: req.user?.id,
      before: oldDoc,
      after: contentType,
      req,
      details: `Updated ContentType schema '${contentType.name}'`,
    });

    res.json({ success: true, data: contentType });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update content type', message: err.message });
  }
};

exports.deleteContentType = async (req, res) => {
  try {
    const contentType = await ContentType.findById(req.params.id);
    if (!contentType) return res.status(404).json({ error: 'Not Found', message: 'Content type not found' });
    if (contentType.isBuiltIn) {
      return res.status(400).json({ error: 'Built-in Protected', message: 'Core built-in content types cannot be deleted.' });
    }

    await ContentType.findByIdAndDelete(req.params.id);
    await ContentEntry.deleteMany({ contentTypeKey: contentType.key });
    res.json({ success: true, message: `Content type '${contentType.name}' deleted.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete content type', message: err.message });
  }
};

// ── Headless Content Entry Handlers ──────────────────────────────────────────

exports.getEntries = async (req, res) => {
  try {
    const { typeKey } = req.params;
    const entries = await ContentModelingService.getEntries(typeKey);
    res.json({ success: true, data: entries });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch entries', message: err.message });
  }
};

exports.createEntry = async (req, res) => {
  try {
    const { typeKey } = req.params;
    const { title, slug, data } = req.body;

    const cleanSlug = (slug || title).toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    const existing = await ContentEntry.findOne({ contentTypeKey: typeKey.toLowerCase(), slug: cleanSlug });
    if (existing) {
      return res.status(400).json({ error: 'Duplicate Slug', message: `Entry slug '${cleanSlug}' already exists for '${typeKey}'.` });
    }

    const entry = new ContentEntry({
      contentTypeKey: typeKey.toLowerCase(),
      title,
      slug: cleanSlug,
      data: data || {},
      createdBy: req.user?.id,
    });

    await entry.save();
    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create entry', message: err.message });
  }
};

exports.deleteEntry = async (req, res) => {
  try {
    const entry = await ContentEntry.findByIdAndDelete(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Not Found', message: 'Entry not found' });
    res.json({ success: true, message: `Entry '${entry.title}' deleted.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete entry', message: err.message });
  }
};
