const request = require('supertest');
const crypto = require('crypto');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../index');
const env = require('../config/env');
const User = require('../models/User');
const GovernanceService = require('../services/governanceService');
const { checkMagicBytes, sanitizeFilename } = require('../middleware/uploadValidation');

jest.setTimeout(20000);

describe('Private Beta Hardening & Security Suite', () => {
  let adminToken;
  let createdAdminId = null;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/myjourney_test_beta');
    }
    let admin = await User.findOne({ role: 'Admin' });
    if (!admin) {
      admin = await User.create({
        firstName: 'Admin',
        lastName: 'Beta',
        username: 'admin_beta_test',
        email: 'admin_beta_test@myjourney.com',
        countryCode: '+91',
        mobile: '+919000000001',
        passwordHash: '$2b$12$e0MYzXy5n79Wn.Zz1234567890123456789012345678901234567890',
        role: 'Admin',
        status: 'ACTIVE',
        tokenVersion: 0,
        verified: { email: true, mobile: true },
      });
      createdAdminId = admin._id;
    }
    adminToken = jwt.sign(
      { sub: String(admin._id), role: admin.role, tokenVersion: admin.tokenVersion || 0 },
      env.jwtAccessSecret,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    const SecretVault = require('../models/SecretVault');
    await SecretVault.deleteMany({ secretKey: { $in: ['KEY_ONE', 'KEY_TWO', 'TAMPER_KEY'] } });
    if (createdAdminId) await User.deleteOne({ _id: createdAdminId });
    await mongoose.disconnect();
  });

  describe('Secret Vault Security & Encryption Tests', () => {
    const originalEnabled = process.env.SECRET_VAULT_ENABLED;
    const originalKey = process.env.SECRET_VAULT_KEY;

    afterEach(() => {
      process.env.SECRET_VAULT_ENABLED = originalEnabled;
      process.env.SECRET_VAULT_KEY = originalKey;
    });

    test('Secret Vault endpoints return 503 when SECRET_VAULT_ENABLED is false or missing', async () => {
      delete process.env.SECRET_VAULT_ENABLED;
      delete process.env.SECRET_VAULT_KEY;

      expect(GovernanceService.isVaultEnabled()).toBe(false);

      const res = await request(app)
        .get('/api/governance/secrets')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(503);
      expect(res.body.error).toBe('Service Unavailable');
    });

    test('Secret Vault throws explicit error when SECRET_VAULT_KEY is invalid or not 32 bytes', () => {
      process.env.SECRET_VAULT_ENABLED = 'true';
      process.env.SECRET_VAULT_KEY = 'short_key';

      expect(() => GovernanceService.getVaultKey()).toThrow(/32 bytes/i);
    });

    test('AES-256-GCM generates unique random IV and ciphertext for identical secret values', async () => {
      process.env.SECRET_VAULT_ENABLED = 'true';
      const validKey = crypto.randomBytes(32).toString('hex'); // 64 hex chars = 32 bytes
      process.env.SECRET_VAULT_KEY = validKey;

      const secretText = 'super_secret_api_credential_99';
      const secretRecord1 = await GovernanceService.setSecret('KEY_ONE', secretText);
      const secretRecord2 = await GovernanceService.setSecret('KEY_TWO', secretText);

      expect(secretRecord1.encryptedValue).not.toEqual(secretRecord2.encryptedValue);
      expect(secretRecord1.encryptedValue.startsWith('v2:')).toBe(true);
      expect(secretRecord2.encryptedValue.startsWith('v2:')).toBe(true);

      const decrypted1 = await GovernanceService.getSecret('KEY_ONE');
      const decrypted2 = await GovernanceService.getSecret('KEY_TWO');

      expect(decrypted1).toEqual(secretText);
      expect(decrypted2).toEqual(secretText);
    });

    test('Tampered ciphertext is rejected by AES-GCM tag verification', async () => {
      process.env.SECRET_VAULT_ENABLED = 'true';
      const validKey = crypto.randomBytes(32).toString('hex');
      process.env.SECRET_VAULT_KEY = validKey;

      await GovernanceService.setSecret('TAMPER_KEY', 'original_value');
      const SecretVault = require('../models/SecretVault');
      const record = await SecretVault.findOne({ secretKey: 'TAMPER_KEY' });

      // Corrupt ciphertext body
      const parts = record.encryptedValue.split(':');
      parts[3] = 'ffff' + parts[3].slice(4);
      record.encryptedValue = parts.join(':');
      await record.save();

      await expect(GovernanceService.getSecret('TAMPER_KEY')).rejects.toThrow();
    });
  });

  describe('File Upload Security & Magic Byte Validation Tests', () => {
    test('Valid JPEG image buffer is recognized by magic bytes', () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
      expect(checkMagicBytes(jpegBuffer, '.jpg')).toBe(true);
      expect(checkMagicBytes(jpegBuffer, '.jpeg')).toBe(true);
    });

    test('Valid PNG image buffer is recognized by magic bytes', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      expect(checkMagicBytes(pngBuffer, '.png')).toBe(true);
    });

    test('Valid PDF document buffer is recognized by magic bytes', () => {
      const pdfBuffer = Buffer.from('%PDF-1.5 test document header content');
      expect(checkMagicBytes(pdfBuffer, '.pdf')).toBe(true);
    });

    test('MIME and magic byte mismatch is rejected', () => {
      const fakeJpegAsTxt = Buffer.from('This is plain text pretending to be a jpeg image.');
      expect(checkMagicBytes(fakeJpegAsTxt, '.jpg')).toBe(false);
    });

    test('HTML and Script content inside text uploads are rejected', () => {
      const htmlPayload = Buffer.from('<html><script>alert("xss")</script></html>');
      expect(checkMagicBytes(htmlPayload, '.txt')).toBe(false);
    });

    test('Original filename sanitization strips special characters and path traversal', () => {
      const unsafe = '../../../etc/passwd<script>.png';
      const sanitized = sanitizeFilename(unsafe);
      expect(sanitized).not.toContain('..');
      expect(sanitized).not.toContain('/');
      expect(sanitized).not.toContain('<');
      expect(sanitized.endsWith('.png')).toBe(true);
    });
  });

  describe('Disabled Private Beta Features Tests (HTTP 503 Verification)', () => {
    test('Payment subscription request returns 503 Service Unavailable without mock URLs', async () => {
      const res = await request(app)
        .post('/api/membership/subscribe')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ planSlug: 'pro', provider: 'stripe' });

      expect(res.status).toBe(503);
      expect(res.body.error).toBe('Service Unavailable');
      expect(JSON.stringify(res.body)).not.toContain('mock');
      expect(JSON.stringify(res.body)).not.toContain('checkout.stripe.com');
    });

    test('Outbound webhook creation returns 503 Service Unavailable', async () => {
      const res = await request(app)
        .post('/api/developer/webhooks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ targetUrl: 'https://example.com/webhook', events: ['article.published'] });

      expect(res.status).toBe(503);
      expect(res.body.error).toBe('Service Unavailable');
      expect(res.body.delivered).not.toBe(true);
    });

    test('GDPR user data export returns 503 Service Unavailable', async () => {
      const res = await request(app)
        .post('/api/governance/compliance/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(503);
      expect(res.body.error).toBe('Service Unavailable');
    });

    test('Multi-tenancy tenant creation returns 503 Service Unavailable', async () => {
      const res = await request(app)
        .post('/api/tenants')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Secondary Site', domain: 'secondary.com' });

      expect(res.status).toBe(503);
      expect(res.body.error).toBe('Service Unavailable');
    });

    test('AI chat returns 503 when no active AI provider is configured', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ query: 'How do I learn React?' });

      expect(res.status).toBe(503);
      expect(res.body.error).toBe('AI Completions Unavailable');
      expect(JSON.stringify(res.body)).not.toContain('To learn **React**');
    });
  });

});
