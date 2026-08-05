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
const apiRegistry = require('../core/apiRegistry');

// ── Status (public — used by frontend to conditionally show AI features) ──────
router.get('/status', aiController.getStatus);

// ── Provider Management (admin only) ─────────────────────────────────────────
router.get('/providers', authenticate, aiController.getProviders);
router.post('/providers', authenticate, aiController.createProvider);
router.patch('/providers/:id', authenticate, aiController.updateProvider);
router.post('/providers/:id/activate', authenticate, aiController.activateProvider);
router.post('/providers/:id/test', authenticate, aiController.testProvider);
router.delete('/providers/:id', authenticate, aiController.deleteProvider);

// ── AI Writing (all actions via single endpoint) ──────────────────────────────
router.post('/write', authenticate, aiController.write);

// ── Prompt Templates ──────────────────────────────────────────────────────────
router.get('/prompts', authenticate, aiController.getPrompts);
router.post('/prompts', authenticate, aiController.createPrompt);
router.patch('/prompts/:id', authenticate, aiController.updatePrompt);
router.delete('/prompts/:id', authenticate, aiController.deletePrompt);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/analytics', authenticate, aiController.getAnalytics);
router.post('/analytics/acceptance', authenticate, aiController.markAcceptance);

// ── Phase 20B: RAG Knowledge Assistant ─────────────────────────────────────────
// Public / Reader endpoints
router.post('/chat', aiController.chat);
router.get('/suggested-questions', aiController.getSuggestedQuestions);
router.post('/quiz', aiController.generateQuiz);
router.post('/feedback', aiController.submitFeedback);

// Conversations
router.get('/conversations', authenticate, aiController.listConversations);
router.get('/conversations/:id', aiController.getConversation);

// Knowledge Indexing (Admin)
router.get('/index/stats', authenticate, aiController.getIndexStats);
router.post('/index/reindex', authenticate, aiController.reindexAll);
router.post('/index/article/:articleId', authenticate, aiController.indexArticle);

// ── Phase 20C: Contextual CMS Endpoints ───────────────────────────────────────
router.post('/article/audit', authenticate, aiController.auditArticle);
router.post('/category', authenticate, aiController.categoryAI);
router.post('/page', authenticate, aiController.pageAI);
router.post('/theme', authenticate, aiController.themeAI);
router.post('/media', authenticate, aiController.mediaAI);
router.post('/comments', authenticate, aiController.commentsAI);
router.post('/dashboard', authenticate, aiController.dashboardSuggestions);

// ── Phase 20D: Editorial Advisor & Content Intelligence Endpoints ─────────────
router.post('/advisor/analyze', authenticate, aiController.analyzeAdvisor);
router.get('/advisor/weekly-report', authenticate, aiController.weeklyReport);
router.post('/health/score', authenticate, aiController.calculateContentHealth);
router.post('/internal-links', authenticate, aiController.suggestInternalLinks);
router.post('/refresh', authenticate, aiController.refreshArticleAI);

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
