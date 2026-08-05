/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  automationController.js  —  Automation & Scheduler API Controller
 *  MyJourney CMS  |  Stage 2 — Phase 13: Content Scheduler & Automation Engine
 * ─────────────────────────────────────────────────────────────────────────────
 */

const AutomationJob = require('../models/AutomationJob');
const AutomationExecution = require('../models/AutomationExecution');
const AutomationService = require('../services/automationService');
const AuditLogger = require('../audit/AuditLogger');

exports.getJobs = async (req, res) => {
  try {
    const { status, action, entityType } = req.query;
    const query = {};
    if (status) query.status = status;
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;

    const jobs = await AutomationJob.find(query).sort({ scheduledAt: 1 }).lean();
    res.json({ success: true, data: jobs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch jobs', message: err.message });
  }
};

exports.getJobById = async (req, res) => {
  try {
    const job = await AutomationJob.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Not Found', message: 'Job not found' });
    const executions = await AutomationExecution.find({ jobId: req.params.id }).sort({ startedAt: -1 }).lean();
    res.json({ success: true, data: { job, executions } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch job', message: err.message });
  }
};

exports.createJob = async (req, res) => {
  try {
    const { entityType, entityId, action, scheduledAt, recurrence, payload } = req.body;
    const job = await AutomationService.createJob({
      entityType,
      entityId,
      action,
      scheduledAt,
      recurrence,
      payload,
      user: req.user,
    });

    await AuditLogger.log({
      entity: 'automation_job',
      entityId: job._id,
      action: 'create',
      userId: req.user?.id,
      after: job,
      req,
      details: `Scheduled ${action} for ${entityType} #${entityId} at ${scheduledAt}`,
    });

    res.status(201).json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ error: 'Failed to schedule job', message: err.message });
  }
};

exports.retryJob = async (req, res) => {
  try {
    const job = await AutomationService.retryJob(req.params.id);
    res.json({ success: true, data: job, message: 'Manual retry queued successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Retry failed', message: err.message });
  }
};

exports.cancelJob = async (req, res) => {
  try {
    const job = await AutomationService.cancelJob(req.params.id);
    res.json({ success: true, data: job, message: 'Job cancelled successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Cancel failed', message: err.message });
  }
};

exports.runDueJobs = async (req, res) => {
  try {
    const results = await AutomationService.processDueJobs();
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ error: 'Processing error', message: err.message });
  }
};
