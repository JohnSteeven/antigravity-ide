/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  searchController.js  —  Enterprise Search & Knowledge Graph Controller
 *  MyJourney Platform  |  Stage 5 — Phase 25: Enterprise Search & Knowledge Graph
 * ─────────────────────────────────────────────────────────────────────────────
 */

const EnterpriseSearchService = require('../services/enterpriseSearchService');
const SemanticSearchService   = require('../services/semanticSearchService');
const KnowledgeGraphService   = require('../services/knowledgeGraphService');

exports.universalSearch = async (req, res) => {
  try {
    const { q, semantic, type, page, limit } = req.query;
    if (!q) return res.json({ success: true, data: { results: [], total: 0 } });

    let result;
    if (semantic === 'true') {
      result = await SemanticSearchService.search(q, { entityType: type || 'all', page: parseInt(page) || 1, limit: parseInt(limit) || 10 });
    } else {
      result = await EnterpriseSearchService.search(q, { entityType: type || 'all', page: parseInt(page) || 1, limit: parseInt(limit) || 10 });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.autocomplete = async (req, res) => {
  try {
    const suggestions = await EnterpriseSearchService.autocomplete(req.query.q);
    res.json({ success: true, data: suggestions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getGraphStats = async (req, res) => {
  try {
    const stats = await KnowledgeGraphService.getGraphStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getGraphNeighbors = async (req, res) => {
  try {
    const { type, entityId } = req.query;
    const neighbors = await KnowledgeGraphService.getNeighbors(type, entityId);
    res.json({ success: true, data: neighbors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.reindexAll = async (req, res) => {
  try {
    const result = await EnterpriseSearchService.reindexAll();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
