/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AIConversation.js  —  Conversation Memory Model
 *  MyJourney CMS  |  Stage 3 — Phase 20B: AI Knowledge Assistant
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Stores conversation sessions with sliding-window message history.
 *  A session belongs to a reader (by userId or anonymous sessionId).
 *  Messages include role, content, and any citations returned.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const CitationSchema = new mongoose.Schema(
  {
    articleId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
    title:      { type: String },
    slug:       { type: String },
    category:   { type: String },
    relevance:  { type: Number, default: 0 }, // 0-1 score
  },
  { _id: false }
);

const MessageSchema = new mongoose.Schema(
  {
    role:       { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content:    { type: String, required: true },
    citations:  { type: [CitationSchema], default: [] },
    // Which knowledge mode answered this message
    source:     { type: String, enum: ['knowledge', 'hybrid-knowledge', 'hybrid-ai', 'general', 'system'], default: 'knowledge' },
    // Feedback from reader
    feedback:   { type: String, enum: ['helpful', 'not_helpful', null], default: null },
    tokenCount: { type: Number, default: 0 },
    latencyMs:  { type: Number, default: 0 },
    createdAt:  { type: Date, default: Date.now },
  },
  { _id: true }
);

const AIConversationSchema = new mongoose.Schema(
  {
    // Session identity — either a logged-in user or an anonymous browser session
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    sessionId: { type: String, index: true }, // fingerprint for anonymous users

    // Mode for this conversation
    mode: {
      type: String,
      enum: ['knowledge-only', 'hybrid', 'general'],
      default: 'hybrid',
    },

    // Context: which page/article the user was on when they opened the assistant
    contextArticleId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Article', default: null },
    contextArticleSlug: { type: String, default: null },

    // Conversation interface ('reader' = public, 'admin' = CMS)
    interface: {
      type: String,
      enum: ['reader', 'admin'],
      default: 'reader',
    },

    // Sliding window: max 20 messages stored per conversation
    messages: { type: [MessageSchema], default: [] },

    // Conversation metadata
    title: { type: String, default: '' }, // auto-generated from first question
    messageCount: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },

    // Soft expiry — conversations auto-expire after 7 days of inactivity
    lastActivityAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// TTL index: auto-delete inactive conversations after 7 days
AIConversationSchema.index({ lastActivityAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

module.exports = mongoose.model('AIConversation', AIConversationSchema);
