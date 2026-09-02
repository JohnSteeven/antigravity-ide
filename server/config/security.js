/**
 * server/config/security.js
 * Single source of truth for all security-related constants.
 * Never hardcode these values across services.
 */

module.exports = {
  // ── Session ────────────────────────────────────────────────────────────────
  SESSION_TIMEOUT_DAYS: 30,
  REMEMBER_ME_DAYS: 90,

  // ── Password ───────────────────────────────────────────────────────────────
  PASSWORD_HISTORY_LIMIT: 5,
  PASSWORD_SALT_ROUNDS: 12,
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_LOCK_MINUTES: 15,
  CHANGE_PASSWORD_RATE_LIMIT: 3,   // per hour
  FORGOT_PASSWORD_RATE_LIMIT: 5,   // per hour
  PASSWORD_RESET_EXPIRY_MINUTES: 10,

  // ── Delete Account ─────────────────────────────────────────────────────────
  DELETE_ACCOUNT_RECOVERY_DAYS: 7,
  DELETE_CONFIRMATION_PHRASE: "DELETE MY ACCOUNT",

  // ── Two-Factor Authentication ──────────────────────────────────────────────
  TWO_FACTOR_ISSUER: "MyJourney",
  TWO_FACTOR_WINDOW: 1,            // ±1 step tolerance for clock drift
  BACKUP_CODE_COUNT: 10,

  // ── WebAuthn / Passkeys ────────────────────────────────────────────────────
  WEBAUTHN_RP_NAME: "MyJourney",
  WEBAUTHN_RP_ID: process.env.WEBAUTHN_RP_ID || "localhost",
  WEBAUTHN_ORIGIN: process.env.CLIENT_URL || "http://localhost:1234",
  WEBAUTHN_CHALLENGE_TTL_MS: 5 * 60 * 1000,  // 5 minutes

  // ── Security Score Rules ───────────────────────────────────────────────────
  SECURITY_SCORE: {
    PASSWORD_CONFIGURED: 30,
    EMAIL_VERIFIED: 20,
    RECENT_PASSWORD_CHANGE: 20,   // changed within 90 days
    TWO_FACTOR_ENABLED: 20,
    NO_SUSPICIOUS_ACTIVITY: 10,
    // Future additions (reserved, not yet active):
    // PASSKEY_REGISTERED: 5,
    // PHONE_VERIFIED: 5,
    // RISKY_LOGIN_DEDUCTION: -10,
  },

  // ── Session Risk ───────────────────────────────────────────────────────────
  SESSION_RISK: {
    CURRENT: "CURRENT",
    TRUSTED: "TRUSTED",
    NEW_DEVICE: "NEW_DEVICE",
    SUSPICIOUS: "SUSPICIOUS",
  },

  // ── Login History Action Types ─────────────────────────────────────────────
  ACTIONS: {
    LOGIN_SUCCESS: "LOGIN_SUCCESS",
    LOGIN_FAILED: "LOGIN_FAILED",
    LOGOUT: "LOGOUT",
    PASSWORD_CHANGED: "PASSWORD_CHANGED",
    PASSWORD_RESET: "PASSWORD_RESET",
    SESSION_REVOKED: "SESSION_REVOKED",
    ALL_SESSIONS_REVOKED: "ALL_SESSIONS_REVOKED",
    EMAIL_VERIFIED: "EMAIL_VERIFIED",
    TWO_FACTOR_ENABLED: "TWO_FACTOR_ENABLED",
    TWO_FACTOR_DISABLED: "TWO_FACTOR_DISABLED",
    PASSKEY_ADDED: "PASSKEY_ADDED",
    PASSKEY_REMOVED: "PASSKEY_REMOVED",
    ACCOUNT_DELETE_REQUESTED: "ACCOUNT_DELETE_REQUESTED",
    ACCOUNT_DELETE_CANCELLED: "ACCOUNT_DELETE_CANCELLED",
    ACCOUNT_DELETED: "ACCOUNT_DELETED",
    PROFILE_UPDATED: "user_profile_update",
  },
};
