/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  promptTemplateService.js  —  Prompt Template CRUD & Management
 *  MyJourney CMS  |  Stage 3 — Phase 20A: AI Infrastructure
 * ─────────────────────────────────────────────────────────────────────────────
 */

const AIPromptTemplate = require('../models/AIPromptTemplate');

// Built-in prompt templates seeded on first run
const BUILT_IN_TEMPLATES = [
  {
    key: 'generate_article',
    name: 'Generate Article',
    description: 'Generate a complete article from a title and context',
    category: 'writing',
    action: 'generate',
    systemPrompt: 'You are an expert content writer for a personal publishing platform. Write engaging, human-centered content with clear structure. Use markdown formatting.',
    userPromptTemplate: 'Write a complete article titled "{{title}}" in a {{tone}} tone for the {{category}} category. {{context}}',
    variables: ['title', 'tone', 'category', 'context'],
    isBuiltIn: true,
  },
  {
    key: 'rewrite_paragraph',
    name: 'Rewrite Paragraph',
    description: 'Rewrite selected text in a different style',
    category: 'rewrite',
    action: 'rewrite',
    systemPrompt: 'You are an expert editor. Rewrite content to improve clarity, tone, and engagement. Return only the rewritten text.',
    userPromptTemplate: 'Rewrite the following with a {{tone}} tone: "{{content}}"',
    variables: ['content', 'tone'],
    isBuiltIn: true,
  },
  {
    key: 'improve_readability',
    name: 'Improve Readability',
    description: 'Simplify sentences and improve text flow',
    category: 'rewrite',
    action: 'improve_readability',
    systemPrompt: 'You are a plain-language editor. Simplify complex sentences, improve flow, and use accessible vocabulary without changing the meaning.',
    userPromptTemplate: 'Improve the readability of: "{{content}}"',
    variables: ['content'],
    isBuiltIn: true,
  },
  {
    key: 'seo_meta_generator',
    name: 'SEO Meta Generator',
    description: 'Generate meta title, description, and keywords',
    category: 'seo',
    action: 'seo_meta',
    systemPrompt: 'You are an SEO expert. Generate precise SEO metadata following Google best practices. Return valid JSON only.',
    userPromptTemplate: 'Generate SEO metadata for article titled "{{title}}" with content: {{content}}',
    variables: ['title', 'content', 'keywords'],
    isBuiltIn: true,
  },
  {
    key: 'suggest_tags',
    name: 'Suggest Tags',
    description: 'Suggest relevant article tags',
    category: 'writing',
    action: 'suggest_tags',
    systemPrompt: 'You are a content taxonomy expert. Suggest specific, searchable tags that readers would use to find this content.',
    userPromptTemplate: 'Suggest tags for article "{{title}}" in category "{{category}}": {{content}}',
    variables: ['title', 'category', 'content'],
    isBuiltIn: true,
  },
  {
    key: 'generate_summary',
    name: 'Generate Summary',
    description: 'Generate a concise article summary',
    category: 'summarize',
    action: 'generate_summary',
    systemPrompt: 'You are a professional summarizer. Write clear, accurate summaries that capture key points without adding opinion or editorializing.',
    userPromptTemplate: 'Summarize in {{wordCount}} words: {{content}}',
    variables: ['content', 'wordCount'],
    isBuiltIn: true,
  },
  {
    key: 'blog_intro',
    name: 'Blog Introduction',
    description: 'Generate a compelling blog post introduction',
    category: 'writing',
    action: 'generate',
    systemPrompt: 'You are a skilled blog writer. Write introductions that hook readers immediately with a relatable scenario, bold statement, or intriguing question.',
    userPromptTemplate: 'Write a compelling 2-paragraph introduction for a blog post titled "{{title}}" in the {{category}} category.',
    variables: ['title', 'category'],
    isBuiltIn: true,
  },
  {
    key: 'faq_generator',
    name: 'FAQ Generator',
    description: 'Generate frequently asked questions from article content',
    category: 'writing',
    action: 'suggest_faqs',
    systemPrompt: 'Generate practical FAQs that readers would genuinely ask. Answers should be concise and directly informative.',
    userPromptTemplate: 'Generate {{count}} FAQs for this article: {{content}}',
    variables: ['content', 'count'],
    isBuiltIn: true,
  },
  {
    key: 'coding_tutorial',
    name: 'Coding Tutorial',
    description: 'Generate structured technical tutorial content',
    category: 'writing',
    action: 'generate',
    systemPrompt: 'You are a senior software engineer and technical writer. Write clear tutorials with code examples in markdown fenced code blocks. Explain concepts progressively.',
    userPromptTemplate: 'Write a coding tutorial about "{{title}}" covering: {{context}}. Include practical code examples.',
    variables: ['title', 'context'],
    isBuiltIn: true,
  },
];

class PromptTemplateService {
  /**
   * Seed built-in templates on first run.
   */
  static async seedDefaults(userId = null) {
    try {
      const count = await AIPromptTemplate.countDocuments({ isBuiltIn: true });
      if (count === 0) {
        const docs = BUILT_IN_TEMPLATES.map((t) => ({ ...t, createdBy: userId }));
        await AIPromptTemplate.insertMany(docs);
        console.info(`[PromptTemplateService] Seeded ${docs.length} built-in templates.`);
      }
    } catch (err) {
      console.error('[PromptTemplateService] Seed error:', err.message);
    }
  }

  static async getAll(filter = {}) {
    const query = { isActive: true, ...filter };
    return AIPromptTemplate.find(query).sort({ category: 1, name: 1 }).lean();
  }

  static async getByKey(key) {
    return AIPromptTemplate.findOne({ key, isActive: true }).lean();
  }

  static async create(data, userId) {
    const key = data.key || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const existing = await AIPromptTemplate.findOne({ key });
    if (existing) throw new Error(`Template key "${key}" already exists.`);

    return AIPromptTemplate.create({ ...data, key, isBuiltIn: false, createdBy: userId });
  }

  static async update(id, data, userId) {
    const template = await AIPromptTemplate.findById(id);
    if (!template) throw new Error('Template not found.');
    if (template.isBuiltIn && data.key) throw new Error('Cannot change the key of a built-in template.');

    Object.assign(template, { ...data, updatedBy: userId });
    return template.save();
  }

  static async delete(id) {
    const template = await AIPromptTemplate.findById(id);
    if (!template) throw new Error('Template not found.');
    if (template.isBuiltIn) throw new Error('Built-in templates cannot be deleted.');
    await AIPromptTemplate.findByIdAndDelete(id);
    return true;
  }

  /**
   * Interpolate variables into a template string.
   * Replaces {{variable}} with the value from vars object.
   */
  static interpolate(templateStr, vars = {}) {
    return templateStr.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
  }

  /**
   * Increment usage counter for a template.
   */
  static async incrementUsage(key) {
    await AIPromptTemplate.updateOne({ key }, { $inc: { usageCount: 1 } }).catch(() => {});
  }
}

module.exports = PromptTemplateService;
