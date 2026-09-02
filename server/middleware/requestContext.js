'use strict';

const crypto = require('crypto');
const env = require('../config/env');

const REQUEST_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const HEALTH_PATHS = new Set(['/health', '/api/health', '/readiness', '/api/readiness']);

const hashIdentifier = (value) => crypto
  .createHmac('sha256', env.requestLogSalt)
  .update(String(value))
  .digest('hex')
  .slice(0, 20);

const routeTemplate = (req) => {
  const routePath = req.route?.path;
  if (typeof routePath === 'string') return routePath;
  if (Array.isArray(routePath)) return routePath.join('|');
  return 'unmatched';
};

const requestContext = (req, res, next) => {
  const inbound = req.get('x-request-id');
  req.id = REQUEST_ID_PATTERN.test(inbound || '') ? inbound : crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);

  const startedAt = process.hrtime.bigint();
  res.once('finish', () => {
    if (HEALTH_PATHS.has(req.path)) return;

    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const userId = req.user?._id || req.user?.id;
    const event = {
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 500 ? 'error' : (res.statusCode >= 400 ? 'warn' : 'info'),
      service: 'myjourney-api',
      event: 'request_complete',
      requestId: req.id,
      method: req.method,
      route: routeTemplate(req),
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      ...(userId ? { userHash: hashIdentifier(userId) } : {}),
    };
    const writer = event.level === 'error' ? console.error : (event.level === 'warn' ? console.warn : console.info);
    writer(JSON.stringify(event));
  });

  next();
};

module.exports = { hashIdentifier, requestContext, routeTemplate };
