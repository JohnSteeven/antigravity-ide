'use strict';

const express = require('express');
const request = require('supertest');
const ActivityLog = require('../models/ActivityLog');
const AuditLogger = require('../audit/AuditLogger');
const { requestContext } = require('../middleware/requestContext');
const { errorHandler, handleValidation } = require('../middleware/errorHandler');

describe('privacy-safe request observability', () => {
  afterEach(() => jest.restoreAllMocks());

  it('correlates requests while logging only route templates and hashed users', async () => {
    const info = jest.spyOn(console, 'info').mockImplementation(() => {});
    const app = express();
    app.use(requestContext);
    app.use(express.json());
    app.post('/account/:id', (req, res) => {
      req.user = { _id: 'private-user-id' };
      res.json({ ok: true });
    });

    const res = await request(app)
      .post('/account/private-record?resetToken=private-token')
      .set('Cookie', 'refreshToken=private-cookie')
      .set('X-Request-Id', 'not-a-valid-id')
      .send({ email: 'private@example.com', password: 'private-password' });

    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/i);
    const eventText = info.mock.calls.map((call) => call.join(' ')).join('\n');
    const event = JSON.parse(info.mock.calls[0][0]);
    expect(event).toMatchObject({ event: 'request_complete', method: 'POST', route: '/account/:id', statusCode: 200 });
    expect(event.userHash).toHaveLength(20);
    expect(eventText).not.toMatch(/private-user-id|private-record|private-token|private-cookie|private@example\.com|private-password/);
  });

  it('logs internal errors without messages, stacks, values, or raw paths', async () => {
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {});
    const app = express();
    app.use(requestContext);
    app.get('/failure/:id', () => {
      const error = new Error('private@example.com private-token');
      error.stack = 'private-stack-value';
      throw error;
    });
    app.use(errorHandler);

    const res = await request(app).get('/failure/private-record?password=private-password');

    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({ message: 'Something went wrong. Please try again.', requestId: expect.any(String) });
    const logText = errorLog.mock.calls.map((call) => call.join(' ')).join('\n');
    expect(logText).toMatch(/request_error|request_complete/);
    expect(logText).not.toMatch(/private@example\.com|private-token|private-stack-value|private-record|private-password/);
  });

  it('does not echo rejected input values in validation responses', async () => {
    const app = express();
    app.use(requestContext);
    app.use(express.json());
    const validationResult = () => ({
      isEmpty: () => false,
      array: () => [{ type: 'field', location: 'body', path: 'password', msg: 'Invalid value.', value: 'private-password' }],
    });
    app.post('/validate', handleValidation(validationResult), (_req, res) => res.json({ ok: true }));

    const res = await request(app).post('/validate').send({ password: 'private-password' });

    expect(res.status).toBe(422);
    expect(res.body.errors[0]).not.toHaveProperty('value');
    expect(JSON.stringify(res.body)).not.toContain('private-password');
  });

  it('redacts sensitive nested fields before ActivityLog validation and diffing', async () => {
    const log = new ActivityLog({
      action: 'SETTING_UPDATE',
      description: 'Updated configuration',
      newValue: {
        settings: { apiKey: 'private-api-key', nested: { body: 'private body' } },
        publicLabel: 'Visible label',
      },
    });

    await log.validate();

    expect(log.newValue.settings.apiKey).toBe('[REDACTED]');
    expect(log.newValue.settings.nested.body).toBe('[REDACTED]');
    expect(log.newValue.publicLabel).toBe('Visible label');
    expect(AuditLogger.computeDiff(
      { passwordHash: 'old-private', title: 'Old' },
      { passwordHash: 'new-private', title: 'New' }
    )).toEqual({
      passwordHash: { before: '[REDACTED]', after: '[REDACTED]' },
      title: { before: 'Old', after: 'New' },
    });
  });
});
