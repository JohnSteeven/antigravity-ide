/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  monetizationService.js  —  Membership & Paywall Engine Service
 *  MyJourney Platform  |  Stage 4 — Phase 22: Membership & Monetization
 * ─────────────────────────────────────────────────────────────────────────────
 */

const MembershipPlan = require('../models/MembershipPlan');
const ReaderMembership = require('../models/ReaderMembership');
const Coupon = require('../models/Coupon');

class MonetizationService {
  /**
   * Seed default membership plans on startup if empty.
   */
  static async seedDefaultPlans() {
    try {
      const count = await MembershipPlan.countDocuments();
      if (count === 0) {
        await MembershipPlan.create([
          { name: 'Free Reader', slug: 'free', description: 'Access to all public articles', monthlyPrice: 0, annualPrice: 0, features: ['Public Articles', 'Reader Assistant', 'Bookmarks'], sortOrder: 1 },
          { name: 'Premium Member', slug: 'premium', description: 'Access to premium articles & learning paths', monthlyPrice: 9, annualPrice: 90, features: ['Premium Content', 'Learning Pathways', 'No Ads', 'Priority Support'], trialDays: 7, sortOrder: 2 },
          { name: 'Pro Publisher', slug: 'pro', description: 'All features + exclusive tools', monthlyPrice: 19, annualPrice: 190, features: ['Everything in Premium', 'Export PDF', 'Direct Author Access'], sortOrder: 3 },
          { name: 'Lifetime VIP', slug: 'lifetime', description: 'One-time payment for lifetime access', monthlyPrice: 299, annualPrice: 299, features: ['Lifetime Access', 'VIP Badge'], sortOrder: 4 },
        ]);
        console.info('[Monetization] Seeded default membership plans.');
      }
    } catch (err) {
      console.error('[Monetization] Seed error:', err.message);
    }
  }

  /**
   * Check article access permissions for a reader.
   * Paywall modes: 'public', 'members', 'premium', 'pro', 'lifetime'
   */
  static async checkArticleAccess(userId, articleAccessTier = 'public') {
    if (articleAccessTier === 'public') return { canAccess: true, reason: 'public' };
    if (!userId) return { canAccess: false, reason: 'login_required' };

    const membership = await ReaderMembership.findOne({ userId, billingStatus: { $in: ['active', 'trialing'] } }).populate('planId').lean();

    if (!membership) {
      // Check metered limit (e.g. 5 free articles per month)
      return { canAccess: false, reason: 'upgrade_required', requiredTier: articleAccessTier };
    }

    const tierHierarchy = { free: 0, premium: 1, pro: 2, lifetime: 3 };
    const userLevel = tierHierarchy[membership.planSlug] || 0;
    const requiredLevel = tierHierarchy[articleAccessTier] || 1;

    if (userLevel >= requiredLevel) {
      return { canAccess: true, reason: 'granted', plan: membership.planSlug };
    }

    return { canAccess: false, reason: 'tier_too_low', requiredTier: articleAccessTier };
  }

  /**
   * Calculate Revenue Dashboard Statistics (MRR, ARR, Active Subscribers).
   */
  static async getRevenueStats() {
    const [plans, activeMemberships, totalMemberships] = await Promise.all([
      MembershipPlan.find().lean(),
      ReaderMembership.find({ billingStatus: 'active' }).populate('planId').lean(),
      ReaderMembership.countDocuments(),
    ]);

    let mrr = 0;
    activeMemberships.forEach((m) => {
      if (m.planId && m.planId.monthlyPrice) {
        mrr += m.planId.monthlyPrice;
      }
    });

    const arr = mrr * 12;

    return {
      mrr,
      arr,
      activeSubscribers: activeMemberships.length,
      totalMemberships,
      plansCount: plans.length,
    };
  }
}

module.exports = MonetizationService;
