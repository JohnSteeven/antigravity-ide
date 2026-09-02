/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  workflowController.js  —  Workflow API Controller
 *  MyJourney CMS  |  Stage 2 — Phase 11: Enterprise Editorial Workflow
 * ─────────────────────────────────────────────────────────────────────────────
 */

const WorkflowDefinition = require('../models/WorkflowDefinition');
const WorkflowHistory = require('../models/WorkflowHistory');
const EditorialComment = require('../models/EditorialComment');
const WorkflowService = require('../services/workflowService');
const AuditLogger = require('../audit/AuditLogger');

exports.getDefinitions = async (req, res) => {
  try {
    await WorkflowService.seedDefaults(req.user?.id);
    const definitions = await WorkflowDefinition.find().lean();
    res.json({ success: true, data: definitions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch workflow definitions', message: err.message });
  }
};

exports.transitionState = async (req, res) => {
  try {
    const { contentId, contentType, toState, notes, reason } = req.body;
    const result = await WorkflowService.transitionState({
      contentId,
      contentType,
      toState,
      notes,
      reason,
      user: req.user,
    });

    await AuditLogger.log({
      entity: 'workflow',
      entityId: contentId,
      action: 'transition',
      userId: req.user?.id,
      after: result,
      req,
      details: `Workflow transition ${result.fromState} -> ${result.toState}`,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: 'Transition failed', message: err.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const history = await WorkflowHistory.find({ contentType, contentId })
      .sort({ timestamp: -1 })
      .populate('user', 'name email avatar')
      .lean();
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history', message: err.message });
  }
};

exports.getMyTasks = async (req, res) => {
  try {
    const userRole = req.user?.role?.name || req.user?.role || 'Editor';
    const tasks = await WorkflowService.getMyTasks(userRole);
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch my tasks', message: err.message });
  }
};

exports.getCalendar = async (req, res) => {
  try {
    const calendar = await WorkflowService.getCalendar();
    res.json({ success: true, data: calendar });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch calendar', message: err.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const analytics = await WorkflowService.getAnalytics();
    res.json({ success: true, data: analytics });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics', message: err.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const comments = await EditorialComment.find({ contentType, contentId })
      .sort({ createdAt: -1 })
      .populate('user', 'name email avatar')
      .lean();
    res.json({ success: true, data: comments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch comments', message: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { contentId, contentType, comment } = req.body;
    const doc = new EditorialComment({
      contentId,
      contentType,
      comment,
      user: req.user?.id,
    });
    await doc.save();
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment', message: err.message });
  }
};
