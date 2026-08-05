/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  featureGate.js  —  Express Middleware for Feature Flag Gating
 *  MyJourney CMS  |  Phase 0: Feature Flags
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Usage in routes:
 *    const featureGate = require('../middleware/featureGate');
 *    router.use('/api/website-builder', featureGate('websitebuilder'), builderRoutes);
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const FeatureFlagService = require('../services/featureFlagService');

/**
 * Middleware factory for gating API routes behind a feature flag
 *
 * @param {string} flagKey - Feature flag key to check
 */
function featureGate(flagKey) {
  return async (req, res, next) => {
    try {
      const userRole = req.user?.role?.name || req.user?.role || 'public';
      const userId = req.user?.id || req.user?._id?.toString() || req.ip;

      const evalResult = await FeatureFlagService.evaluate(flagKey, {
        userRole,
        userId,
        environment: process.env.NODE_ENV || 'development',
      });

      if (!evalResult.allowed) {
        return res.status(403).json({
          error: 'Feature Restricted',
          message: evalResult.reason || `Feature '${flagKey}' is currently unavailable.`,
          feature: flagKey,
          status: evalResult.status,
        });
      }

      req.featureFlag = evalResult.flag;
      next();
    } catch (err) {
      console.error(`[FeatureGate] Error evaluating flag '${flagKey}':`, err.message);
      // In case of service error, pass through to avoid breaking core functionality
      next();
    }
  };
}

module.exports = featureGate;
