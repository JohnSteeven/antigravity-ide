/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  featureFlagController.js  —  Feature Flags CRUD & Management Controller
 *  MyJourney CMS  |  Phase 0: Feature Flags
 * ─────────────────────────────────────────────────────────────────────────────
 */

const FeatureFlag = require('../models/FeatureFlag');
const FeatureFlagService = require('../services/featureFlagService');
const AuditLogger = require('../audit/AuditLogger');

/**
 * GET /api/features
 * Retrieve all feature flags (or evaluated state for current user)
 */
exports.getAllFeatures = async (req, res) => {
  try {
    await FeatureFlagService.seedDefaults();
    const flags = await FeatureFlag.find().sort({ group: 1, key: 1 });

    const userRole = req.user?.role?.name || req.user?.role || 'public';
    const userId = req.user?.id || req.ip;

    // Attach evaluated status for caller
    const evaluatedFlags = await Promise.all(
      flags.map(async (flag) => {
        const doc = flag.toObject();
        const evalResult = await FeatureFlagService.evaluate(flag.key, { userRole, userId });
        doc.isAvailable = evalResult.allowed;
        doc.evalReason = evalResult.reason;
        return doc;
      })
    );

    res.json({ success: true, data: evaluatedFlags });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feature flags', message: err.message });
  }
};

/**
 * GET /api/features/:key
 * Retrieve single feature flag by key
 */
exports.getFeatureByKey = async (req, res) => {
  try {
    const key = req.params.key.toLowerCase();
    const flag = await FeatureFlag.findOne({ key });
    if (!flag) {
      return res.status(404).json({ error: 'Not Found', message: `Feature flag '${key}' not found` });
    }

    const dependents = await FeatureFlagService.checkDependents(key);
    res.json({ success: true, data: flag, dependents });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feature flag', message: err.message });
  }
};

/**
 * POST /api/features
 * Create a new feature flag
 */
exports.createFeature = async (req, res) => {
  try {
    const { key, name, description, group, status, allowedRoles, allowedEnvironments, percentageRollout, dependencies } = req.body;

    const existing = await FeatureFlag.findOne({ key: key.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: 'Duplicate Key', message: `Feature flag '${key}' already exists` });
    }

    const flag = new FeatureFlag({
      key: key.toLowerCase(),
      name,
      description,
      group: group || 'General',
      status: status || 'enabled',
      allowedRoles: allowedRoles || ['admin', 'editor'],
      allowedEnvironments: allowedEnvironments || ['development', 'staging', 'production'],
      percentageRollout: percentageRollout ?? 100,
      dependencies: dependencies || [],
      createdBy: req.user?.id,
      updatedBy: req.user?.id,
      audit: [
        {
          user: req.user?.id,
          userName: req.user?.name || 'Admin',
          oldStatus: 'none',
          newStatus: status || 'enabled',
          reason: 'Initial creation',
          environment: process.env.NODE_ENV || 'development',
        },
      ],
    });

    await flag.save();

    await AuditLogger.log({
      entity: 'feature_flag',
      entityId: flag._id,
      action: 'create',
      userId: req.user?.id,
      after: flag,
      req,
      details: `Created feature flag '${flag.key}' (${flag.status})`,
    });

    res.status(201).json({ success: true, data: flag });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create feature flag', message: err.message });
  }
};

/**
 * PATCH /api/features/:id
 * Update an existing feature flag
 */
exports.updateFeature = async (req, res) => {
  try {
    const flag = await FeatureFlag.findById(req.params.id);
    if (!flag) {
      return res.status(404).json({ error: 'Not Found', message: 'Feature flag not found' });
    }

    const oldDoc = flag.toObject();
    const oldStatus = flag.status;
    const { status, name, description, group, allowedRoles, allowedEnvironments, percentageRollout, dependencies, reason } = req.body;

    if (name !== undefined) flag.name = name;
    if (description !== undefined) flag.description = description;
    if (group !== undefined) flag.group = group;
    if (allowedRoles !== undefined) flag.allowedRoles = allowedRoles;
    if (allowedEnvironments !== undefined) flag.allowedEnvironments = allowedEnvironments;
    if (percentageRollout !== undefined) flag.percentageRollout = percentageRollout;
    if (dependencies !== undefined) flag.dependencies = dependencies;

    // Check dependent features if disabling
    let warnings = [];
    if (status && status === 'disabled' && oldStatus !== 'disabled') {
      const dependents = await FeatureFlagService.checkDependents(flag.key);
      if (dependents.length > 0) {
        warnings.push(`Warning: Disabling '${flag.name}' affects dependent features: ${dependents.map(d => d.name).join(', ')}`);
      }
      flag.status = status;
    } else if (status) {
      flag.status = status;
    }

    if (oldStatus !== flag.status || reason) {
      flag.audit.push({
        user: req.user?.id,
        userName: req.user?.name || 'Admin',
        oldStatus,
        newStatus: flag.status,
        reason: reason || 'Updated via CMS admin',
        environment: process.env.NODE_ENV || 'development',
      });
    }

    flag.updatedBy = req.user?.id;
    await flag.save();

    await AuditLogger.log({
      entity: 'feature_flag',
      entityId: flag._id,
      action: 'update',
      userId: req.user?.id,
      before: oldDoc,
      after: flag,
      req,
      details: `Updated feature flag '${flag.key}' from ${oldStatus} to ${flag.status}`,
    });

    res.json({ success: true, data: flag, warnings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update feature flag', message: err.message });
  }
};

/**
 * POST /api/features/:id/toggle
 * Toggle status between enabled and disabled
 */
exports.toggleFeature = async (req, res) => {
  try {
    const flag = await FeatureFlag.findById(req.params.id);
    if (!flag) {
      return res.status(404).json({ error: 'Not Found', message: 'Feature flag not found' });
    }

    const oldStatus = flag.status;
    const newStatus = oldStatus === 'enabled' ? 'disabled' : 'enabled';
    const { reason } = req.body;

    let warnings = [];
    if (newStatus === 'disabled') {
      const dependents = await FeatureFlagService.checkDependents(flag.key);
      if (dependents.length > 0) {
        warnings.push(`Warning: Disabling '${flag.name}' affects dependent features: ${dependents.map(d => d.name).join(', ')}`);
      }
    }

    flag.status = newStatus;
    flag.audit.push({
      user: req.user?.id,
      userName: req.user?.name || 'Admin',
      oldStatus,
      newStatus,
      reason: reason || `Toggled to ${newStatus}`,
      environment: process.env.NODE_ENV || 'development',
    });
    flag.updatedBy = req.user?.id;

    await flag.save();

    res.json({ success: true, data: flag, warnings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle feature flag', message: err.message });
  }
};

/**
 * POST /api/features/:id/rollout
 * Update percentage rollout
 */
exports.updateRollout = async (req, res) => {
  try {
    const { percentageRollout } = req.body;
    const flag = await FeatureFlag.findById(req.params.id);
    if (!flag) {
      return res.status(404).json({ error: 'Not Found', message: 'Feature flag not found' });
    }

    flag.percentageRollout = Math.min(100, Math.max(0, Number(percentageRollout)));
    flag.updatedBy = req.user?.id;
    await flag.save();

    res.json({ success: true, data: flag });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update rollout percentage', message: err.message });
  }
};

/**
 * DELETE /api/features/:id
 * Delete feature flag
 */
exports.deleteFeature = async (req, res) => {
  try {
    const flag = await FeatureFlag.findByIdAndDelete(req.params.id);
    if (!flag) {
      return res.status(404).json({ error: 'Not Found', message: 'Feature flag not found' });
    }

    res.json({ success: true, message: `Feature flag '${flag.key}' deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete feature flag', message: err.message });
  }
};
