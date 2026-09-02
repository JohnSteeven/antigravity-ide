/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  communityController.js  —  Community & Discussion API Controller
 *  MyJourney Platform  |  Stage 4 — Phase 23: Enterprise Community Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const CommunityService  = require('../services/communityService');
const ReputationService = require('../services/reputationService');

exports.getFeed = async (req, res) => {
  try {
    const feed = await CommunityService.getCommunityFeed(req.user?.id || null);
    res.json({ success: true, data: feed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.toggleFollow = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const { targetType, targetId } = req.body;
    const result = await CommunityService.toggleFollow(req.user.id, targetType, targetId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFollows = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const follows = await CommunityService.getFollows(req.user.id);
    res.json({ success: true, data: follows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReputation = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const rep = await ReputationService.getReputation(req.user.id);
    res.json({ success: true, data: rep });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.votePoll = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const { optionId } = req.body;
    const poll = await CommunityService.votePoll(req.params.id, optionId, req.user.id);
    res.json({ success: true, data: poll });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.reportComment = async (req, res) => {
  try {
    const { commentId, reason } = req.body;
    const report = await CommunityService.reportComment(commentId, req.user?.id, reason);
    res.status(201).json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getModerationQueue = async (req, res) => {
  try {
    const queue = await CommunityService.getModerationQueue(req.query.status || 'pending');
    res.json({ success: true, data: queue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateModerationReport = async (req, res) => {
  try {
    const { status, moderatorNotes } = req.body;
    const updated = await CommunityService.updateReportStatus(req.params.id, status, moderatorNotes, req.user?.id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
