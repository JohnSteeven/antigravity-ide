/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  FormSubmission.js  —  Lead Submission Model
 *  MyJourney CMS  |  Stage 2 — Phase 14: Dynamic Form Builder & Lead Management
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Stores customer form submissions and lead pipeline status (New, Contacted,
 *  Qualified, In Progress, Won, Lost, Closed).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const FormSubmissionSchema = new mongoose.Schema(
  {
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FormSchema',
      required: true,
      index: true,
    },
    formKey: {
      type: String,
      required: true,
      index: true,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['new', 'assigned', 'contacted', 'qualified', 'in_progress', 'won', 'lost', 'closed', 'archived'],
      default: 'new',
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    tags: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

FormSubmissionSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('FormSubmission', FormSubmissionSchema);
