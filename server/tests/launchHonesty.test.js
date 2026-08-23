'use strict';

const fs = require('fs');
const path = require('path');

jest.mock('mongoose', () => ({
  connection: { readyState: 1, db: {} },
}));

jest.mock('../config/env', () => ({
  nodeEnv: 'production',
  clientUrl: 'https://app.example.com',
  cookieSecure: true,
  csrfEnabled: true,
  smtp: { host: 'smtp.example.com', user: 'mailer', pass: 'configured' },
}));

jest.mock('../models/Article', () => ({ countDocuments: jest.fn().mockResolvedValue(3) }));
jest.mock('../models/AIProvider', () => ({ countDocuments: jest.fn().mockResolvedValue(1) }));
jest.mock('../models/SearchIndex', () => ({ countDocuments: jest.fn().mockResolvedValue(8) }));

const mockLoadMigrations = jest.fn(() => [{ name: '001-one' }, { name: '002-two' }]);
const mockGetApplied = jest.fn(async () => new Set(['001-one', '002-two']));
jest.mock('../migrations/MigrationRunner', () => jest.fn().mockImplementation(() => ({
  loadMigrations: mockLoadMigrations,
  getApplied: mockGetApplied,
})));

const mockMediaCapability = jest.fn(() => ({
  providerConfigured: true,
  signedDeliveryAvailable: true,
  malwareScanningAvailable: true,
}));
jest.mock('../learn/mediaProviderService', () => ({ capability: mockMediaCapability }));

const mockDurationCatalog = jest.fn(() => [{ priceConfigured: true, checkoutAvailable: true }]);
jest.mock('../premium/catalog', () => ({ getPublicDurationCatalog: mockDurationCatalog }));

jest.mock('../services/governanceService', () => ({
  isVaultEnabled: jest.fn(() => true),
  getVaultKey: jest.fn(() => Buffer.alloc(32)),
}));
jest.mock('../cache/cacheManager', () => ({ capability: () => ({ driver: 'redis', available: true, distributed: true }) }));
jest.mock('../queue/queueManager', () => ({ capability: () => ({ driver: 'durable', available: true, durable: true, distributed: true }) }));
jest.mock('../storage/StorageFactory', () => ({ capability: () => ({ driver: 'object', available: true, shared: true }) }));

const LaunchReadinessService = require('../services/launchReadinessService');

describe('launch evidence honesty', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadMigrations.mockReturnValue([{ name: '001-one' }, { name: '002-two' }]);
    mockGetApplied.mockResolvedValue(new Set(['001-one', '002-two']));
    mockDurationCatalog.mockReturnValue([{ priceConfigured: true, checkoutAvailable: true }]);
    mockMediaCapability.mockReturnValue({
      providerConfigured: true,
      signedDeliveryAvailable: true,
      malwareScanningAvailable: true,
    });
  });

  it('returns ready only when every recorded configuration check passes', async () => {
    const report = await LaunchReadinessService.runReadinessAudit();

    expect(report.status).toBe('ready');
    expect(report.readinessScore).toBe(100);
    expect(report.evidenceSource).toBe('live_configuration_and_database');
    expect(report.checks.every((entry) => entry.passed)).toBe(true);
  });

  it('fails closed when critical migration and provider evidence is unavailable', async () => {
    mockGetApplied.mockResolvedValue(new Set(['001-one']));
    mockDurationCatalog.mockReturnValue([{ priceConfigured: false, checkoutAvailable: false }]);
    mockMediaCapability.mockReturnValue({
      providerConfigured: false,
      signedDeliveryAvailable: false,
      malwareScanningAvailable: false,
    });

    const report = await LaunchReadinessService.runReadinessAudit();

    expect(report.status).toBe('blocked');
    expect(report.readinessScore).toBeLessThan(100);
    expect(report.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: 'Migration status', passed: false, critical: true }),
      expect.objectContaining({ name: 'Premium checkout provider', passed: false, critical: true }),
      expect.objectContaining({ name: 'Protected media delivery', passed: false, critical: true }),
    ]));
  });

  it('contains no sample-record creation or embedded administrator credentials', () => {
    const root = path.join(__dirname, '..');
    const controller = fs.readFileSync(path.join(root, 'controllers', 'launchController.js'), 'utf8');
    const scripts = ['bootstrapAdmin.js', 'resetAdminPassword.js', 'verifyApis.js', 'verifyPhase4A.js', 'verifyPhase4B.js']
      .map((file) => fs.readFileSync(path.join(root, 'scripts', file), 'utf8'))
      .join('\n');

    expect(controller).not.toMatch(/\.create\s*\(/);
    expect(controller).not.toMatch(/Simulated|Sample Baseline/);
    expect(scripts).not.toMatch(/Password123!|admin@myjourney\.com/);
    expect(scripts).not.toMatch(/csrfToken\.substring|Cookies:/);
  });
});
