/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AIFactory.js  —  AI Provider Abstraction Adapter
 *  MyJourney CMS  |  Phase -1: CMS Core
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Abstracts AI capabilities (summarization, tag generation, content rewriting).
 *  Selects provider based on AI_PROVIDER env variable (OpenAI, Claude, Gemini, DeepSeek, Local).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const config = require('../../config/configRegistry');

class DummyAIProvider {
  async complete({ prompt }) {
    return `[AI Placeholder] Response for prompt: "${prompt.slice(0, 50)}..."`;
  }

  async suggestTags({ title, body }) {
    return ['cms', 'general', 'news'];
  }
}

class AIFactory {
  static create() {
    const provider = config.get('ai.provider');
    if (!provider) {
      return new DummyAIProvider();
    }
    return new DummyAIProvider();
  }
}

module.exports = AIFactory;
