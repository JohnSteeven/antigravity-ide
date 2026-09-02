/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  readerRoutes.js  —  Reader Experience & Personalization API Routes
 *  MyJourney Platform  |  Stage 4 — Phase 21: Reader Personalization
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const readerController = require('../controllers/readerController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');
const apiRegistry = require('../core/apiRegistry');

// ── Public / Anonymous Endpoints ──────────────────────────────────────────────
router.get('/feed', optionalAuthenticate, readerController.getPersonalizedFeed);
router.post('/progress', authenticate, readerController.updateProgress);
router.get('/progress/:articleId', authenticate, readerController.getProgress);
router.get('/continue-reading', authenticate, readerController.getContinueReading);
router.get('/completed', authenticate, readerController.getCompleted);
router.get('/learning-paths', readerController.getLearningPaths);

// ── Authenticated Reader Endpoints ────────────────────────────────────────────
router.get('/profile', authenticate, readerController.getProfile);
router.patch('/profile', authenticate, readerController.updateProfile);

router.get('/collections', authenticate, readerController.getCollections);
router.post('/collections', authenticate, readerController.createCollection);
router.post('/collections/:id/add', authenticate, readerController.addToCollection);

apiRegistry.register({
  name: 'ReaderExperience',
  prefix: '/api/reader',
  router,
  public: true,
  version: '4.0.0',
});

module.exports = router;
