/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Theme.js  —  Enterprise Design System Theme Model
 *  MyJourney CMS  |  Phase 6: Theme Builder (Design System Engine)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Stores complete design token configurations: color palettes, typography,
 *  spacing scales, radii, shadows, component tokens, custom CSS, and versioning.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const ThemeSchema = new mongoose.Schema(
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
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
    },
    mode: {
      type: String,
      enum: ['light', 'dark', 'system', 'high-contrast', 'sepia'],
      default: 'light',
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
    isBuiltIn: {
      type: Boolean,
      default: false,
    },
    tokens: {
      colors: {
        primary: { type: String, default: '#426c67' },
        secondary: { type: String, default: '#4d6478' },
        accent: { type: String, default: '#426c67' },
        gold: { type: String, default: '#b58b5f' },
        success: { type: String, default: '#2e7d5a' },
        warning: { type: String, default: '#b58b5f' },
        danger: { type: String, default: '#9d3e32' },
        info: { type: String, default: '#4d6478' },
        surface: { type: String, default: '#ffffff' },
        panel: { type: String, default: '#fdfbf7' },
        background: { type: String, default: '#f5f0eb' },
        text: { type: String, default: '#2f3133' },
        muted: { type: String, default: '#666d6d' },
        border: { type: String, default: '#e4ded4' },
      },
      typography: {
        headingFont: { type: String, default: 'Outfit, sans-serif' },
        bodyFont: { type: String, default: 'Plus Jakarta Sans, sans-serif' },
        codeFont: { type: String, default: 'Fira Code, monospace' },
        baseSize: { type: String, default: '16px' },
        lineHeight: { type: String, default: '1.6' },
      },
      spacing: {
        xs: { type: String, default: '4px' },
        sm: { type: String, default: '8px' },
        md: { type: String, default: '16px' },
        lg: { type: String, default: '24px' },
        xl: { type: String, default: '40px' },
      },
      radii: {
        small: { type: String, default: '6px' },
        medium: { type: String, default: '10px' },
        large: { type: String, default: '16px' },
        pill: { type: String, default: '100px' },
      },
      shadows: {
        sm: { type: String, default: '0 1px 4px rgba(0,0,0,0.05)' },
        md: { type: String, default: '0 4px 16px rgba(0,0,0,0.08)' },
        lg: { type: String, default: '0 8px 30px rgba(0,0,0,0.12)' },
      },
    },
    customCSS: {
      type: String,
      default: '',
    },
    customJS: {
      type: String,
      default: '',
    },
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

module.exports = mongoose.model('Theme', ThemeSchema);
