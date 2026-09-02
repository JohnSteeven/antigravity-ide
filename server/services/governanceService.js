/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  governanceService.js  —  Governance, Security Policies & Compliance Service
 *  MyJourney Platform  |  Stage 6 — Phase 28: Enterprise Governance & Compliance
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Organization      = require('../models/Organization');
const IdentityProvider  = require('../models/IdentityProvider');
const SecurityPolicy    = require('../models/SecurityPolicy');
const ComplianceRecord  = require('../models/ComplianceRecord');
const SecretVault       = require('../models/SecretVault');
const crypto            = require('crypto');

class GovernanceService {
  /**
   * Check if Secret Vault is enabled via environment variables.
   */
  static isVaultEnabled() {
    return process.env.SECRET_VAULT_ENABLED === 'true';
  }

  /**
   * Get and validate the 32-byte Secret Vault master key.
   */
  static getVaultKey() {
    if (!GovernanceService.isVaultEnabled()) {
      const err = new Error('Secret Vault is disabled in private beta.');
      err.status = 503;
      throw err;
    }

    const rawKey = process.env.SECRET_VAULT_KEY || '';
    let keyBuffer;

    if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
      keyBuffer = Buffer.from(rawKey, 'hex');
    } else if (Buffer.from(rawKey, 'base64').length === 32) {
      keyBuffer = Buffer.from(rawKey, 'base64');
    } else if (Buffer.from(rawKey, 'utf8').length === 32) {
      keyBuffer = Buffer.from(rawKey, 'utf8');
    }

    if (!keyBuffer || keyBuffer.length !== 32) {
      const err = new Error('Invalid Secret Vault key. SECRET_VAULT_KEY must decode to exactly 32 bytes (256 bits).');
      err.status = 503;
      throw err;
    }

    return keyBuffer;
  }

  /**
   * Process GDPR Data Export request (disabled in private beta).
   */
  static async exportUserData(userId) {
    const err = new Error('GDPR export service is disabled in private beta.');
    err.status = 503;
    throw err;
  }

  /**
   * Encrypt and store secret key in SecretVault using AES-256-GCM with a random 12-byte IV.
   */
  static async setSecret(secretKey, value) {
    if (!secretKey || !value) {
      const err = new Error('secretKey and value are required.');
      err.status = 400;
      throw err;
    }

    const key = GovernanceService.getVaultKey();
    const iv = crypto.randomBytes(12); // 96-bit random IV per NIST SP 800-38D
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    // Format: v2:ivHex:authTagHex:encryptedHex
    const formattedCiphertext = `v2:${iv.toString('hex')}:${authTag}:${encrypted}`;

    return SecretVault.findOneAndUpdate(
      { secretKey },
      {
        encryptedValue: formattedCiphertext,
        encryptionVersion: 'v2',
        lastRotatedAt: new Date(),
        $inc: { version: 1 },
      },
      { upsert: true, new: true }
    );
  }

  /**
   * Decrypt secret from SecretVault.
   */
  static async getSecret(secretKey) {
    const key = GovernanceService.getVaultKey();
    const record = await SecretVault.findOne({ secretKey }).lean();
    if (!record || !record.encryptedValue) return null;

    const parts = record.encryptedValue.split(':');

    // Version 2: AES-256-GCM format -> v2:ivHex:authTagHex:encryptedHex
    if (parts[0] === 'v2' && parts.length === 4) {
      const [, ivHex, tagHex, cipherHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(tagHex, 'hex');

      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    }

    // Legacy Version 1: AES-256-CBC format -> fallback support for legacy data
    if (record.encryptedValue && !record.encryptedValue.startsWith('v2:')) {
      try {
        const legacyKey = Buffer.from('12345678901234567890123456789012');
        const legacyIv = Buffer.from('1234567890123456');
        const decipher = crypto.createDecipheriv('aes-256-cbc', legacyKey, legacyIv);
        let decrypted = decipher.update(record.encryptedValue, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      } catch (e) {
        throw new Error('Legacy secret decryption failed.');
      }
    }

    throw new Error('Unrecognized secret vault encryption format.');
  }
}

module.exports = GovernanceService;
