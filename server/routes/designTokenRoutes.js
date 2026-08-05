/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  designTokenRoutes.js  —  Design Token API Routes
 *  MyJourney CMS  |  Phase 7: Design Token Management System
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const designTokenController = require('../controllers/designTokenController');
const { authenticate } = require('../middleware/auth');
const apiRegistry = require('../core/apiRegistry');

// Public reads
router.get('/', designTokenController.getTokens);
router.get('/css', designTokenController.getGeneratedCSS);
router.get('/export', designTokenController.exportTokens);
router.get('/:id', designTokenController.getTokenById);

// Authenticated writes
router.post('/', authenticate, designTokenController.createToken);
router.patch('/:id', authenticate, designTokenController.updateToken);
router.delete('/:id', authenticate, designTokenController.deleteToken);

apiRegistry.register({
  name: 'DesignTokenEngine',
  prefix: '/api/design-tokens',
  router,
  public: true,
});

module.exports = router;
