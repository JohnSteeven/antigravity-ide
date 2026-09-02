/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  distributionController.js  —  Omnichannel Distribution API Controller
 *  MyJourney Platform  |  Stage 4 — Phase 24: Distribution & Omnichannel Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const SocialAccount       = require('../models/SocialAccount');
const MarketingCampaign   = require('../models/MarketingCampaign');
const DistributionService = require('../services/distributionService');
const PodcastService      = require('../services/podcastService');

// ── Campaigns ─────────────────────────────────────────────────────────────────

exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await MarketingCampaign.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: campaigns });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.launchCampaign = async (req, res) => {
  try {
    const campaign = await DistributionService.launchCampaign(req.body);
    res.status(201).json({ success: true, data: campaign });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.generateSocialCaptions = async (req, res) => {
  try {
    const { articleId } = req.body;
    if (!articleId) return res.status(400).json({ error: 'articleId is required' });
    const captions = await DistributionService.generateSocialCaptions(articleId);
    res.json({ success: true, data: captions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Social Accounts ───────────────────────────────────────────────────────────

exports.getSocialAccounts = async (req, res) => {
  try {
    const accounts = await SocialAccount.find().lean();
    res.json({ success: true, data: accounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.connectSocialAccount = async (req, res) => {
  try {
    const account = await SocialAccount.create(req.body);
    res.status(201).json({ success: true, data: account });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Podcasts ──────────────────────────────────────────────────────────────────

exports.getPodcasts = async (req, res) => {
  try {
    const episodes = await PodcastService.getEpisodes();
    res.json({ success: true, data: episodes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createPodcast = async (req, res) => {
  try {
    const episode = await PodcastService.createEpisode(req.body);
    res.status(201).json({ success: true, data: episode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPodcastRss = async (req, res) => {
  try {
    const xml = await PodcastService.generateRssFeed();
    res.set('Content-Type', 'text/xml');
    res.send(xml);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
