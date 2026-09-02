/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AIPromptTemplate.js  —  Reusable Prompt Template Model
 *  MyJourney CMS  |  Stage 3 — Phase 20A: AI Infrastructure
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Stores administrator-defined prompt templates that can be reused
 *  across the AI Writing Assistant and AI Knowledge Assistant.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const AIPromptTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['writing', 'seo', 'rewrite', 'summarize', 'social', 'custom'],
      default: 'writing',
      index: true,
    },
    // The actual prompt — supports {{variables}} for dynamic injection
    systemPrompt: {
      type: String,
      default: '',
    },
    userPromptTemplate: {
      type: String,
      required: true,
    },
    // List of variable names used in the templates e.g. ['title', 'content', 'tone']
    variables: {
      type: [String],
      default: [],
    },
    // What AI action this template is used for
    action: {
      type: String,
      enum: [
        'generate',
        'rewrite',
        'expand',
        'shorten',
        'improve_readability',
        'improve_grammar',
        'improve_tone',
        'suggest_headings',
        'suggest_faqs',
        'generate_summary',
        'generate_excerpt',
        'suggest_tags',
        'suggest_categories',
        'seo_meta',
        'seo_keywords',
        'seo_internal_links',
        'custom',
      ],
      default: 'custom',
    },
    // Generation overrides (override provider defaults for this template)
    temperature: {
      type: Number,
      default: null, // null = use provider default
    },
    maxTokens: {
      type: Number,
      default: null,
    },
    isBuiltIn: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    // Plugin SDK: which plugin registered this template (null = built-in or admin)
    registeredByPlugin: {
      type: String,
      default: null,
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

module.exports = mongoose.model('AIPromptTemplate', AIPromptTemplateSchema);
