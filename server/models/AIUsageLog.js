/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AIUsageLog.js  —  AI Request Usage Logging Model
 *  MyJourney CMS  |  Stage 3 — Phase 20A: AI Infrastructure
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Records every AI API call for cost tracking, analytics, and auditing.
 *  Used by AIAnalyticsModule to surface usage data to administrators.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const AIUsageLogSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      enum: ['openai', 'gemini', 'claude', 'ollama'],
      required: true,
      index: true,
    },
    model: {
      type: String,
      default: '',
    },
    action: {
      type: String,
      required: true,
      index: true,
      // e.g. 'generate', 'rewrite', 'seo_meta', 'suggest_tags', 'chat'
    },
    // Who triggered this request
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    // Which article/content was being worked on (optional)
    articleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Article',
      default: null,
    },
    // Prompt template used (if any)
    templateKey: {
      type: String,
      default: null,
    },
    // Token usage
    inputTokens: {
      type: Number,
      default: 0,
    },
    outputTokens: {
      type: Number,
      default: 0,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    // Cost in USD
    estimatedCostUsd: {
      type: Number,
      default: 0,
    },
    // Performance
    latencyMs: {
      type: Number,
      default: 0,
    },
    // Result
    success: {
      type: Boolean,
      default: true,
      index: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    // Was the AI output accepted or discarded by the user?
    // null = unknown (not tracked), true = accepted, false = discarded
    outputAccepted: {
      type: Boolean,
      default: null,
    },
    // Context: where was this called from?
    source: {
      type: String,
      enum: ['cms-writer', 'cms-seo', 'cms-prompt-manager', 'public-assistant', 'api', 'plugin'],
      default: 'cms-writer',
    },
  },
  {
    timestamps: true,
  }
);

// TTL index: auto-delete logs older than 90 days to control DB size
AIUsageLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('AIUsageLog', AIUsageLogSchema);
