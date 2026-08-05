/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  DesignToken.js  —  Enterprise Design Token Model
 *  MyJourney CMS  |  Phase 7: Design Token Management System
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Single source of truth for visual tokens across colors, typography, spacing,
 *  radii, shadows, animations, z-index layers, and breakpoints.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const UsedInSchema = new mongoose.Schema(
  {
    component: { type: String, required: true },
    field: { type: String, default: '' },
  },
  { _id: false }
);

const DesignTokenSchema = new mongoose.Schema(
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
    value: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['color', 'typography', 'spacing', 'sizing', 'radius', 'border', 'shadow', 'animation', 'opacity', 'breakpoint', 'zindex'],
      default: 'color',
      index: true,
    },
    category: {
      type: String,
      default: 'Colors',
    },
    group: {
      type: String,
      enum: ['Core', 'Semantic', 'Component', 'Layout', 'Motion', 'Brand'],
      default: 'Core',
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    isCore: {
      type: Boolean,
      default: false,
    },
    isEditable: {
      type: Boolean,
      default: true,
    },
    theme: {
      type: String,
      default: 'all',
    },
    usedIn: [UsedInSchema],
    version: {
      type: Number,
      default: 1,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DesignToken', DesignTokenSchema);
