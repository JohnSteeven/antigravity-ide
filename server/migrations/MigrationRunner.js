/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  MigrationRunner.js  —  Database Migration System
 *  MyJourney CMS  |  Phase -1: CMS Core
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Runs sequential database migrations.
 *  Every schema change is a versioned migration file.
 *
 *  Migration files live in: server/migrations/
 *    001-add-layout-field.js
 *    002-add-feature-flags.js
 *    003-add-pages-model.js
 *    004-add-media-folders.js
 *    ...
 *
 *  Run explicitly via: npm run migrate
 *  Server startup does not apply migrations automatically.
 *
 *  Each migration file exports:
 *    module.exports = {
 *      name: '001-add-layout-field',
 *      async up(db)   { ... },  // Apply migration
 *      async down(db) { ... },  // Rollback migration (optional)
 *    };
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const path = require('path');
const fs   = require('fs');

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');
const MIGRATIONS_COLLECTION = '__cms_migrations';

class MigrationRunner {
  constructor(db) {
    this.db = db; // MongoDB db instance (from mongoose.connection.db)
  }

  /**
   * Get the migrations collection (tracks what's been run).
   */
  get collection() {
    return this.db.collection(MIGRATIONS_COLLECTION);
  }

  /**
   * Load all migration files from server/migrations/
   */
  loadMigrations() {
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
      return [];
    }

    return fs
      .readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.js') && /^\d{3}/.test(f))
      .sort()
      .map(file => ({
        file,
        name: file.replace('.js', ''),
        ...require(path.join(MIGRATIONS_DIR, file)),
      }));
  }

  /**
   * Get list of already-applied migrations.
   */
  async getApplied() {
    const docs = await this.collection.find({}).toArray();
    return new Set(docs.map(d => d.name));
  }

  /**
   * Run all pending migrations.
   * @returns {{ applied: string[], skipped: string[], errors: object[] }}
   */
  async up() {
    const migrations = this.loadMigrations();
    const applied    = await this.getApplied();
    const results    = { applied: [], skipped: [], errors: [] };

    console.info(`[Migrations] Found ${migrations.length} migration(s), ${applied.size} already applied`);

    for (const migration of migrations) {
      if (applied.has(migration.name)) {
        results.skipped.push(migration.name);
        continue;
      }

      console.info(`[Migrations] ▶ Running: ${migration.name}`);

      try {
        await migration.up(this.db);

        await this.collection.insertOne({
          name:      migration.name,
          appliedAt: new Date(),
          version:   migration.version || '1.0.0',
        });

        results.applied.push(migration.name);
        console.info(`[Migrations] ✅ Applied: ${migration.name}`);
      } catch (err) {
        results.errors.push({ migration: migration.name, error: err.message });
        console.error(`[Migrations] ❌ Failed: ${migration.name}:`, err.message);
        throw err; // Stop on first failure to prevent partial state
      }
    }

    if (results.applied.length === 0) {
      console.info('[Migrations] ✅ All migrations up to date.');
    } else {
      console.info(`[Migrations] ✅ Applied ${results.applied.length} migration(s).`);
    }

    return results;
  }

  /**
   * Roll back the last N migrations.
   * @param {number} count  Number of migrations to roll back (default: 1)
   */
  async down(count = 1) {
    const migrations = this.loadMigrations().reverse();
    const applied    = await this.getApplied();
    let   rolled     = 0;

    for (const migration of migrations) {
      if (rolled >= count) break;
      if (!applied.has(migration.name)) continue;

      console.info(`[Migrations] ◀ Rolling back: ${migration.name}`);

      if (!migration.down) {
        console.warn(`[Migrations] ⚠ No rollback defined for: ${migration.name} — skipping`);
        continue;
      }

      try {
        await migration.down(this.db);
        await this.collection.deleteOne({ name: migration.name });
        console.info(`[Migrations] ✅ Rolled back: ${migration.name}`);
        rolled++;
      } catch (err) {
        console.error(`[Migrations] ❌ Rollback failed: ${migration.name}:`, err.message);
        throw err;
      }
    }
  }

  /**
   * Show migration status.
   */
  async status() {
    const migrations = this.loadMigrations();
    const applied    = await this.getApplied();

    return migrations.map(m => ({
      name:    m.name,
      status:  applied.has(m.name) ? 'applied' : 'pending',
    }));
  }

  /**
   * Read-only validation for production change review. This never applies a
   * migration. Applied migrations may declare named indexes to verify.
   */
  async validate() {
    const migrations = this.loadMigrations();
    const applied = await this.getApplied();
    const checks = [];
    for (const migration of migrations) {
      const pending = !applied.has(migration.name);
      const missingIndexes = [];
      if (!pending && migration.indexes) {
        for (const [collectionName, specs] of Object.entries(migration.indexes)) {
          const indexes = await this.db.collection(collectionName).indexes().catch((error) => error.codeName === "NamespaceNotFound" ? [] : Promise.reject(error));
          specs.forEach(([keys, options]) => {
            const compatible = indexes.some((index) => index.name === options.name || (
              JSON.stringify(index.key) === JSON.stringify(keys)
              && Boolean(index.unique) === Boolean(options.unique)
              && Boolean(index.sparse) === Boolean(options.sparse)
              && (options.expireAfterSeconds === undefined || index.expireAfterSeconds === options.expireAfterSeconds)
            ));
            if (!compatible) missingIndexes.push(`${collectionName}.${options.name}`);
          });
        }
      }
      checks.push({ name: migration.name, status: pending ? "pending" : missingIndexes.length ? "invalid" : "valid", missingIndexes });
    }
    const unknownApplied = [...applied].filter((name) => !migrations.some((migration) => migration.name === name));
    return { valid: checks.every((check) => check.status !== "invalid"), checks, unknownApplied };
  }
}

module.exports = MigrationRunner;
