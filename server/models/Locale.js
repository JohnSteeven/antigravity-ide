/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Locale.js  —  Supported Locale Language Model
 *  MyJourney CMS  |  Stage 2 — Phase 19: Localization & Translation Engine
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Single source of truth model storing active locales, native language names,
 *  RTL/LTR text direction, flags, and fallback rules.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const LocaleSchema = new mongoose.Schema(
  {
    code: {
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
    nativeName: {
      type: String,
      required: true,
    },
    direction: {
      type: String,
      enum: ['ltr', 'rtl'],
      default: 'ltr',
    },
    flag: {
      type: String,
      default: '🌐',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    fallbackLocale: {
      type: String,
      default: 'en',
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

module.exports = mongoose.model('Locale', LocaleSchema);
