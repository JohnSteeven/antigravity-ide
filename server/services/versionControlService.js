/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  versionControlService.js  —  Unified Version Control Service
 *  MyJourney CMS  |  Stage 2 — Phase 12: Version Control & Rollback Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

const crypto = require('crypto');
const VersionSnapshot = require('../models/VersionSnapshot');
const VersionDiff = require('../models/VersionDiff');
const Article = require('../models/Article');
const Page = require('../models/Page');
const ContentEntry = require('../models/ContentEntry');
const Layout = require('../models/Layout');
const Theme = require('../models/Theme');
const NavigationItem = require('../models/NavigationItem');
const SystemSetting = require('../models/SystemSetting');
const DesignToken = require('../models/DesignToken');
const ComponentManifest = require('../models/ComponentManifest');

class VersionControlService {
  /**
   * Create an immutable version snapshot
   */
  static async createSnapshot({ entityType, entityId, title = '', data, user, tags = [], notes = '', isPublished = false, rollbackFrom = null }) {
    if (!entityId || !entityType || !data) {
      throw new Error('Invalid arguments for version snapshot creation.');
    }

    const cleanEntityType = entityType.toLowerCase();
    const serializedData = JSON.parse(JSON.stringify(data));
    const checksum = crypto.createHash('sha256').update(JSON.stringify(serializedData)).digest('hex');

    // Get latest version number
    const latest = await VersionSnapshot.findOne({ entityType: cleanEntityType, entityId })
      .sort({ versionNumber: -1 })
      .lean();

    const versionNumber = (latest?.versionNumber || 0) + 1;

    const snapshot = new VersionSnapshot({
      entityId,
      entityType: cleanEntityType,
      versionNumber,
      title: title || data.title || data.name || data.key || `${cleanEntityType} v${versionNumber}`,
      serializedData,
      checksum,
      createdBy: user?.id || user,
      tags,
      notes,
      isPublished,
      rollbackFrom,
    });

    await snapshot.save();
    return snapshot;
  }

  /**
   * Get version timeline for an entity
   */
  static async getTimeline(entityType, entityId) {
    return VersionSnapshot.find({ entityType: entityType.toLowerCase(), entityId })
      .sort({ versionNumber: -1 })
      .populate('createdBy', 'name email avatar')
      .lean();
  }

  /**
   * Compute Side-by-Side structural diff between two snapshots
   */
  static computeDiff(fromSnapshot, toSnapshot) {
    const fromData = fromSnapshot?.serializedData || {};
    const toData = toSnapshot?.serializedData || {};

    const fromKeys = Object.keys(fromData);
    const toKeys = Object.keys(toData);

    const addedFields = toKeys.filter((k) => !fromKeys.includes(k));
    const removedFields = fromKeys.filter((k) => !toKeys.includes(k));

    const changedFields = {};
    const commonKeys = toKeys.filter((k) => fromKeys.includes(k));

    commonKeys.forEach((key) => {
      const valA = JSON.stringify(fromData[key]);
      const valB = JSON.stringify(toData[key]);
      if (valA !== valB) {
        changedFields[key] = {
          before: fromData[key],
          after: toData[key],
        };
      }
    });

    const summary = `Added ${addedFields.length} fields, Removed ${removedFields.length} fields, Modified ${Object.keys(changedFields).length} fields.`;

    return {
      fromVersion: fromSnapshot?.versionNumber,
      toVersion: toSnapshot?.versionNumber,
      addedFields,
      removedFields,
      changedFields,
      summary,
    };
  }

  /**
   * Safety Rollback Engine: Restores entity to past version data by creating a NEW version snapshot
   */
  static async restoreVersion({ entityType, entityId, versionNumber, user }) {
    const cleanType = entityType.toLowerCase();
    const targetSnapshot = await VersionSnapshot.findOne({ entityType: cleanType, entityId, versionNumber }).lean();

    if (!targetSnapshot) {
      throw new Error(`Target snapshot (v${versionNumber}) not found.`);
    }

    const restoredData = targetSnapshot.serializedData;

    // 1. Update live entity in database
    let Model = null;
    if (cleanType === 'article') Model = Article;
    else if (cleanType === 'page') Model = Page;
    else if (cleanType === 'headless_entry') Model = ContentEntry;
    else if (cleanType === 'layout') Model = Layout;
    else if (cleanType === 'theme') Model = Theme;
    else if (cleanType === 'navigation') Model = NavigationItem;
    else if (cleanType === 'setting') Model = SystemSetting;
    else if (cleanType === 'design_token') Model = DesignToken;
    else if (cleanType === 'component_manifest') Model = ComponentManifest;

    if (Model) {
      await Model.findByIdAndUpdate(entityId, restoredData);
    }

    // 2. Create NEW version snapshot representing the rollback
    const newSnapshot = await VersionControlService.createSnapshot({
      entityType: cleanType,
      entityId,
      title: `${targetSnapshot.title} (Restored from v${versionNumber})`,
      data: restoredData,
      user,
      notes: `Rollback safety restore from version v${versionNumber}`,
      rollbackFrom: versionNumber,
    });

    return newSnapshot;
  }
}

module.exports = VersionControlService;
