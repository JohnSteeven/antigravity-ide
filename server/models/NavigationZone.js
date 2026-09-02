/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  NavigationZone.js  —  Navigation Zone Model
 *  MyJourney CMS  |  Phase 4: Navigation Builder
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Supports unlimited customizable navigation zones across the application.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const NavigationZoneSchema = new mongoose.Schema(
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
    isBuiltIn: {
      type: Boolean,
      default: false,
    },
    responsiveMode: {
      desktop: { type: String, default: 'mega' },
      tablet: { type: String, default: 'dropdown' },
      mobile: { type: String, default: 'drawer' },
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

module.exports = mongoose.model('NavigationZone', NavigationZoneSchema);
