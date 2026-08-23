/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  server/tests/routes.test.js  —  Route Authorization & Security Tests
 *  MyJourney Platform  |  P0 Stabilization Phase 1
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Verifies:
 *   - Public endpoints allow unauthenticated access.
 *   - Authenticated endpoints reject unauthenticated requests with 401.
 *   - Admin-only endpoints reject non-admin users with 403.
 *   - Prometheus metrics endpoint is protected with authentication + requireAdmin.
 *   - Secret Vault endpoints are protected with authentication + requireAdmin.
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const express = require('express');
const request = require('supertest');

// Mocks for database & external dependencies
jest.mock('../middleware/auth', () => ({
  authenticate: (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Authentication required.' });
    }
    if (authHeader === 'Bearer admin-token') {
      req.user = { _id: 'admin-1', role: 'Admin', status: 'ACTIVE' };
      return next();
    }
    if (authHeader === 'Bearer reader-token') {
      req.user = { _id: 'reader-1', role: 'Reader', status: 'ACTIVE' };
      return next();
    }
    return res.status(401).json({ message: 'Invalid token.' });
  },
  optionalAuthenticate: (req, res, next) => next(),
}));

// Mock controllers to avoid needing DB or AI dependencies
jest.mock('../controllers/governanceController', () => ({
  getOrgs: (req, res) => res.json([]),
  createOrg: (req, res) => res.status(201).json({}),
  getIdps: (req, res) => res.json([]),
  createIdp: (req, res) => res.status(201).json({}),
  getPolicies: (req, res) => res.json([]),
  createPolicy: (req, res) => res.status(201).json({}),
  exportUserData: (req, res) => res.json({ exported: true }),
  getSecrets: (req, res) => res.json([]),
  setSecret: (req, res) => res.status(201).json({}),
}));

jest.mock('../controllers/infrastructureController', () => ({
  getPrometheusMetrics: (req, res) => res.type('text/plain').send('# HELP metrics'),
  getMetrics: (req, res) => res.json({}),
  getNodes: (req, res) => res.json([]),
  getBackups: (req, res) => res.json([]),
  triggerBackup: (req, res) => res.status(202).json({}),
  getWorkers: (req, res) => res.json([]),
}));

jest.mock('../controllers/aiController', () => ({
  getStatus: (req, res) => res.json({ status: 'ok' }),
  getProviders: (req, res) => res.json([]),
  createProvider: (req, res) => res.status(201).json({}),
  updateProvider: (req, res) => res.json({}),
  activateProvider: (req, res) => res.json({}),
  testProvider: (req, res) => res.json({ ok: true }),
  deleteProvider: (req, res) => res.json({ deleted: true }),
  write: (req, res) => res.json({ text: 'AI response' }),
  getPrompts: (req, res) => res.json([]),
  createPrompt: (req, res) => res.status(201).json({}),
  updatePrompt: (req, res) => res.json({}),
  deletePrompt: (req, res) => res.json({ deleted: true }),
  getAnalytics: (req, res) => res.json({}),
  markAcceptance: (req, res) => res.json({}),
  chat: (req, res) => res.json({ answer: 'hi' }),
  getSuggestedQuestions: (req, res) => res.json([]),
  generateQuiz: (req, res) => res.json([]),
  submitFeedback: (req, res) => res.json({}),
  listConversations: (req, res) => res.json([]),
  getConversation: (req, res) => res.json({ id: req.params.id }),
  getIndexStats: (req, res) => res.json({}),
  reindexAll: (req, res) => res.json({}),
  indexArticle: (req, res) => res.json({}),
  auditArticle: (req, res) => res.json({}),
  categoryAI: (req, res) => res.json({}),
  pageAI: (req, res) => res.json({}),
  themeAI: (req, res) => res.json({}),
  mediaAI: (req, res) => res.json({}),
  commentsAI: (req, res) => res.json({}),
  dashboardSuggestions: (req, res) => res.json({}),
  analyzeAdvisor: (req, res) => res.json({}),
  weeklyReport: (req, res) => res.json({}),
  calculateContentHealth: (req, res) => res.json({}),
  suggestInternalLinks: (req, res) => res.json([]),
  refreshArticleAI: (req, res) => res.json({}),
}));

jest.mock('../controllers/developerController', () => ({
  getApiKeys: (req, res) => res.json([]),
  createApiKey: (req, res) => res.status(201).json({}),
  revokeApiKey: (req, res) => res.json({}),
  getWebhooks: (req, res) => res.json([]),
  createWebhook: (req, res) => res.status(201).json({}),
  getApplications: (req, res) => res.json([]),
  createApplication: (req, res) => res.status(201).json({}),
}));

jest.mock('../controllers/tenantController', () => ({
  getTenantById: (req, res) => res.json({ id: req.params.id }),
  getTenants: (req, res) => res.json([]),
  createTenant: (req, res) => res.status(201).json({}),
  updateBranding: (req, res) => res.json({}),
}));

jest.mock('../controllers/launchController', () => ({
  getReleases: (req, res) => res.json([]),
  getAuditReport: (req, res) => res.json({}),
  getDeployments: (req, res) => res.json([]),
  getTests: (req, res) => res.json([]),
}));

jest.mock('../controllers/membershipController', () => ({
  getPlans: (req, res) => res.json([]),
  getMyMembership: (req, res) => res.json({}),
  subscribe: (req, res) => res.json({}),
  cancelSubscription: (req, res) => res.json({}),
  createPlan: (req, res) => res.status(201).json({}),
  updatePlan: (req, res) => res.json({}),
  getRevenueStats: (req, res) => res.json({}),
  createCoupon: (req, res) => res.status(201).json({}),
}));

jest.mock('../controllers/communityController', () => ({
  getFeed: (req, res) => res.json([]),
  toggleFollow: (req, res) => res.json({}),
  getFollows: (req, res) => res.json([]),
  getReputation: (req, res) => res.json({}),
  votePoll: (req, res) => res.json({}),
  reportComment: (req, res) => res.json({}),
  getModerationQueue: (req, res) => res.json([]),
  updateModerationReport: (req, res) => res.json({}),
}));

jest.mock('../controllers/distributionController', () => ({
  getPodcastRss: (req, res) => res.type('xml').send('<rss></rss>'),
  getPodcasts: (req, res) => res.json([]),
  getCampaigns: (req, res) => res.json([]),
  launchCampaign: (req, res) => res.status(201).json({}),
  generateSocialCaptions: (req, res) => res.json({}),
  getSocialAccounts: (req, res) => res.json([]),
  connectSocialAccount: (req, res) => res.status(201).json({}),
  createPodcast: (req, res) => res.status(201).json({}),
}));

jest.mock('../controllers/searchController', () => ({
  universalSearch: (req, res) => res.json([]),
  autocomplete: (req, res) => res.json([]),
  getGraphNeighbors: (req, res) => res.json([]),
  getGraphStats: (req, res) => res.json({}),
  reindexAll: (req, res) => res.json({}),
}));

// Build express app with routers
const app = express();
app.use(express.json());

app.use('/api/governance', require('../routes/governanceRoutes'));
app.use('/api/infrastructure', require('../routes/infrastructureRoutes'));
app.use('/api/ai', require('../routes/aiRoutes'));
app.use('/api/developer', require('../routes/developerRoutes'));
app.use('/api/tenants', require('../routes/tenantRoutes'));
app.use('/api/launch', require('../routes/launchRoutes'));
app.use('/api/membership', require('../routes/membershipRoutes'));
app.use('/api/community', require('../routes/communityRoutes'));
app.use('/api/distribution', require('../routes/distributionRoutes'));
app.use('/api/search', require('../routes/searchRoutes'));

describe('Route Security & Authorization Tests', () => {

  describe('1. Governance Routes Security', () => {
    it('rejects unauthenticated requests to Secret Vault with 401', async () => {
      const res = await request(app).get('/api/governance/secrets');
      expect(res.status).toBe(401);
    });

    it('rejects non-admin (Reader) requests to Secret Vault with 403', async () => {
      const res = await request(app)
        .get('/api/governance/secrets')
        .set('Authorization', 'Bearer reader-token');
      expect(res.status).toBe(403);
    });

    it('allows Admin access to Secret Vault with 200', async () => {
      const res = await request(app)
        .get('/api/governance/secrets')
        .set('Authorization', 'Bearer admin-token');
      expect(res.status).toBe(200);
    });

    it('rejects non-admin requests to IdPs with 403', async () => {
      const res = await request(app)
        .get('/api/governance/idps')
        .set('Authorization', 'Bearer reader-token');
      expect(res.status).toBe(403);
    });
  });

  describe('2. Infrastructure & Prometheus Metrics Security', () => {
    it('rejects unauthenticated requests to Prometheus metrics with 401', async () => {
      const res = await request(app).get('/api/infrastructure/metrics/prometheus');
      expect(res.status).toBe(401);
    });

    it('rejects non-admin requests to Prometheus metrics with 403', async () => {
      const res = await request(app)
        .get('/api/infrastructure/metrics/prometheus')
        .set('Authorization', 'Bearer reader-token');
      expect(res.status).toBe(403);
    });

    it('allows Admin access to Prometheus metrics with 200', async () => {
      const res = await request(app)
        .get('/api/infrastructure/metrics/prometheus')
        .set('Authorization', 'Bearer admin-token');
      expect(res.status).toBe(200);
    });
  });

  describe('3. AI Platform Authorization', () => {
    it('allows public access to /api/ai/status', async () => {
      const res = await request(app).get('/api/ai/status');
      expect(res.status).toBe(200);
    });

    it('rejects non-admin access to AI providers with 403', async () => {
      const res = await request(app)
        .get('/api/ai/providers')
        .set('Authorization', 'Bearer reader-token');
      expect(res.status).toBe(403);
    });

    it('rejects unauthenticated access to conversation detail with 401', async () => {
      const res = await request(app).get('/api/ai/conversations/conv-123');
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated access to legacy AI completions with 401', async () => {
      const res = await request(app).post('/api/ai/chat').send({ query: 'hello' });
      expect(res.status).toBe(401);
    });

    it('rejects non-admin access to legacy AI completions with 403', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', 'Bearer reader-token')
        .send({ query: 'hello' });
      expect(res.status).toBe(403);
    });

    it('rejects non-admin access to RAG reindex with 403', async () => {
      const res = await request(app)
        .post('/api/ai/index/reindex')
        .set('Authorization', 'Bearer reader-token');
      expect(res.status).toBe(403);
    });
  });

  describe('4. Developer Platform Authorization', () => {
    it('rejects non-admin access to API keys with 403', async () => {
      const res = await request(app)
        .get('/api/developer/keys')
        .set('Authorization', 'Bearer reader-token');
      expect(res.status).toBe(403);
    });

    it('allows Admin access to API keys with 200', async () => {
      const res = await request(app)
        .get('/api/developer/keys')
        .set('Authorization', 'Bearer admin-token');
      expect(res.status).toBe(200);
    });
  });

  describe('5. Tenant & Launch Platform Authorization', () => {
    it('allows public tenant lookup by ID', async () => {
      const res = await request(app).get('/api/tenants/public/site-1');
      expect(res.status).toBe(200);
    });

    it('rejects non-admin tenant listing with 403', async () => {
      const res = await request(app)
        .get('/api/tenants')
        .set('Authorization', 'Bearer reader-token');
      expect(res.status).toBe(403);
    });

    it('rejects non-admin launch audit with 403', async () => {
      const res = await request(app)
        .get('/api/launch/audit')
        .set('Authorization', 'Bearer reader-token');
      expect(res.status).toBe(403);
    });
  });

  describe('6. Membership & Community Authorization', () => {
    it('allows public access to membership plans list', async () => {
      const res = await request(app).get('/api/membership/plans');
      expect(res.status).toBe(200);
    });

    it('rejects non-admin revenue stats access with 403', async () => {
      const res = await request(app)
        .get('/api/membership/revenue')
        .set('Authorization', 'Bearer reader-token');
      expect(res.status).toBe(403);
    });

    it('rejects non-admin moderation queue access with 403', async () => {
      const res = await request(app)
        .get('/api/community/moderation')
        .set('Authorization', 'Bearer reader-token');
      expect(res.status).toBe(403);
    });

    it('rejects anonymous community reports with 401', async () => {
      const res = await request(app).post('/api/community/report').send({ commentId: 'comment-1', reason: 'spam' });
      expect(res.status).toBe(401);
    });

    it('rejects non-admin AI caption generation with 403', async () => {
      const res = await request(app)
        .post('/api/distribution/social/captions')
        .set('Authorization', 'Bearer reader-token')
        .send({ articleId: 'article-1' });
      expect(res.status).toBe(403);
    });
  });

});
