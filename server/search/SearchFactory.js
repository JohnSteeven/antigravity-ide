/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SearchFactory.js  —  Unified Search Engine Factory
 *  MyJourney CMS  |  Phase -1: CMS Core
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Provides a single search interface across MongoDB text search or external search engines.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const config = require('../config/configRegistry');

class MongoSearch {
  /**
   * Search MongoDB model using text index or regex fallback
   */
  async search(model, queryText, fields = ['title', 'content']) {
    if (!queryText) return [];
    
    const regex = new RegExp(queryText, 'i');
    const filter = {
      $or: fields.map(field => ({ [field]: regex })),
    };

    return await model.find(filter).limit(20).lean();
  }
}

class SearchFactory {
  static create() {
    const driver = config.get('search.driver', 'mongo');
    return new MongoSearch();
  }
}

module.exports = SearchFactory;
