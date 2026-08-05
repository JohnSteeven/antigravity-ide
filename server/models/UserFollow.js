/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  UserFollow.js  —  Follow Engine Model (Authors, Categories, Tags, Paths)
 *  MyJourney Platform  |  Stage 4 — Phase 23: Enterprise Community Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');

const UserFollowSchema = new mongoose.Schema(
  {
    followerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: {
      type: String,
      enum: ['author', 'category', 'tag', 'learning_path', 'collection'],
      required: true,
      index: true,
    },
    targetId: { type: String, required: true, index: true }, // ObjectId string or slug
  },
  { timestamps: true }
);

UserFollowSchema.index({ followerId: 1, targetType: 1, targetId: 1 }, { unique: true });

module.exports = mongoose.model('UserFollow', UserFollowSchema);
