/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  FormSchema.js  —  Enterprise Dynamic Form Schema Model
 *  MyJourney CMS  |  Stage 2 — Phase 14: Dynamic Form Builder & Lead Management
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Schema-driven form model defining dynamic form fields, validation rules,
 *  multi-step wizard settings, and success notification handlers.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const FormFieldSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        'text',
        'textarea',
        'rich_text',
        'email',
        'phone',
        'number',
        'currency',
        'date',
        'time',
        'datetime',
        'select',
        'multi_select',
        'checkbox',
        'radio',
        'switch',
        'rating',
        'slider',
        'tags',
        'color',
        'file',
        'image',
        'hidden',
        'url',
      ],
      default: 'text',
    },
    required: { type: Boolean, default: false },
    placeholder: { type: String, default: '' },
    defaultValue: { type: String, default: '' },
    options: { type: [String], default: [] }, // Array of options for select, checkbox, radio
    validationRule: { type: String, default: '' }, // e.g. regex, min, max
    stepIndex: { type: Number, default: 1 },
  },
  { _id: false }
);

const FormSchemaSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    title: {
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
      default: 'General',
    },
    fields: [FormFieldSchema],
    successMessage: {
      type: String,
      default: 'Thank you for your submission!',
    },
    redirectUrl: {
      type: String,
      default: '',
    },
    isMultiStep: {
      type: Boolean,
      default: false,
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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('FormSchema', FormSchemaSchema);
