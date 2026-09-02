/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  DashboardLayout.js  —  Personalized Dashboard Layout Model
 *  MyJourney CMS  |  Stage 2 — Phase 16: Dashboard & Widget Platform
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Stores user-specific or role-default dashboard widget layouts, sizing,
 *  reordering, and collapsed states.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const WidgetInstanceSchema = new mongoose.Schema(
  {
    widgetId: { type: String, required: true },
    size: { type: String, enum: ['small', 'medium', 'large', 'full'], default: 'medium' },
    order: { type: Number, default: 0 },
    isCollapsed: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const DashboardLayoutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    role: {
      type: String,
      default: 'Administrator',
    },
    name: {
      type: String,
      default: 'My Personalized Workspace',
    },
    widgets: [WidgetInstanceSchema],
    isDefault: {
      type: Boolean,
      default: false,
    },
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

module.exports = mongoose.model('DashboardLayout', DashboardLayoutSchema);
