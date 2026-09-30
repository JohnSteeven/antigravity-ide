'use strict';

const SENSITIVE_KEY_PATTERN = /^(password|passphrase|token|secret|authorization|cookie|session|apikey|api_key|auth_token|otp|signature|privatekey|private_key|creditcard|card_number|cvv|access_token|refresh_token)$/i;
const LIFE_PRIVATE_KEY_PATTERN = /^(journal|journalentry|lifeentry|reflection|mood|moodnote|habitdetails|financedetails|healthrecord)$/i;

const isSensitiveKey = (key) =>
  SENSITIVE_KEY_PATTERN.test(String(key)) || LIFE_PRIVATE_KEY_PATTERN.test(String(key));

const redactValue = (value, depth = 0) => {
  if (depth > 8) return '[MAX_DEPTH]';
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, depth + 1));
  }

  const clean = {};
  for (const [k, v] of Object.entries(value)) {
    if (isSensitiveKey(k)) {
      clean[k] = '[REDACTED]';
    } else if (typeof v === 'object' && v !== null) {
      clean[k] = redactValue(v, depth + 1);
    } else {
      clean[k] = v;
    }
  }
  return clean;
};

class OperationalLogger {
  constructor() {
    this.serviceName = 'myjourney-api';
    this.testSink = null;
  }

  setTestSink(sinkFn) {
    this.testSink = sinkFn;
  }

  clearTestSink() {
    this.testSink = null;
  }

  formatEntry(level, message, meta = {}, error = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message: typeof message === 'string' ? message : String(message),
      ...redactValue(meta),
    };

    if (error) {
      entry.error = {
        name: error.name || 'Error',
        message: error.message || 'Unknown error',
        ...(process.env.NODE_ENV !== 'production' && error.stack ? { stack: error.stack } : {}),
      };
    }

    return entry;
  }

  log(level, message, meta = {}, error = null) {
    const entry = this.formatEntry(level, message, meta, error);
    if (this.testSink) {
      this.testSink(entry);
      return entry;
    }

    const json = JSON.stringify(entry);
    if (level === 'error') {
      console.error(json);
    } else if (level === 'warn') {
      console.warn(json);
    } else if (level === 'debug') {
      if (process.env.LOG_LEVEL === 'debug') console.debug(json);
    } else {
      console.info(json);
    }
    return entry;
  }

  info(message, meta = {}) {
    return this.log('info', message, meta);
  }

  warn(message, meta = {}) {
    return this.log('warn', message, meta);
  }

  error(message, errorOrMeta = null, meta = {}) {
    let err = null;
    let metadata = meta;
    if (errorOrMeta instanceof Error) {
      err = errorOrMeta;
    } else if (errorOrMeta && typeof errorOrMeta === 'object') {
      metadata = { ...errorOrMeta, ...meta };
    }
    return this.log('error', message, metadata, err);
  }

  debug(message, meta = {}) {
    return this.log('debug', message, meta);
  }
}

const operationalLogger = new OperationalLogger();

module.exports = {
  OperationalLogger,
  operationalLogger,
  redactValue,
  isSensitiveKey,
};
