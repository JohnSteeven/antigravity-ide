/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  aiController.js  —  AI Platform API Controller
 *  MyJourney CMS  |  Stage 3 — Phase 20A: AI Infrastructure
 * ─────────────────────────────────────────────────────────────────────────────
 */

const AIProvider = require('../models/AIProvider');
const AIProviderService = require('../services/aiProviderService');
const AIWriterService = require('../services/aiWriterService');
const PromptTemplateService = require('../services/promptTemplateService');
const AIUsageService = require('../services/aiUsageService');
const AIAssistantService = require('../services/aiAssistantService');
const KnowledgeSearchService = require('../services/knowledgeSearchService');

// ── Provider Management ───────────────────────────────────────────────────────

exports.getProviders = async (req, res) => {
  try {
    await AIProviderService.seedDefaults();
    const providers = await AIProvider.find().sort({ isActive: -1, name: 1 }).lean();
    res.json({ success: true, data: providers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch providers', message: err.message });
  }
};

exports.createProvider = async (req, res) => {
  try {
    const { name, provider, model, apiKey, baseUrl, temperature, maxTokens, notes,
            dailyTokenLimit, monthlyTokenLimit, costPerInputToken, costPerOutputToken } = req.body;

    const doc = await AIProvider.create({
      name, provider, model, apiKey, baseUrl, temperature, maxTokens, notes,
      dailyTokenLimit, monthlyTokenLimit, costPerInputToken, costPerOutputToken,
      createdBy: req.user?.id,
    });

    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create provider', message: err.message });
  }
};

exports.updateProvider = async (req, res) => {
  try {
    const provider = await AIProvider.findById(req.params.id).select('+apiKey');
    if (!provider) return res.status(404).json({ error: 'Not Found' });

    const allowed = ['name', 'model', 'apiKey', 'baseUrl', 'temperature', 'maxTokens',
                     'timeoutMs', 'retryCount', 'dailyTokenLimit', 'monthlyTokenLimit',
                     'costPerInputToken', 'costPerOutputToken', 'isEnabled', 'notes'];

    allowed.forEach((key) => {
      if (req.body[key] !== undefined) provider[key] = req.body[key];
    });
    provider.updatedBy = req.user?.id;
    await provider.save();

    // Return without API key
    const result = provider.toObject();
    delete result.apiKey;
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update provider', message: err.message });
  }
};

exports.activateProvider = async (req, res) => {
  try {
    // Deactivate all, then activate the chosen one
    await AIProvider.updateMany({}, { $set: { isActive: false } });
    const provider = await AIProvider.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: true, isEnabled: true, updatedBy: req.user?.id } },
      { new: true }
    );
    if (!provider) return res.status(404).json({ error: 'Not Found' });
    res.json({ success: true, data: provider, message: `"${provider.name}" is now the active AI provider.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to activate provider', message: err.message });
  }
};

exports.testProvider = async (req, res) => {
  try {
    const provider = await AIProvider.findById(req.params.id).select('+apiKey').lean();
    if (!provider) return res.status(404).json({ error: 'Not Found' });

    const result = await AIProviderService.testConnection(provider);
    res.json({ success: result.success, response: result.response, error: result.error });
  } catch (err) {
    res.status(500).json({ error: 'Test failed', message: err.message });
  }
};

exports.deleteProvider = async (req, res) => {
  try {
    const provider = await AIProvider.findById(req.params.id);
    if (!provider) return res.status(404).json({ error: 'Not Found' });
    if (provider.isActive) return res.status(400).json({ error: 'Cannot delete the active provider. Activate another provider first.' });
    await AIProvider.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Provider deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete provider', message: err.message });
  }
};

// ── AI Writing Operations ─────────────────────────────────────────────────────

exports.write = async (req, res) => {
  try {
    const { action, title, content, context, category, tone, wordCount, count, instruction, keywords } = req.body;
    const userId = req.user?.id;
    const articleId = req.body.articleId || null;

    if (!action) return res.status(400).json({ error: 'action is required' });

    let result;
    switch (action) {
      case 'generate':
        if (!title) return res.status(400).json({ error: 'title is required for generate' });
        result = await AIWriterService.generate({ title, context, category, tone, userId, articleId });
        break;
      case 'rewrite':
        if (!content) return res.status(400).json({ error: 'content is required for rewrite' });
        result = await AIWriterService.rewrite({ content, tone, instruction, userId, articleId });
        break;
      case 'expand':
        if (!content) return res.status(400).json({ error: 'content is required for expand' });
        result = await AIWriterService.expand({ content, context, userId, articleId });
        break;
      case 'shorten':
        if (!content) return res.status(400).json({ error: 'content is required for shorten' });
        result = await AIWriterService.shorten({ content, userId, articleId });
        break;
      case 'improve_readability':
        if (!content) return res.status(400).json({ error: 'content is required' });
        result = await AIWriterService.improveReadability({ content, userId, articleId });
        break;
      case 'improve_grammar':
        if (!content) return res.status(400).json({ error: 'content is required' });
        result = await AIWriterService.improveGrammar({ content, userId, articleId });
        break;
      case 'generate_summary':
        if (!content) return res.status(400).json({ error: 'content is required' });
        result = await AIWriterService.generateSummary({ content, wordCount, userId, articleId });
        break;
      case 'generate_excerpt':
        if (!content) return res.status(400).json({ error: 'content is required' });
        result = await AIWriterService.generateExcerpt({ content, userId, articleId });
        break;
      case 'suggest_headings':
        if (!content && !title) return res.status(400).json({ error: 'title or content is required' });
        result = await AIWriterService.suggestHeadings({ title, content, userId, articleId });
        break;
      case 'suggest_tags':
        if (!content && !title) return res.status(400).json({ error: 'title or content is required' });
        result = await AIWriterService.suggestTags({ title, content, category, userId, articleId });
        break;
      case 'suggest_faqs':
        if (!content) return res.status(400).json({ error: 'content is required' });
        result = await AIWriterService.generateFAQs({ content, count, userId, articleId });
        break;
      case 'seo_meta':
        if (!title) return res.status(400).json({ error: 'title is required for seo_meta' });
        result = await AIWriterService.generateSEO({ title, content, keywords, userId, articleId });
        break;
      default:
        return res.status(400).json({ error: `Unknown action: "${action}"` });
    }

    res.json({
      success: true,
      data: {
        content: result.content,
        tokens: result.tokens,
        latencyMs: result.latencyMs,
        provider: result.provider,
        model: result.model,
      },
    });
  } catch (err) {
    const status = err.message?.includes('No AI provider') ? 503 : 500;
    res.status(status).json({ error: 'AI write failed', message: err.message });
  }
};

// ── Prompt Template Management ────────────────────────────────────────────────

exports.getPrompts = async (req, res) => {
  try {
    await PromptTemplateService.seedDefaults(req.user?.id);
    const { category, action } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (action) filter.action = action;
    const templates = await PromptTemplateService.getAll(filter);
    res.json({ success: true, data: templates });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch templates', message: err.message });
  }
};

exports.createPrompt = async (req, res) => {
  try {
    const template = await PromptTemplateService.create(req.body, req.user?.id);
    res.status(201).json({ success: true, data: template });
  } catch (err) {
    res.status(400).json({ error: 'Failed to create template', message: err.message });
  }
};

exports.updatePrompt = async (req, res) => {
  try {
    const template = await PromptTemplateService.update(req.params.id, req.body, req.user?.id);
    res.json({ success: true, data: template });
  } catch (err) {
    res.status(400).json({ error: 'Failed to update template', message: err.message });
  }
};

exports.deletePrompt = async (req, res) => {
  try {
    await PromptTemplateService.delete(req.params.id);
    res.json({ success: true, message: 'Template deleted.' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete template', message: err.message });
  }
};

// ── AI Analytics ──────────────────────────────────────────────────────────────

exports.getAnalytics = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const analytics = await AIUsageService.getAnalytics(days);
    res.json({ success: true, data: analytics });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch analytics', message: err.message });
  }
};

exports.markAcceptance = async (req, res) => {
  try {
    const { logId, accepted } = req.body;
    if (!logId || accepted === undefined) return res.status(400).json({ error: 'logId and accepted are required' });
    await AIUsageService.markAcceptance(logId, accepted);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark acceptance', message: err.message });
  }
};

// ── Status ────────────────────────────────────────────────────────────────────

exports.getStatus = async (req, res) => {
  try {
    const available = await AIProviderService.isAvailable();
    res.json({ success: true, data: { available } });
  } catch (err) {
    res.json({ success: true, data: { available: false } });
  }
};

// ════════════════════════════════════════════════════════════════════════════════
//  Phase 20B: AI Knowledge Assistant (RAG Pipeline)
// ════════════════════════════════════════════════════════════════════════════════

// ── RAG Chat ──────────────────────────────────────────────────────────────────

exports.chat = async (req, res) => {
  try {
    const {
      query, mode, conversationId, sessionId,
      contextArticleSlug, category, interface: interfaceType,
    } = req.body;

    if (!query?.trim()) return res.status(400).json({ error: 'query is required' });

    const result = await AIAssistantService.chat({
      query: query.trim(),
      mode:           mode           || 'hybrid',
      interfaceType:  interfaceType  || 'reader',
      conversationId: conversationId || null,
      sessionId:      sessionId      || null,
      userId:         req.user?.id   || null,
      contextArticleSlug: contextArticleSlug || null,
      category:       category       || null,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    const status = err.message?.includes('No AI provider') ? 503 : 500;
    res.status(status).json({ error: 'Chat failed', message: err.message });
  }
};

// ── Conversation Management ───────────────────────────────────────────────────

exports.getConversation = async (req, res) => {
  try {
    const conversation = await AIAssistantService.getConversation(req.params.id);
    res.json({ success: true, data: conversation });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

exports.listConversations = async (req, res) => {
  try {
    const filter = req.user?.id
      ? { userId: req.user.id }
      : { sessionId: req.query.sessionId };
    const conversations = await AIAssistantService.listConversations(filter, 30);
    res.json({ success: true, data: conversations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Feedback ──────────────────────────────────────────────────────────────────

exports.submitFeedback = async (req, res) => {
  try {
    const { conversationId, messageId, feedback } = req.body;
    if (!conversationId || !messageId || !['helpful', 'not_helpful'].includes(feedback)) {
      return res.status(400).json({ error: 'conversationId, messageId, and valid feedback are required' });
    }
    await AIAssistantService.submitFeedback(conversationId, messageId, feedback);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Suggested Questions ───────────────────────────────────────────────────────

exports.getSuggestedQuestions = async (req, res) => {
  try {
    const { articleSlug, category } = req.query;
    const questions = await AIAssistantService.getSuggestedQuestions(articleSlug, category);
    res.json({ success: true, data: questions || [] });
  } catch (err) {
    res.json({
      success: true,
      data: [
        'How do I learn React?',
        'Recommend backend articles',
        'Explain JWT',
        'Best travel guides',
        'What should I read today?',
      ],
    });
  }
};

// ── Quiz Generation ───────────────────────────────────────────────────────────

exports.generateQuiz = async (req, res) => {
  try {
    const { articleSlug, questionCount = 5 } = req.body;
    if (!articleSlug) return res.status(400).json({ error: 'articleSlug is required' });
    const result = await AIAssistantService.generateQuiz(articleSlug, questionCount);
    res.json({ success: true, data: { content: result.content, tokens: result.tokens } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Knowledge Index Management (CMS admin only) ───────────────────────────────

exports.getIndexStats = async (req, res) => {
  try {
    const stats = await KnowledgeSearchService.getIndexStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.reindexAll = async (req, res) => {
  try {
    // Run in background — respond immediately
    res.json({ success: true, message: 'Re-indexing started in background.' });
    KnowledgeSearchService.reindexAll()
      .then((result) => console.info('[KnowledgeIndex] Re-index complete:', result))
      .catch((err) => console.error('[KnowledgeIndex] Re-index error:', err.message));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.indexArticle = async (req, res) => {
  try {
    const result = await KnowledgeSearchService.indexArticle(req.params.articleId);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════════
//  Phase 20C: Contextual CMS Endpoints
// ════════════════════════════════════════════════════════════════════════════════

exports.auditArticle = async (req, res) => {
  try {
    const result = await AIWriterService.articleAudit({ ...req.body, userId: req.user?.id });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.categoryAI = async (req, res) => {
  try {
    const result = await AIWriterService.categoryIntelligence({ ...req.body, userId: req.user?.id });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.pageAI = async (req, res) => {
  try {
    const result = await AIWriterService.websiteBuilderAI({ ...req.body, userId: req.user?.id });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.themeAI = async (req, res) => {
  try {
    const result = await AIWriterService.themeBuilderAI({ ...req.body, userId: req.user?.id });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.mediaAI = async (req, res) => {
  try {
    const result = await AIWriterService.mediaAI({ ...req.body, userId: req.user?.id });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.commentsAI = async (req, res) => {
  try {
    const result = await AIWriterService.commentsAI({ ...req.body, userId: req.user?.id });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.dashboardSuggestions = async (req, res) => {
  try {
    const result = await AIWriterService.dashboardSuggestions({ ...req.body, userId: req.user?.id });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ════════════════════════════════════════════════════════════════════════════════
//  Phase 20D: Autonomous Editorial Advisor Endpoints
// ════════════════════════════════════════════════════════════════════════════════

const EditorialAdvisorService = require('../services/editorialAdvisorService');
const ContentHealthService    = require('../services/contentHealthService');
const InternalLinkService     = require('../services/internalLinkService');

exports.analyzeAdvisor = async (req, res) => {
  try {
    const analysis = await EditorialAdvisorService.analyzeCatalog();
    res.json({ success: true, data: analysis });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.weeklyReport = async (req, res) => {
  try {
    const report = await EditorialAdvisorService.generateWeeklyReport();
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.calculateContentHealth = async (req, res) => {
  try {
    const { articleId, article } = req.body;
    let target = article;
    if (!target && articleId) {
      const Article = require('../models/Article');
      target = await Article.findById(articleId).lean();
    }
    const health = ContentHealthService.calculateHealth(target);
    res.json({ success: true, data: health });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.suggestInternalLinks = async (req, res) => {
  try {
    const { articleId, body } = req.body;
    const links = await InternalLinkService.suggestLinks(articleId, body);
    res.json({ success: true, data: links });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.refreshArticleAI = async (req, res) => {
  try {
    const { articleId } = req.body;
    if (!articleId) return res.status(400).json({ error: 'articleId is required' });
    const refreshed = await EditorialAdvisorService.refreshArticle(articleId);
    res.json({ success: true, data: refreshed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

