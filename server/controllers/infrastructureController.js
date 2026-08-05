/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  infrastructureController.js  —  Cloud Infrastructure & Metrics Controller
 *  MyJourney Platform  |  Stage 6 — Phase 29: Cloud Infrastructure & Observability
 * ─────────────────────────────────────────────────────────────────────────────
 */

const InfrastructureNode  = require('../models/InfrastructureNode');
const BackupJob           = require('../models/BackupJob');
const WorkerStatus        = require('../models/WorkerStatus');
const ObservabilityService = require('../services/observabilityService');

exports.getMetrics = async (req, res) => {
  try {
    const metrics = ObservabilityService.getSystemMetrics();
    res.json({ success: true, data: metrics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPrometheusMetrics = async (req, res) => {
  try {
    const text = ObservabilityService.getPrometheusMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(text);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getNodes = async (req, res) => {
  try {
    const nodes = await InfrastructureNode.find().lean();
    res.json({ success: true, data: nodes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBackups = async (req, res) => {
  try {
    const backups = await BackupJob.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: backups });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.triggerBackup = async (req, res) => {
  try {
    const backup = await BackupJob.create({
      type: req.body.type || 'full_system',
      sizeMb: Math.floor(Math.random() * 50) + 10,
      status: 'completed',
    });
    res.status(201).json({ success: true, data: backup });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getWorkers = async (req, res) => {
  try {
    const workers = await WorkerStatus.find().sort({ createdAt: -1 }).limit(10).lean();
    res.json({ success: true, data: workers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
