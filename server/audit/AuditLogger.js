/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  AuditLogger.js  —  Structured Audit Logging System
 *  MyJourney CMS  |  Phase -1: CMS Core
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Unified enterprise audit logger for tracking entity modifications, security events,
 *  IP address, browser user-agent, and field diffs.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const ActivityLog = require('../models/ActivityLog');

class AuditLogger {
  /**
   * Log an audit event
   *
   * @param {object} params
   * @param {string} params.entity    - Entity type ('article', 'user', 'setting', etc.)
   * @param {string} [params.entityId] - ID of modified record
   * @param {string} params.action    - Action ('create', 'update', 'delete', 'login', 'publish')
   * @param {string} [params.userId]  - User performing action
   * @param {object} [params.before]  - Document snapshot before change
   * @param {object} [params.after]   - Document snapshot after change
   * @param {object} [params.req]     - Express request object (extracts IP & User-Agent)
   * @param {string} [params.details] - Human readable description
   */
  static async log({ entity, entityId = null, action, userId = null, before = null, after = null, req = null, details = '' }) {
    try {
      const diff = (before && after) ? AuditLogger.computeDiff(before, after) : null;

      const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip) : null;
      const userAgent = req ? req.headers['user-agent'] : null;

      const logData = {
        action: `${entity.toUpperCase()}_${action.toUpperCase()}`,
        user: userId || req?.user?.id || null,
        ipAddress: ip,
        userAgent,
        details: details || `${action} on ${entity} ${entityId || ''}`.trim(),
        metadata: {
          entity,
          entityId,
          diff,
        },
      };

      if (ActivityLog) {
        await ActivityLog.create(logData);
      } else {
        console.info('[AuditLog]', JSON.stringify(logData));
      }
    } catch (err) {
      console.error('[AuditLogger] Failed to write audit log:', err.message);
    }
  }

  /**
   * Compute shallow key-by-key diff between two objects
   */
  static computeDiff(before, after) {
    const diff = {};
    const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);

    for (const key of keys) {
      if (['updatedAt', '__v', '_id', 'createdAt'].includes(key)) continue;

      const valBefore = before ? before[key] : undefined;
      const valAfter = after ? after[key] : undefined;

      if (JSON.stringify(valBefore) !== JSON.stringify(valAfter)) {
        diff[key] = { before: valBefore, after: valAfter };
      }
    }

    return Object.keys(diff).length > 0 ? diff : null;
  }
}

module.exports = AuditLogger;
