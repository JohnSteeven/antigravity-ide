/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  formController.js  —  Dynamic Form & Lead API Controller
 *  MyJourney CMS  |  Stage 2 — Phase 14: Dynamic Form Builder & Lead Management
 * ─────────────────────────────────────────────────────────────────────────────
 */

const FormSchema = require('../models/FormSchema');
const FormSubmission = require('../models/FormSubmission');
const FormService = require('../services/formService');
const AuditLogger = require('../audit/AuditLogger');

exports.getForms = async (req, res) => {
  try {
    await FormService.seedDefaults(req.user?.id);
    const forms = await FormSchema.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: forms });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch forms', message: err.message });
  }
};

exports.getFormByKey = async (req, res) => {
  try {
    const form = await FormSchema.findOne({ key: req.params.key.toLowerCase() });
    if (!form) return res.status(404).json({ error: 'Not Found', message: 'Form schema not found' });
    res.json({ success: true, data: form });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch form', message: err.message });
  }
};

exports.createForm = async (req, res) => {
  try {
    const { key, title, description, category, fields, successMessage, isMultiStep } = req.body;
    const form = new FormSchema({
      key,
      title,
      description,
      category,
      fields,
      successMessage,
      isMultiStep,
      createdBy: req.user?.id,
    });

    await form.save();

    await AuditLogger.log({
      entity: 'form_schema',
      entityId: form._id,
      action: 'create',
      userId: req.user?.id,
      after: form,
      req,
      details: `Created form schema '${title}' (${key})`,
    });

    res.status(201).json({ success: true, data: form });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create form schema', message: err.message });
  }
};

exports.submitForm = async (req, res) => {
  try {
    const { formKey } = req.params;
    const result = await FormService.submitForm({
      formKey,
      data: req.body,
      req,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ error: 'Form submission failed', message: err.message });
  }
};

exports.getLeads = async (req, res) => {
  try {
    const { status, formKey } = req.query;
    const query = {};
    if (status) query.status = status;
    if (formKey) query.formKey = formKey;

    const leads = await FormSubmission.find(query)
      .sort({ createdAt: -1 })
      .populate('assignedTo', 'name email avatar')
      .lean();
    res.json({ success: true, data: leads });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch leads', message: err.message });
  }
};

exports.updateLeadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo, priority, notes } = req.body;

    const lead = await FormSubmission.findById(id);
    if (!lead) return res.status(404).json({ error: 'Not Found', message: 'Lead submission not found' });

    if (status) lead.status = status;
    if (assignedTo !== undefined) lead.assignedTo = assignedTo;
    if (priority) lead.priority = priority;
    if (notes !== undefined) lead.notes = notes;

    await lead.save();

    await AuditLogger.log({
      entity: 'lead_submission',
      entityId: lead._id,
      action: 'update',
      userId: req.user?.id,
      after: lead,
      req,
      details: `Updated lead status to '${lead.status}'`,
    });

    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update lead', message: err.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const analytics = await FormService.getAnalytics();
    res.json({ success: true, data: analytics });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics', message: err.message });
  }
};
