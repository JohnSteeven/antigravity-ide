/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  knowledgeGraphService.js  —  Knowledge Graph Traverser & Auto-Builder
 *  MyJourney Platform  |  Stage 5 — Phase 25: Enterprise Search & Knowledge Graph
 * ─────────────────────────────────────────────────────────────────────────────
 */

const KnowledgeNode = require('../models/KnowledgeNode');
const KnowledgeEdge = require('../models/KnowledgeEdge');

class KnowledgeGraphService {
  /**
   * Get or create a KnowledgeNode for an entity.
   */
  static async getOrCreateNode(nodeType, entityId, label, metadata = {}) {
    let node = await KnowledgeNode.findOne({ nodeType, entityId });
    if (!node) {
      node = await KnowledgeNode.create({
        nodeType,
        entityId: String(entityId),
        label,
        slug: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        metadata,
      });
    }
    return node;
  }

  /**
   * Connect two nodes with a directed relationship edge.
   */
  static async addEdge(sourceNodeId, targetNodeId, relationType, weight = 1.0) {
    try {
      return await KnowledgeEdge.findOneAndUpdate(
        { sourceNodeId, targetNodeId, relationType },
        { weight },
        { upsert: true, new: true }
      );
    } catch (err) {
      // Ignore duplicate edge errors
      return null;
    }
  }

  /**
   * Auto-build Knowledge Graph nodes and edges for an Article.
   */
  static async buildGraphForArticle(article) {
    if (!article) return;

    // 1. Article Node
    const articleNode = await KnowledgeGraphService.getOrCreateNode('article', article._id, article.title, {
      slug: article.slug,
      category: article.category,
    });

    // 2. Category Node & Edge (BELONGS_TO)
    if (article.category) {
      const categoryNode = await KnowledgeGraphService.getOrCreateNode('category', article.categorySlug || article.category, article.category);
      await KnowledgeGraphService.addEdge(articleNode._id, categoryNode._id, 'BELONGS_TO');
    }

    // 3. Author Node & Edge (WRITTEN_BY)
    if (article.author) {
      const authorNode = await KnowledgeGraphService.getOrCreateNode('author', article.author, article.author);
      await KnowledgeGraphService.addEdge(articleNode._id, authorNode._id, 'WRITTEN_BY');
    }

    // 4. Tag Nodes & Edges (USES)
    for (const tag of article.tags || []) {
      const tagNode = await KnowledgeGraphService.getOrCreateNode('tag', tag.toLowerCase(), tag);
      await KnowledgeGraphService.addEdge(articleNode._id, tagNode._id, 'USES');
    }

    return articleNode;
  }

  /**
   * Get connected graph neighbors for a given entity node.
   */
  static async getNeighbors(nodeType, entityId) {
    const node = await KnowledgeNode.findOne({ nodeType, entityId });
    if (!node) return { node: null, outgoing: [], incoming: [] };

    const outgoing = await KnowledgeEdge.find({ sourceNodeId: node._id })
      .populate('targetNodeId')
      .lean();

    const incoming = await KnowledgeEdge.find({ targetNodeId: node._id })
      .populate('sourceNodeId')
      .lean();

    return {
      node,
      outgoing: outgoing.map((e) => ({ relation: e.relationType, target: e.targetNodeId })),
      incoming: incoming.map((e) => ({ relation: e.relationType, source: e.sourceNodeId })),
    };
  }

  /**
   * Get Graph Overview Stats for CMS.
   */
  static async getGraphStats() {
    const [totalNodes, totalEdges, nodeTypes] = await Promise.all([
      KnowledgeNode.countDocuments(),
      KnowledgeEdge.countDocuments(),
      KnowledgeNode.aggregate([{ $group: { _id: '$nodeType', count: { $sum: 1 } } }]),
    ]);

    return { totalNodes, totalEdges, nodeTypes };
  }
}

module.exports = KnowledgeGraphService;
