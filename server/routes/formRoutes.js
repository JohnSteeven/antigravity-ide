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
const { requireAdmin } = require('../middleware/admin');
const apiRegistry = require('../core/apiRegistry');

// Public Form Submissions & Public Form Schema Reads
router.get('/public/:key', formController.getFormByKey);
router.post('/submit/:formKey', formController.submitForm);

// CMS/Admin management
router.use(authenticate, requireAdmin);
router.get('/', formController.getForms);
router.post('/', formController.createForm);
router.get('/leads', formController.getLeads);
router.patch('/leads/:id', formController.updateLeadStatus);
router.get('/analytics', formController.getAnalytics);

apiRegistry.register({
  name: 'FormEngine',
  prefix: '/api/forms',
  router,
  public: true,
});

module.exports = router;
