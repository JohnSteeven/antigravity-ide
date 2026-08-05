/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  versionControlController.js  —  Version Control API Controller
 *  MyJourney CMS  |  Stage 2 — Phase 12: Version Control & Rollback Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

const VersionSnapshot = require('../models/VersionSnapshot');
const VersionControlService = require('../services/versionControlService');
const AuditLogger = require('../audit/AuditLogger');

exports.getTimeline = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const timeline = await VersionControlService.getTimeline(entityType, entityId);
    res.json({ success: true, data: timeline });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch timeline', message: err.message });
  }
};

exports.getVersionById = async (req, res) => {
  try {
    const snapshot = await VersionSnapshot.findById(req.params.id).populate('createdBy', 'name email avatar');
    if (!snapshot) return res.status(404).json({ error: 'Not Found', message: 'Version snapshot not found' });
    res.json({ success: true, data: snapshot });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch version snapshot', message: err.message });
  }
};

exports.compareVersions = async (req, res) => {
  try {
    const { fromId, toId } = req.query;
    const fromSnapshot = await VersionSnapshot.findById(fromId);
    const toSnapshot = await VersionSnapshot.findById(toId);

    if (!fromSnapshot || !toSnapshot) {
      return res.status(404).json({ error: 'Not Found', message: 'Snapshots for comparison not found.' });
    }

    const diff = VersionControlService.computeDiff(fromSnapshot, toSnapshot);
    res.json({ success: true, data: diff });
  } catch (err) {
    res.status(500).json({ error: 'Comparison failed', message: err.message });
  }
};

exports.restoreVersion = async (req, res) => {
  try {
    const { entityType, entityId, versionNumber } = req.body;
    const restored = await VersionControlService.restoreVersion({
      entityType,
      entityId,
      versionNumber,
      user: req.user,
    });

    await AuditLogger.log({
      entity: 'version_control',
      entityId,
      action: 'restore',
      userId: req.user?.id,
      after: restored,
      req,
      details: `Safety restored ${entityType} #${entityId} to version v${versionNumber}`,
    });

    res.json({ success: true, data: restored, message: `Restored version v${versionNumber} successfully as new version v${restored.versionNumber}.` });
  } catch (err) {
    res.status(500).json({ error: 'Rollback restore failed', message: err.message });
  }
};

exports.tagVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const { tag, notes } = req.body;

    const snapshot = await VersionSnapshot.findById(id);
    if (!snapshot) return res.status(404).json({ error: 'Not Found', message: 'Version snapshot not found' });

    if (tag && !snapshot.tags.includes(tag)) {
      snapshot.tags.push(tag);
    }
    if (notes !== undefined) snapshot.notes = notes;

    await snapshot.save();
    res.json({ success: true, data: snapshot });
  } catch (err) {
    res.status(500).json({ error: 'Tagging failed', message: err.message });
  }
};
