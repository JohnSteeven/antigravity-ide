/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  semanticSearchService.js  —  AI Semantic Search & Concept Discovery Engine
 *  MyJourney Platform  |  Stage 5 — Phase 25: Enterprise Search & Knowledge Graph
 * ─────────────────────────────────────────────────────────────────────────────
 */

const EnterpriseSearchService = require('./enterpriseSearchService');
const KnowledgeGraphService   = require('./knowledgeGraphService');
const AIProviderService       = require('./aiProviderService');

class SemanticSearchService {
  /**
   * Concept-Aware AI Semantic Search.
   */
  static async search(userQuery, options = {}) {
    // 1. Direct Universal Search
    const searchResult = await EnterpriseSearchService.search(userQuery, options);

    // 2. Query Knowledge Graph for related concepts
    let relatedConcepts = [];
    if (searchResult.results.length > 0) {
      const topHit = searchResult.results[0];
      const neighbors = await KnowledgeGraphService.getNeighbors(topHit.entityType, topHit.entityId);
      relatedConcepts = (neighbors.outgoing || []).map((e) => ({
        label: e.target?.label,
        type: e.target?.nodeType,
        relation: e.relation,
      })).filter((c) => c.label);
    }

    // 3. Optional AI Synthesis if query asks a complex question
    let aiSynthesis = null;
    if (userQuery.length > 15 || userQuery.includes('how') || userQuery.includes('what') || userQuery.includes('learn')) {
      try {
        const aiResult = await AIProviderService.complete({
          messages: [
            { role: 'system', content: 'You are a technical learning advisor for MyJourney. Be direct and concise.' },
            {
              role: 'user',
              content: `User query: "${userQuery}".
Matching content: ${searchResult.results.slice(0, 3).map((r) => r.title).join(', ')}.

Provide a 2-sentence summary answering their query and recommending what to read first.`,
            },
          ],
          action: 'semantic_search_synthesis',
          source: 'public-assistant',
          overrides: { temperature: 0.5, maxTokens: 300 },
        });
        aiSynthesis = aiResult.content;
      } catch (err) {
        // Fallback silently if AI call fails
      }
    }

    return {
      query: userQuery,
      aiSynthesis,
      relatedConcepts: relatedConcepts.slice(0, 6),
      results: searchResult.results,
      total: searchResult.total,
    };
  }
}

module.exports = SemanticSearchService;
