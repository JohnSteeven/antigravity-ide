/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  apiGatewayService.js  —  API Gateway, Auth & Key Management Service
 *  MyJourney Platform  |  Stage 5 — Phase 26: Enterprise Developer Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const crypto = require('crypto');
const ApiKey = require('../models/ApiKey');
const ApiApplication = require('../models/ApiApplication');

class ApiGatewayService {
  /**
   * Create a new API Key for a user.
   */
  static async createApiKey(ownerId, name, permissions = ['read']) {
    const rawKey = `mj_live_${crypto.randomBytes(24).toString('hex')}`;
    const apiKey = await ApiKey.create({
      name,
      key: rawKey,
      owner: ownerId,
      permissions,
    });
    return apiKey;
  }

  /**
   * Validate API Key from Authorization header (`Bearer mj_live_...`).
   */
  static async validateKey(keyString) {
    if (!keyString) return null;
    const cleanKey = keyString.replace(/^Bearer\s+/i, '').trim();

    const apiKey = await ApiKey.findOne({ key: cleanKey, status: 'active' });
    if (!apiKey) return null;

    apiKey.lastUsedAt = new Date();
    await apiKey.save();

    return apiKey;
  }

  /**
   * Register a new OAuth Application.
   */
  static async createApplication(ownerId, name, redirectUris = []) {
    const clientId = `client_${crypto.randomBytes(12).toString('hex')}`;
    const clientSecret = `sec_${crypto.randomBytes(24).toString('hex')}`;

    const app = await ApiApplication.create({
      name,
      owner: ownerId,
      clientId,
      clientSecret,
      redirectUris,
    });

    return app;
  }
}

module.exports = ApiGatewayService;
