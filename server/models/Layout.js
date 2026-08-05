/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Layout.js  —  Enterprise Configuration-Driven Layout Model
 *  MyJourney CMS  |  Phase 3: Layout Manager (Layout Engine)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Layouts are data-driven JSON documents rather than hardcoded JSX files.
 *  Defines regions (header, hero, leftSidebar, mainContent, rightSidebar, footer),
 *  CSS variable tokens, component restrictions, responsive column rules, and versions.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const RegionSchema = new mongoose.Schema(
  {
    visible: { type: Boolean, default: true },
    allowedComponents: { type: [String], default: [] },
    width: { type: String, default: 'auto' }, // e.g. '300px', '25%', '1fr'
    order: { type: Number, default: 1 },
    sticky: { type: Boolean, default: false },
    spacing: { type: String, default: 'var(--space-5, 20px)' },
    background: { type: String, default: 'transparent' },
    animation: { type: String, default: 'none' },
  },
  { _id: false }
);

const LayoutSchema = new mongoose.Schema(
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
    category: {
      type: String,
      enum: ['Editorial', 'Business', 'Portfolio', 'Education', 'Documentation', 'Magazine', 'Timeline', 'Marketing', 'Personal', 'Gallery'],
      default: 'Editorial',
      index: true,
    },
    previewImage: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: 'Grid',
    },
    layoutType: {
      type: String,
      enum: ['grid', 'flex', 'split', 'sidebar-left', 'sidebar-right', 'full-width', 'masonry', 'timeline'],
      default: 'grid',
    },
    regions: {
      header: { type: RegionSchema, default: () => ({ visible: true }) },
      hero: { type: RegionSchema, default: () => ({ visible: true }) },
      leftSidebar: { type: RegionSchema, default: () => ({ visible: false, width: '280px' }) },
      mainContent: { type: RegionSchema, default: () => ({ visible: true, width: '1fr' }) },
      rightSidebar: { type: RegionSchema, default: () => ({ visible: false, width: '300px' }) },
      bottomSection: { type: RegionSchema, default: () => ({ visible: true }) },
      footer: { type: RegionSchema, default: () => ({ visible: true }) },
    },
    responsive: {
      desktop: { type: String, default: '2-column' },
      tablet: { type: String, default: 'split' },
      mobile: { type: String, default: '1-column' },
    },
    cssVariables: {
      heroHeight: { type: String, default: '420px' },
      sidebarWidth: { type: String, default: '300px' },
      gap: { type: String, default: '24px' },
      containerWidth: { type: String, default: '1200px' },
      columns: { type: Number, default: 3 },
      cardRadius: { type: String, default: '12px' },
      shadow: { type: String, default: 'var(--shadow-md)' },
    },
    allowedComponents: {
      type: [String], // Allowed block types in this layout
      default: [],
    },
    isBuiltIn: {
      type: Boolean,
      default: false,
    },
    isTemplate: {
      type: Boolean,
      default: false,
    },
    version: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
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

module.exports = mongoose.model('Layout', LayoutSchema);
