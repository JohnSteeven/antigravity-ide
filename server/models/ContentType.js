/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  ContentType.js  —  Enterprise Content Type Schema Model
 *  MyJourney CMS  |  Phase 9: Enterprise Content Modeling Engine
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Stores schema definitions for dynamic headless content types (Authors, Books,
 *  Events, Courses, Collections, Series, Topics, Departments, Custom Types).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const SchemaFieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['text', 'textarea', 'rich_text', 'number', 'boolean', 'date', 'image', 'gallery', 'relationship', 'select'],
      default: 'text',
    },
    label: { type: String, required: true },
    defaultValue: { type: mongoose.Schema.Types.Mixed, default: '' },
    required: { type: Boolean, default: false },
    isTitle: { type: Boolean, default: false },
    isSlug: { type: Boolean, default: false },
    options: { type: [String], default: [] },
  },
  { _id: false }
);

const ContentTypeSchema = new mongoose.Schema(
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
    singularName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: 'Folder',
    },
    fields: [SchemaFieldSchema],
    taxonomies: {
      type: [String],
      default: ['Categories', 'Tags'],
    },
    status: {
      type: String,
      enum: ['published', 'draft', 'archived'],
      default: 'published',
      index: true,
    },
    isBuiltIn: {
      type: Boolean,
      default: false,
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

module.exports = mongoose.model('ContentType', ContentTypeSchema);
