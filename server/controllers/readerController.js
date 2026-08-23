/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  readerController.js  —  Reader Experience & Personalization Controller
 *  MyJourney Platform  |  Stage 4 — Phase 21: Reader Personalization
 * ─────────────────────────────────────────────────────────────────────────────
 */

const PersonalizationService = require('../services/personalizationService');
const ReadingProgressService  = require('../services/readingProgressService');
const ReaderProfileService    = require('../services/readerProfileService');

// ── Personalized Feed ─────────────────────────────────────────────────────────

exports.getPersonalizedFeed = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const feed = await PersonalizationService.getPersonalizedFeed(userId, null);
    res.json({ success: true, data: feed });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch personalized feed', message: err.message });
  }
};

// ── Reader Profile ────────────────────────────────────────────────────────────

exports.getProfile = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const profile = await ReaderProfileService.getProfile(req.user.id);
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile', message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    const updated = await ReaderProfileService.updateProfile(req.user.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile', message: err.message });
  }
};

// ── Reading Progress & Continue Reading ───────────────────────────────────────

exports.updateProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const progress = await ReadingProgressService.updateProgress({ ...req.body, userId });
    res.json({ success: true, data: progress });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update progress', message: err.message });
  }
};

exports.getContinueReading = async (req, res) => {
  try {
    const userId = req.user.id;
    const list = await ReadingProgressService.getContinueReading(userId, null);
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch continue reading list', message: err.message });
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
