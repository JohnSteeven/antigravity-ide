'use strict';

const SENSITIVE_FIELD = /(password|passwd|passwordhash|token|secret|cookie|authorization|api[_-]?key|otp|pin|cvv|card[_-]?(number|token)|bank[_-]?(account|routing)|journal|health|medical|finance|body|contenthtml|rawcontent|transcript)/i;
const MAX_DEPTH = 5;
const MAX_KEYS = 50;
const MAX_ITEMS = 20;

const redactAuditValue = (value, field = '', depth = 0) => {
  if (SENSITIVE_FIELD.test(field)) return '[REDACTED]';
  if (value == null || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value === 'string') return value.length > 500 ? `${value.slice(0, 500)}[TRUNCATED]` : value;
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return '[BINARY]';
  if (typeof value?.toHexString === 'function') return value.toHexString();
  if (depth >= MAX_DEPTH) return '[MAX_DEPTH]';

  if (Array.isArray(value)) {
    const items = value.slice(0, MAX_ITEMS).map((entry) => redactAuditValue(entry, field, depth + 1));
    if (value.length > MAX_ITEMS) items.push(`[${value.length - MAX_ITEMS} MORE ITEMS]`);
    return items;
  }

  const source = typeof value?.toObject === 'function' ? value.toObject() : value;
  if (source && typeof source === 'object') {
    return Object.entries(source).slice(0, MAX_KEYS).reduce((result, [key, entry]) => {
      result[key] = redactAuditValue(entry, key, depth + 1);
      return result;
    }, {});
  }

  return String(value);
};

module.exports = { redactAuditValue, SENSITIVE_FIELD };
