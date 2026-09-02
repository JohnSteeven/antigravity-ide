/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  readerController.js  —  Reader Experience & Personalization Controller
 *  MyJourney Platform  |  Stage 4 — Phase 21: Reader Personalization
 * ─────────────────────────────────────────────────────────────────────────────
 */

const PersonalizationService = require('../services/personalizationService');
const ReadingProgressService  = require('../services/readingProgressService');
const ReaderProfileService    = require('../services/readerProfileService');

const fail = (res, error, fallback) => {
  const status = Number.isInteger(error?.status) ? error.status : 500;
  return res.status(status).json({ error: status >= 500 ? fallback : error.message });
};

// ── Personalized Feed ─────────────────────────────────────────────────────────

exports.getPersonalizedFeed = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const feed = await PersonalizationService.getPersonalizedFeed(userId);
    res.json({ success: true, data: feed });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch personalized feed', message: err.message });
  }
};

// ── Reader Profile ────────────────────────────────────────────────────────────

exports.getProfile = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const profile = await ReaderProfileService.getProfileContract(req.user);
    res.json({ success: true, data: profile });
  } catch (err) {
    fail(res, err, 'Failed to fetch profile');
  }
};

exports.updateProfile = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    await ReaderProfileService.updateProfile(req.user.id, req.body);
    const updated = await ReaderProfileService.getProfileContract(req.user);
    res.json({ success: true, data: updated });
  } catch (err) {
    fail(res, err, 'Failed to update profile');
  }
};

// ── Reading Progress & Continue Reading ───────────────────────────────────────

exports.updateProgress = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const progress = await ReadingProgressService.updateProgress({ ...req.body, userId });
    res.json({ success: true, data: progress });
  } catch (err) {
    fail(res, err, 'Failed to update progress');
  }
};

exports.getProgress = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const progress = await ReadingProgressService.getProgress(userId, req.params.articleId);
    if (!progress) return res.status(404).json({ error: 'Reading progress not found.' });
    return res.json({ success: true, data: progress });
  } catch (err) {
    return fail(res, err, 'Failed to fetch reading progress');
  }
};

exports.getContinueReading = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const list = await ReadingProgressService.getContinueReading(userId);
    res.json({ success: true, data: list });
  } catch (err) {
    fail(res, err, 'Failed to fetch continue reading list');
  }
};

exports.getCompleted = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const list = await ReadingProgressService.getCompleted(userId);
    res.json({ success: true, data: list });
  } catch (err) {
    fail(res, err, 'Failed to fetch completed reading list');
  }
};

// ── Collections ───────────────────────────────────────────────────────────────

exports.getCollections = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const collections = await ReaderProfileService.getCollections(req.user.id);
    res.json({ success: true, data: collections });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch collections', message: err.message });
  }
};

exports.createCollection = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const collection = await ReaderProfileService.createCollection(req.user.id, req.body);
    res.status(201).json({ success: true, data: collection });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create collection', message: err.message });
  }
};

exports.addToCollection = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const { articleId } = req.body;
    const collection = await ReaderProfileService.addArticleToCollection(req.user.id, req.params.id, articleId);
    res.json({ success: true, data: collection });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add article to collection', message: err.message });
  }
};

// ── Learning Paths ────────────────────────────────────────────────────────────

exports.getLearningPaths = async (req, res) => {
  try {
    await ReaderProfileService.seedDefaultPaths();
    const paths = await ReaderProfileService.getLearningPaths(req.query.category);
    res.json({ success: true, data: paths });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch learning paths', message: err.message });
  }
};
