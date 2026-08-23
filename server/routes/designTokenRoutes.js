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
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

// Runtime CSS is public; token definitions, usage metadata, and exports are CMS.
router.get('/css', designTokenController.getGeneratedCSS);

router.use(authenticate, requireAdmin);
router.get('/', designTokenController.getTokens);
router.get('/export', designTokenController.exportTokens);
router.get('/:id', designTokenController.getTokenById);

router.post('/', designTokenController.createToken);
router.patch('/:id', designTokenController.updateToken);
router.delete('/:id', designTokenController.deleteToken);

apiRegistry.register({
  name: 'DesignTokenEngine',
  prefix: '/api/design-tokens',
  router,
  public: true,
});

module.exports = router;
