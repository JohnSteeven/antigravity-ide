/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  tenantService.js  —  Tenant Management & Multi-Site Service
 *  MyJourney Platform  |  Stage 5 — Phase 27: Enterprise Multi-Site Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Tenant = require('../models/Tenant');
const TenantDomain = require('../models/TenantDomain');

class TenantService {
  /**
   * Seed default Primary Tenant on startup.
   */
  static async seedDefaultTenant() {
    try {
      const count = await Tenant.countDocuments();
      if (count === 0) {
        const primary = await Tenant.create({
          name: 'MyJourney Primary Site',
          slug: 'primary',
          domain: 'localhost',
          status: 'active',
          primaryColor: '#426c67',
        });
        console.info('[Tenant] Seeded primary tenant site.');
        return primary;
      }
    } catch (err) {
      console.error('[Tenant] Seed error:', err.message);
    }
  }

  static async getAllTenants() {
    await TenantService.seedDefaultTenant();
    return Tenant.find().sort({ createdAt: 1 }).lean();
  }

  static async createTenant(data) {
    const slug = (data.slug || data.name || 'site').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const tenant = await Tenant.create({ ...data, slug });

    // Create domain record
    await TenantDomain.create({
      tenantId: tenant._id,
      domain: tenant.domain,
      isPrimary: true,
    });

    return tenant;
  }

  static async updateBranding(tenantId, brandingData) {
    return Tenant.findByIdAndUpdate(tenantId, brandingData, { new: true });
  }
}

module.exports = TenantService;
