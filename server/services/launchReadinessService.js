/**
 * Read-only, evidence-based production readiness audit.
 *
 * This service deliberately reports unavailable and incomplete dependencies as
 * failures. Running an audit never creates release, deployment, test, or audit
 * records and never calls an external provider.
 */

'use strict';

const mongoose = require('mongoose');
const env = require('../config/env');
const Article = require('../models/Article');
const AIProvider = require('../models/AIProvider');
const SearchIndex = require('../models/SearchIndex');
const MigrationRunner = require('../migrations/MigrationRunner');
const LearnMediaProviderService = require('../learn/mediaProviderService');
const GovernanceService = require('./governanceService');
const { getPublicDurationCatalog } = require('../premium/catalog');
const cache = require('../cache/cacheManager');
const queue = require('../queue/queueManager');
const storage = require('../storage/StorageFactory');

const check = (category, name, passed, details, critical = false) => ({
  category,
  name,
  passed: Boolean(passed),
  critical,
  details,
});

const safeCount = async (model, filter = {}) => {
  try {
    return { available: true, count: await model.countDocuments(filter) };
  } catch (_error) {
    return { available: false, count: null };
  }
};

const hasProductionClientOrigin = () => {
  try {
    const clientUrl = new URL(env.clientUrl);
    return clientUrl.protocol === 'https:'
      && !['localhost', '127.0.0.1'].includes(clientUrl.hostname);
  } catch (_error) {
    return false;
  }
};

const migrationEvidence = async (databaseConnected) => {
  if (!databaseConnected || !mongoose.connection.db) {
    return { passed: false, details: 'Migration status unavailable because MongoDB is not connected.' };
  }

  try {
    const runner = new MigrationRunner(mongoose.connection.db);
    const migrations = runner.loadMigrations();
    const applied = await runner.getApplied();
    const pending = migrations.filter((migration) => !applied.has(migration.name));
    return {
      passed: pending.length === 0,
      details: pending.length === 0
        ? `${migrations.length} registered migrations are applied.`
        : `${pending.length} of ${migrations.length} registered migrations are pending.`,
    };
  } catch (_error) {
    return { passed: false, details: 'Migration status could not be read.' };
  }
};

const vaultEvidence = () => {
  if (!GovernanceService.isVaultEnabled()) {
    return { passed: false, details: 'The application secret vault is disabled.' };
  }

  try {
    GovernanceService.getVaultKey();
    return { passed: true, details: 'The secret vault is enabled and its key format is valid.' };
  } catch (_error) {
    return { passed: false, details: 'The secret vault is enabled but its key is invalid.' };
  }
};

class LaunchReadinessService {
  static async runReadinessAudit() {
    const checks = [];
    const databaseConnected = mongoose.connection.readyState === 1;

    checks.push(check(
      'Database',
      'MongoDB connection',
      databaseConnected,
      databaseConnected ? 'MongoDB is connected.' : 'MongoDB is not connected.',
      true
    ));

    const productionEnvironment = env.nodeEnv === 'production'
      && env.cookieSecure
      && env.csrfEnabled
      && hasProductionClientOrigin();
    checks.push(check(
      'Environment',
      'Production security configuration',
      productionEnvironment,
      productionEnvironment
        ? 'Production mode, secure cookies, CSRF, and a non-local HTTPS client origin are configured.'
        : 'Production mode, secure cookies, CSRF, and a non-local HTTPS client origin are all required.',
      true
    ));

    const migrations = await migrationEvidence(databaseConnected);
    checks.push(check('Database', 'Migration status', migrations.passed, migrations.details, true));

    const emailConfigured = Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);
    checks.push(check(
      'Delivery',
      'Transactional email provider',
      emailConfigured,
      emailConfigured ? 'SMTP configuration is present; provider delivery is not exercised by this audit.' : 'SMTP configuration is incomplete.',
      true
    ));

    const billingCatalog = getPublicDurationCatalog();
    const checkoutAvailable = billingCatalog.some((duration) => duration.priceConfigured && duration.checkoutAvailable);
    checks.push(check(
      'Billing',
      'Premium checkout provider',
      checkoutAvailable,
      checkoutAvailable ? 'At least one Premium duration has configured pricing and checkout.' : 'No Premium duration currently has provider-backed checkout.',
      true
    ));

    const media = LearnMediaProviderService.capability();
    const protectedMediaAvailable = media.providerConfigured
      && media.signedDeliveryAvailable
      && media.malwareScanningAvailable;
    checks.push(check(
      'Media',
      'Protected media delivery',
      protectedMediaAvailable,
      protectedMediaAvailable ? 'Provider-backed signed delivery and malware scanning are configured.' : 'Provider-backed signed delivery and malware scanning are unavailable.',
      true
    ));

    const cacheCapability = cache.capability();
    checks.push(check(
      'Scale',
      'Distributed cache',
      cacheCapability.available && cacheCapability.distributed,
      cacheCapability.available && cacheCapability.distributed
        ? `Distributed cache driver ${cacheCapability.driver} is available.`
        : `Cache driver ${cacheCapability.driver} is process-local or unavailable.`,
      true
    ));

    const queueCapability = queue.capability();
    checks.push(check(
      'Scale',
      'Durable background queue',
      queueCapability.available && queueCapability.durable && queueCapability.distributed,
      queueCapability.available && queueCapability.durable && queueCapability.distributed
        ? `Durable queue driver ${queueCapability.driver} is available.`
        : `Queue driver ${queueCapability.driver} is process-local or unavailable.`,
      true
    ));

    const storageCapability = storage.capability();
    checks.push(check(
      'Scale',
      'Shared object storage',
      storageCapability.available && storageCapability.shared,
      storageCapability.available && storageCapability.shared
        ? `Shared storage driver ${storageCapability.driver} is available.`
        : `Storage driver ${storageCapability.driver} is node-local or unavailable.`,
      true
    ));

    const articleResult = databaseConnected ? await safeCount(Article, { status: 'published', isDeleted: { $ne: true } }) : { available: false, count: null };
    checks.push(check(
      'Publishing',
      'Published article catalog',
      articleResult.available && articleResult.count > 0,
      articleResult.available ? `${articleResult.count} published articles are recorded.` : 'Article catalog evidence could not be read.'
    ));

    const aiResult = databaseConnected ? await safeCount(AIProvider, { isActive: true, isEnabled: true }) : { available: false, count: null };
    checks.push(check(
      'AI',
      'Active AI provider configuration',
      aiResult.available && aiResult.count > 0,
      aiResult.available
        ? `${aiResult.count} active provider configurations are recorded; connectivity is not exercised by this audit.`
        : 'AI provider evidence could not be read.'
    ));

    const searchResult = databaseConnected ? await safeCount(SearchIndex, { isPublic: true }) : { available: false, count: null };
    checks.push(check(
      'Search',
      'Public search index',
      searchResult.available && searchResult.count > 0,
      searchResult.available ? `${searchResult.count} public search entries are recorded.` : 'Search-index evidence could not be read.'
    ));

    const vault = vaultEvidence();
    checks.push(check('Security', 'Application secret vault', vault.passed, vault.details));

    const passedCount = checks.filter((entry) => entry.passed).length;
    const readinessScore = Math.round((passedCount / checks.length) * 100);
    const criticalFailure = checks.some((entry) => entry.critical && !entry.passed);

    return {
      readinessScore,
      status: criticalFailure ? 'blocked' : (passedCount === checks.length ? 'ready' : 'warning'),
      evidenceSource: 'live_configuration_and_database',
      generatedAt: new Date().toISOString(),
      checks,
    };
  }
}

module.exports = LaunchReadinessService;
