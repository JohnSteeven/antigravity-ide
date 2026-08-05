/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  formRoutes.js  —  Dynamic Form API Routes
 *  MyJourney CMS  |  Stage 2 — Phase 14: Dynamic Form Builder & Lead Management
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');
const { authenticate } = require('../middleware/auth');
const apiRegistry = require('../core/apiRegistry');

// Public Form Submissions & Public Form Schema Reads
router.get('/public/:key', formController.getFormByKey);
router.post('/submit/:formKey', formController.submitForm);

// Authenticated CMS Management
router.get('/', authenticate, formController.getForms);
router.post('/', authenticate, formController.createForm);
router.get('/leads', authenticate, formController.getLeads);
router.patch('/leads/:id', authenticate, formController.updateLeadStatus);
router.get('/analytics', authenticate, formController.getAnalytics);

apiRegistry.register({
  name: 'FormEngine',
  prefix: '/api/forms',
  router,
  public: true,
});

module.exports = router;
