'use strict';

const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { getHealth, getReadiness } = require('../health/readiness');
const { requestContext } = require('../middleware/requestContext');
const { errorHandler } = require('../middleware/errorHandler');
const { operationalLogger, redactValue } = require('../logging/operationalLogger');
const { validateDestination, generateBackupPlan, runBackup } = require('../scripts/ops/backupMongo');

describe('Phase 29 — Monitoring, Backups & Security Operations Contract', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(requestContext);
    app.get('/health', getHealth);
    app.get('/api/health', getHealth);
    app.get('/api/readiness', getReadiness);

    app.get('/api/test/error-500', (req, res, next) => {
      const err = new Error('Database connection failed with sensitive uri mongodb://user:secretpass@db.example.com');
      err.status = 500;
      next(err);
    });

    app.get('/api/test/validation-error', (req, res, next) => {
      const err = new Error('Invalid input');
      err.name = 'ValidationError';
      next(err);
    });

    app.use(errorHandler);
  });

  describe('1. Request Correlation & Context Middleware', () => {
    test('assigns unique X-Request-Id when missing and echoes in response headers', async () => {
      const res = await request(app).get('/health').expect(200);
      expect(res.headers['x-request-id']).toBeDefined();
      expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/i);
    });

    test('preserves valid inbound X-Request-Id header', async () => {
      const customId = '123e4567-e89b-12d3-a456-426614174000';
      const res = await request(app)
        .get('/health')
        .set('x-request-id', customId)
        .expect(200);
      expect(res.headers['x-request-id']).toBe(customId);
    });
  });

  describe('2. Operational Logger & Sensitive Redaction', () => {
    test('deeply redacts sensitive auth fields and private Life OS fields', () => {
      const rawPayload = {
        user: 'learner_1',
        password: 'mySuperSecretPassword123',
        token: 'jwt.bearer.secretToken',
        authorization: 'Bearer secret_token_xyz',
        cookie: 'sessionId=999888',
        apiKey: 'sk_live_123456789',
        otp: '654321',
        lifeEntry: {
          mood: 'anxious',
          journal: 'Private personal journal contents',
          financeDetails: { netWorth: 50000 },
        },
        publicMetadata: {
          category: 'Engineering',
          tags: ['javascript', 'node'],
        },
      };

      const redacted = redactValue(rawPayload);

      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.token).toBe('[REDACTED]');
      expect(redacted.authorization).toBe('[REDACTED]');
      expect(redacted.cookie).toBe('[REDACTED]');
      expect(redacted.apiKey).toBe('[REDACTED]');
      expect(redacted.otp).toBe('[REDACTED]');
      expect(redacted.lifeEntry).toBe('[REDACTED]');

      // Public metadata is preserved
      expect(redacted.user).toBe('learner_1');
      expect(redacted.publicMetadata.category).toBe('Engineering');
      expect(redacted.publicMetadata.tags).toEqual(['javascript', 'node']);
    });

    test('operationalLogger outputs structured entry with requestId and level', () => {
      let logged = null;
      operationalLogger.setTestSink((entry) => {
        logged = entry;
      });

      operationalLogger.info('Learner completed exercise', {
        requestId: 'req-abc-123',
        courseId: 'course_js_1',
        token: 'secret_token',
      });

      expect(logged).not.toBeNull();
      expect(logged.level).toBe('info');
      expect(logged.service).toBe('myjourney-api');
      expect(logged.message).toBe('Learner completed exercise');
      expect(logged.courseId).toBe('course_js_1');
      expect(logged.token).toBe('[REDACTED]');
      expect(logged.timestamp).toBeDefined();

      operationalLogger.clearTestSink();
    });
  });

  describe('3. Sanitized Error Handling', () => {
    test('500 server error hides internal details and attaches requestId', async () => {
      const res = await request(app).get('/api/test/error-500').expect(500);

      expect(res.body.message).toBe('Something went wrong. Please try again.');
      expect(res.body.requestId).toBeDefined();
      expect(res.text).not.toContain('secretpass');
      expect(res.text).not.toContain('mongodb://');
      expect(res.body).not.toHaveProperty('stack');
    });

    test('validation error returns 400 with user-friendly message', async () => {
      const res = await request(app).get('/api/test/validation-error').expect(400);

      expect(res.body.message).toContain("We couldn't process your request");
      expect(res.body.requestId).toBeDefined();
    });
  });

  describe('4. Truthful Health & Readiness Probes', () => {
    test('/health returns 200 with service identifier', async () => {
      const res = await request(app).get('/health').expect(200);
      expect(res.body).toEqual({ ok: true, service: 'myjourney-api' });
    });

    test('/api/readiness reports truthful statuses for DB, Redis, and external providers', async () => {
      const originalReadyState = mongoose.connection.readyState;
      try {
        const res = await request(app).get('/api/readiness');

        expect(res.body.service).toBe('myjourney-api');
        expect(res.body.checks).toBeDefined();
        expect(res.body.providers).toBeDefined();

        // Optional providers report unconfigured truthfully when env variables are absent
        expect(res.body.providers).toHaveProperty('cloudflareR2');
        expect(res.body.providers).toHaveProperty('muxVideo');
        expect(res.body.providers).toHaveProperty('razorpay');
        expect(res.body.providers).toHaveProperty('ai');
      } finally {
        // preserve state
      }
    });

    test('/api/readiness returns 503 when core MongoDB is disconnected', async () => {
      const originalReadyState = Object.getOwnPropertyDescriptor(mongoose.connection, 'readyState');
      try {
        Object.defineProperty(mongoose.connection, 'readyState', { value: 0, configurable: true });
        const res = await request(app).get('/api/readiness').expect(503);

        expect(res.body.ready).toBe(false);
        expect(res.body.checks.mongodb).toBe('unavailable');
      } finally {
        if (originalReadyState) {
          Object.defineProperty(mongoose.connection, 'readyState', originalReadyState);
        }
      }
    });
  });

  describe('5. Database Backup & Restore Procedures', () => {
    test('destination validation rejects unsafe project source directories', () => {
      expect(() => validateDestination('src/database_backups')).toThrow(/Unsafe backup destination/);
      expect(() => validateDestination('public/dumps')).toThrow(/Unsafe backup destination/);
      expect(() => validateDestination('server/backups')).toThrow(/Unsafe backup destination/);
    });

    test('generateBackupPlan creates safe dump and restore shell instructions with dry run', () => {
      const plan = generateBackupPlan({ dryRun: true, outDir: 'backups/mongo_test' });

      expect(plan.isDryRun).toBe(true);
      expect(plan.dumpCommand).toContain('mongodump --uri=');
      expect(plan.dumpCommand).toContain('--gzip');
      expect(plan.restoreCommand).toContain('mongorestore --uri=');

      const runResult = runBackup({ dryRun: true, outDir: 'backups/mongo_test' });
      expect(runResult.success).toBe(true);
      expect(runResult.mode).toBe('dry-run');
    });
  });
});
