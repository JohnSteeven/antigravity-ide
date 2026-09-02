/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  aiRoutes.js  —  AI Platform API Routes
 *  MyJourney CMS  |  Stage 3 — Phase 20A: AI Infrastructure
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

// ── Status (public — used by frontend to conditionally show AI features) ──────
router.get('/status', aiController.getStatus);

// This legacy surface powers CMS tools only. Reader-facing AI is routed through
// the Agent domain with its own capability and entitlement policies.
router.use(authenticate, requireAdmin);

// ── Provider Management (admin only) ─────────────────────────────────────────
router.get('/providers', aiController.getProviders);
router.post('/providers', aiController.createProvider);
router.patch('/providers/:id', aiController.updateProvider);
router.post('/providers/:id/activate', aiController.activateProvider);
router.post('/providers/:id/test', aiController.testProvider);
router.delete('/providers/:id', aiController.deleteProvider);

// ── AI Writing (all actions via single endpoint) ──────────────────────────────
router.post('/write', aiController.write);

// ── Prompt Templates ──────────────────────────────────────────────────────────
router.get('/prompts', aiController.getPrompts);
router.post('/prompts', aiController.createPrompt);
router.patch('/prompts/:id', aiController.updatePrompt);
router.delete('/prompts/:id', aiController.deletePrompt);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/analytics', aiController.getAnalytics);
router.post('/analytics/acceptance', aiController.markAcceptance);

// ── Phase 20B: RAG Knowledge Assistant ─────────────────────────────────────────
// Public / Reader endpoints
router.post('/chat', aiController.chat);
router.get('/suggested-questions', aiController.getSuggestedQuestions);
router.post('/quiz', aiController.generateQuiz);
router.post('/feedback', aiController.submitFeedback);

// Conversations
router.get('/conversations', aiController.listConversations);
router.get('/conversations/:id', aiController.getConversation);

// Knowledge Indexing (Admin)
router.get('/index/stats', aiController.getIndexStats);
router.post('/index/reindex', aiController.reindexAll);
router.post('/index/article/:articleId', aiController.indexArticle);

// ── Phase 20C: Contextual CMS Endpoints ───────────────────────────────────────
router.post('/article/audit', aiController.auditArticle);
router.post('/category', aiController.categoryAI);
router.post('/page', aiController.pageAI);
router.post('/theme', aiController.themeAI);
router.post('/media', aiController.mediaAI);
router.post('/comments', aiController.commentsAI);
router.post('/dashboard', aiController.dashboardSuggestions);

// ── Phase 20D: Editorial Advisor & Content Intelligence Endpoints ─────────────
router.post('/advisor/analyze', aiController.analyzeAdvisor);
router.get('/advisor/weekly-report', aiController.weeklyReport);
router.post('/health/score', aiController.calculateContentHealth);
router.post('/internal-links', aiController.suggestInternalLinks);
router.post('/refresh', aiController.refreshArticleAI);

// ── Self-register with apiRegistry ───────────────────────────────────────────
apiRegistry.register({
  name: 'AI Platform',
  prefix: '/api/ai',
  router,
  public: false,
  version: '3.0.0',
  order: 60,
});

module.exports = router;
