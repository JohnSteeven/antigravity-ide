"use strict";

const mongoose = require("mongoose");
const agentConfig = require("../agent/config");

const agentConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "",
      maxlength: 200,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      index: true,
    },
    messageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    // Soft-delete for privacy compliance; records are purged by the
    // account deletion lifecycle rather than hard-deleted immediately.
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + agentConfig.retention.conversationDays * 86400000),
    },
  },
  {
    timestamps: true,
    collection: "agentconversations",
  }
);

// Ownership list query: active conversations sorted by recency
agentConversationSchema.index(
  { userId: 1, status: 1, lastMessageAt: -1 },
  { name: "agent_conv_user_status_time" }
);
agentConversationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "agent_conv_retention_ttl" });

// Ensure isDeleted conversations are excluded from normal queries
agentConversationSchema.pre(/^find/, function () {
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
});

const AgentConversation = mongoose.model("AgentConversation", agentConversationSchema);

module.exports = AgentConversation;
