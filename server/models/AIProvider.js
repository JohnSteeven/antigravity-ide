/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AIProvider.js  —  AI Provider Configuration Model
 *  MyJourney CMS  |  Stage 3 — Phase 20A: AI Infrastructure
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Stores the administrator-configured AI provider settings.
 *  Only one provider can be "active" at a time.
 *  API keys are stored in the database (encrypted at the application layer).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const AIProviderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    provider: {
      type: String,
      required: true,
      enum: ['openai', 'gemini', 'claude', 'ollama'],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    // Connection
    apiKey: {
      type: String,
      default: '',
      select: false, // Never returned in queries by default — must be explicitly selected
    },
    baseUrl: {
      type: String,
      default: '', // Used for Ollama or custom endpoints
    },
    model: {
      type: String,
      default: '', // e.g. 'gpt-4o', 'gemini-1.5-pro', 'claude-3-5-sonnet', 'llama3'
    },
    // Generation settings
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 2,
    },
    maxTokens: {
      type: Number,
      default: 2048,
    },
    streaming: {
      type: Boolean,
      default: false,
    },
    timeoutMs: {
      type: Number,
      default: 30000,
    },
    retryCount: {
      type: Number,
      default: 2,
    },
    // Usage limits
    dailyTokenLimit: {
      type: Number,
      default: 0, // 0 = unlimited
    },
    monthlyTokenLimit: {
      type: Number,
      default: 0, // 0 = unlimited
    },
    // Cost tracking (per 1000 tokens, in USD)
    costPerInputToken: {
      type: Number,
      default: 0,
    },
    costPerOutputToken: {
      type: Number,
      default: 0,
    },
    // Usage counters (reset daily/monthly by cron)
    dailyTokensUsed: {
      type: Number,
      default: 0,
    },
    monthlyTokensUsed: {
      type: Number,
      default: 0,
    },
    totalTokensUsed: {
      type: Number,
      default: 0,
    },
    estimatedTotalCostUsd: {
      type: Number,
      default: 0,
    },
    lastResetDaily: {
      type: Date,
      default: null,
    },
    lastResetMonthly: {
      type: Date,
      default: null,
    },
    // Metadata
    notes: {
      type: String,
      default: '',
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

module.exports = mongoose.model('AIProvider', AIProviderSchema);
