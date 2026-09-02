/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  communityService.js  —  Follow, Moderation Queue & Community Feed Service
 *  MyJourney Platform  |  Stage 4 — Phase 23: Enterprise Community Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const UserFollow = require('../models/UserFollow');
const ModerationReport = require('../models/ModerationReport');
const Poll = require('../models/Poll');
const Article = require('../models/Article');
const ReputationService = require('./reputationService');

class CommunityService {
  // ── Follow System ──────────────────────────────────────────────────────────

  static async toggleFollow(followerId, targetType, targetId) {
    const existing = await UserFollow.findOne({ followerId, targetType, targetId });
    if (existing) {
      await UserFollow.deleteOne({ _id: existing._id });
      return { isFollowing: false };
    } else {
      await UserFollow.create({ followerId, targetType, targetId });
      return { isFollowing: true };
    }
  }

  static async getFollows(followerId) {
    return UserFollow.find({ followerId }).lean();
  }

  // ── Polls ──────────────────────────────────────────────────────────────────

  static async votePoll(pollId, optionId, userId) {
    const poll = await Poll.findById(pollId);
    if (!poll) throw new Error('Poll not found.');
    if (poll.status === 'closed') throw new Error('Poll is closed.');

    const option = poll.options.id(optionId);
    if (!option) throw new Error('Option not found.');

    // Check if user already voted
    const alreadyVoted = poll.options.some((opt) => opt.voters?.includes(userId));
    if (alreadyVoted) throw new Error('You have already voted in this poll.');

    option.votes += 1;
    option.voters.push(userId);
    await poll.save();

    await ReputationService.awardPoints(userId, 5, 'poll_vote');
    return poll;
  }

  // ── Moderation Queue ───────────────────────────────────────────────────────

  static async reportComment(commentId, reporterId, reason) {
    return ModerationReport.create({ commentId, reporterId, reason });
  }

  static async getModerationQueue(status = 'pending') {
    return ModerationReport.find({ status }).populate('commentId').populate('reporterId', 'firstName lastName').lean();
  }

  static async updateReportStatus(reportId, status, moderatorNotes, resolvedBy) {
    return ModerationReport.findByIdAndUpdate(
      reportId,
      { status, moderatorNotes, resolvedBy },
      { new: true }
    );
  }

  // ── Community Feed ─────────────────────────────────────────────────────────

  static async getCommunityFeed(userId = null) {
    let followedAuthors = [];
    let followedCategories = [];

    if (userId) {
      const follows = await UserFollow.find({ followerId: userId }).lean();
      followedAuthors = follows.filter((f) => f.targetType === 'author').map((f) => f.targetId);
      followedCategories = follows.filter((f) => f.targetType === 'category').map((f) => f.targetId);
    }

    const filter = { status: 'published', isDeleted: false };
    if (followedCategories.length > 0) {
      filter.categorySlug = { $in: followedCategories };
    }

    const timeline = await Article.find(filter)
      .sort({ publishedAt: -1 })
      .limit(10)
      .select('title slug description category categorySlug author publishedAt views likes')
      .lean();

    return {
      timeline,
      followedCounts: {
        authors: followedAuthors.length,
        categories: followedCategories.length,
      },
    };
  }
}

module.exports = CommunityService;
