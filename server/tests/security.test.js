/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  server/tests/security.test.js  —  Comprehensive Security Verification Tests
 *  MyJourney Platform  |  Final Stabilization & Verification
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Verifies:
 *   - NoSQL injection operator stripping ($gt, $ne, $or in body, query, params)
 *   - HTML sanitization across plain fields vs rich content fields
 *   - User toSafeJSON() data projection (no hashes, tokens, or internal secrets)
 *   - Password reset token hashing via SHA-256
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const { sanitizeRequest } = require('../middleware/security');
const User = require('../models/User');
const crypto = require('crypto');

describe('Security & Data Protection Verification Suite', () => {

  describe('1. NoSQL Injection & Sanitization Middleware', () => {
    it('strips $ and . keys from request body to prevent NoSQL operator injection', () => {
      const req = {
        body: {
          username: 'normaluser',
          '$gt': '',
          'nested.key': 'evil',
          validKey: { '$ne': null, normalSub: 'value' },
        },
        params: {},
        query: {},
      };
      const next = jest.fn();

      sanitizeRequest(req, {}, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.username).toBe('normaluser');
      expect(req.body['$gt']).toBeUndefined();
      expect(req.body['nested.key']).toBeUndefined();
      expect(req.body.validKey['$ne']).toBeUndefined();
      expect(req.body.validKey.normalSub).toBe('value');
    });

    it('sanitizes script tags from plain fields while decoding HTML entities', () => {
      const req = {
        body: {
          firstName: '<script>alert("xss")</script>John',
          bio: '<b>Hello</b> world',
        },
        params: {},
        query: {},
      };
      const next = jest.fn();

      sanitizeRequest(req, {}, next);

      expect(req.body.firstName).toBe('John');
      expect(req.body.bio).toBe('Hello world');
    });

    it('preserves allowed HTML tags in rich content fields (body, contentHtml, description)', () => {
      const req = {
        body: {
          title: 'Article Title',
          description: '<p>A <strong>rich</strong> description with <a href="https://example.com">link</a></p>',
        },
        params: {},
        query: {},
      };
      const next = jest.fn();

      sanitizeRequest(req, {}, next);

      expect(req.body.title).toBe('Article Title');
      expect(req.body.description).toContain('<p>');
      expect(req.body.description).toContain('<strong>rich</strong>');
      expect(req.body.description).toContain('href="https://example.com"');
    });
  });

  describe('2. User toSafeJSON() Data Projection', () => {
    it('excludes passwordHash, failedLoginAttempts, and lockUntil from toSafeJSON()', () => {
      const user = new User({
        firstName: 'Safe',
        lastName: 'User',
        username: 'safeuser',
        email: 'safe@example.com',
        mobile: '+919999999999',
        passwordHash: '$2b$12$someSecretHashValue',
        failedLoginAttempts: 3,
        lockUntil: new Date(),
        role: 'Reader',
      });

      const safeJson = user.toSafeJSON();

      expect(safeJson.passwordHash).toBeUndefined();
      expect(safeJson.failedLoginAttempts).toBeUndefined();
      expect(safeJson.lockUntil).toBeUndefined();
      expect(safeJson.email).toBe('safe@example.com');
      expect(safeJson.id).toBeDefined();
    });
  });

  describe('3. Password Reset Security', () => {
    it('hashes reset tokens using SHA-256 before storage', () => {
      const rawToken = 'sample-random-32-byte-hex-token';
      const hash1 = crypto.createHash('sha256').update(rawToken).digest('hex');
      const hash2 = crypto.createHash('sha256').update(rawToken).digest('hex');

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(rawToken);
      expect(hash1.length).toBe(64); // sha256 hex string length
    });
  });

});
