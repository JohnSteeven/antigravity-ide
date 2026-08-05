/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  membershipRoutes.js  —  Membership & Monetization API Routes
 *  MyJourney Platform  |  Stage 4 — Phase 22: Membership & Monetization
 * ─────────────────────────────────────────────────────────────────────────────
 */

const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');
const { authenticate } = require('../middleware/auth');
const apiRegistry = require('../core/apiRegistry');

// Public endpoints
router.get('/plans', membershipController.getPlans);

// Authenticated reader endpoints
router.get('/me', authenticate, membershipController.getMyMembership);
router.post('/subscribe', authenticate, membershipController.subscribe);
router.post('/cancel', authenticate, membershipController.cancelSubscription);

// Admin CMS endpoints
router.post('/plans', authenticate, membershipController.createPlan);
router.patch('/plans/:id', authenticate, membershipController.updatePlan);
router.get('/revenue', authenticate, membershipController.getRevenueStats);
router.post('/coupons', authenticate, membershipController.createCoupon);

apiRegistry.register({
  name: 'MembershipPlatform',
  prefix: '/api/membership',
  router,
  public: true,
  version: '4.0.0',
});

module.exports = router;
