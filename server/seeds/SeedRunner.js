/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SeedRunner.js  —  CMS Database Seeder
 *  MyJourney CMS  |  Phase -1: CMS Core
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Populates initial default data for new installations:
 *    - Default roles & permissions
 *    - Core system settings
 *    - Default feature flags
 *    - Default layout definitions
 *    - Default navigation structure
 *    - Default media folders
 *
 *  Run via: node server/scripts/seed.js
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const path = require('path');
const fs   = require('fs');

const SEEDS_DIR = path.join(__dirname);

class SeedRunner {
  constructor(db) {
    this.db = db;
  }

  /**
   * Run all seed scripts in server/seeds/
   */
  async runAll() {
    console.info('[Seeds] Starting database seed process...');
    const files = fs.readdirSync(SEEDS_DIR)
      .filter(f => f.startsWith('seed') && f.endsWith('.js') && f !== 'SeedRunner.js')
      .sort();

    const results = { seeded: [], skipped: [], errors: [] };

    for (const file of files) {
      const seedModule = require(path.join(SEEDS_DIR, file));
      const seedName = seedModule.name || file;

      try {
        console.info(`[Seeds] ▶ Running seed: ${seedName}`);
        const res = await seedModule.run(this.db);
        if (res?.skipped) {
          results.skipped.push(seedName);
          console.info(`[Seeds] ⏭ Skipped: ${seedName}`);
        } else {
          results.seeded.push(seedName);
          console.info(`[Seeds] ✅ Seeded: ${seedName}`);
        }
      } catch (err) {
        results.errors.push({ seed: seedName, error: err.message });
        console.error(`[Seeds] ❌ Error in seed ${seedName}:`, err.message);
      }
    }

    console.info(`[Seeds] Complete. Seeded: ${results.seeded.length}, Skipped: ${results.skipped.length}, Errors: ${results.errors.length}`);
    return results;
  }
}

module.exports = SeedRunner;
