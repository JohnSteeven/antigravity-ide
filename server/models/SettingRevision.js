/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SettingRevision.js  —  Setting Revision History Model
 *  MyJourney CMS  |  Phase 1: Settings Registry
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const SettingRevisionSchema = new mongoose.Schema(
  {
    settingKey: {
      type: String,
      required: true,
      index: true,
    },
    settingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SystemSetting',
      required: true,
    },
    version: {
      type: Number,
      required: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    reason: {
      type: String,
      default: 'Setting updated',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdByName: {
      type: String,
      default: 'System',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

module.exports = mongoose.model('SettingRevision', SettingRevisionSchema);
