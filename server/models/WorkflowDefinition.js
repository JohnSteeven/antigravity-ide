/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  WorkflowDefinition.js  —  Enterprise Workflow Definition Model
 *  MyJourney CMS  |  Stage 2 — Phase 11: Enterprise Editorial Workflow
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Configurable workflow pipeline model defining states (Draft, In Review,
 *  Changes Requested, Approved, Scheduled, Published, Archived) and state
 *  transition rules per user role.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const TransitionRuleSchema = new mongoose.Schema(
  {
    fromState: { type: String, required: true },
    toState: { type: String, required: true },
    allowedRoles: { type: [String], default: ['Administrator', 'Editor'] },
    requiresComment: { type: Boolean, default: false },
    requiresMinApprovals: { type: Number, default: 1 },
  },
  { _id: false }
);

const WorkflowDefinitionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    isDefault: {
      type: Boolean,
      default: true,
    },
    states: {
      type: [String],
      default: ['Draft', 'In Review', 'Changes Requested', 'Approved', 'Scheduled', 'Published', 'Archived'],
    },
    transitions: [TransitionRuleSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('WorkflowDefinition', WorkflowDefinitionSchema);
