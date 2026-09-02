/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  configRegistry.js  —  Configuration Registry
 *  MyJourney CMS  |  Phase -1: CMS Core
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Replaces raw process.env access throughout the codebase.
 *  Provides a typed, namespaced, validated config accessor.
 *
 *  Instead of:
 *    process.env.JWT_SECRET
 *    process.env.CACHE_DRIVER
 *    process.env.SMTP_HOST
 *
 *  Use:
 *    config.get('jwt.secret')
 *    config.get('cache.driver')
 *    config.get('smtp.host')
 *    config.get('storage.driver', 'local')  // with fallback
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const env = process.env;

// ── Config Map ────────────────────────────────────────────────────────────────
// Maps dot-notation keys to environment variable names + defaults

const CONFIG_MAP = {
  // Server
  'server.port':        { env: 'PORT',              default: '5000' },
  'server.env':         { env: 'NODE_ENV',           default: 'development' },
  'server.clientUrl':   { env: 'CLIENT_URL',         default: 'http://localhost:3000' },

  // Database
  'db.uri':             { env: 'MONGO_URI',           default: null },

  // JWT
  'jwt.secret':         { env: 'JWT_SECRET',          default: null },
  'jwt.refreshSecret':  { env: 'JWT_REFRESH_SECRET',  default: null },
  'jwt.expiry':         { env: 'JWT_EXPIRY',          default: '15m' },
  'jwt.refreshExpiry':  { env: 'JWT_REFRESH_EXPIRY',  default: '7d' },

  // Cache
  'cache.driver':       { env: 'CACHE_DRIVER',        default: 'memory' },
  'cache.redisUrl':     { env: 'REDIS_URL',            default: null },
  'cache.ttl':          { env: 'CACHE_TTL',            default: '300' },     // seconds

  // Queue
  'queue.driver':       { env: 'QUEUE_DRIVER',         default: 'memory' },

  // Storage
  'storage.driver':     { env: 'STORAGE_DRIVER',       default: 'local' },
  'storage.uploadsDir': { env: 'UPLOADS_DIR',           default: './uploads' },
  'storage.s3Bucket':   { env: 'AWS_S3_BUCKET',         default: null },
  'storage.s3Region':   { env: 'AWS_REGION',            default: 'us-east-1' },
  'storage.s3Key':      { env: 'AWS_ACCESS_KEY_ID',     default: null },
  'storage.s3Secret':   { env: 'AWS_SECRET_ACCESS_KEY', default: null },
  'storage.cloudinaryUrl': { env: 'CLOUDINARY_URL',     default: null },

  // Search
  'search.driver':      { env: 'SEARCH_DRIVER',        default: 'mongo' },
  'search.meiliUrl':    { env: 'MEILISEARCH_URL',       default: 'http://localhost:7700' },
  'search.meiliKey':    { env: 'MEILISEARCH_KEY',       default: null },
  'search.elasticUrl':  { env: 'ELASTICSEARCH_URL',     default: 'http://localhost:9200' },
  'search.algoliaApp':  { env: 'ALGOLIA_APP_ID',        default: null },
  'search.algoliaKey':  { env: 'ALGOLIA_API_KEY',       default: null },

  // Email / SMTP
  'smtp.host':          { env: 'SMTP_HOST',             default: null },
  'smtp.port':          { env: 'SMTP_PORT',             default: '587' },
  'smtp.user':          { env: 'SMTP_USER',             default: null },
  'smtp.pass':          { env: 'SMTP_PASS',             default: null },
  'smtp.from':          { env: 'SMTP_FROM',             default: 'noreply@myjourney.com' },
  'smtp.secure':        { env: 'SMTP_SECURE',           default: 'false' },

  // AI
  'ai.provider':        { env: 'AI_PROVIDER',           default: null },
  'ai.openaiKey':       { env: 'OPENAI_API_KEY',        default: null },
  'ai.claudeKey':       { env: 'ANTHROPIC_API_KEY',     default: null },
  'ai.geminiKey':       { env: 'GEMINI_API_KEY',        default: null },
  'ai.deepseekKey':     { env: 'DEEPSEEK_API_KEY',      default: null },
  'ai.localUrl':        { env: 'LOCAL_LLM_URL',         default: 'http://localhost:11434' },

  // Notifications
  'notify.slackWebhook':   { env: 'SLACK_WEBHOOK_URL',   default: null },
  'notify.discordWebhook': { env: 'DISCORD_WEBHOOK_URL', default: null },

  // Security
  'security.bcryptRounds': { env: 'BCRYPT_ROUNDS',      default: '12' },
  'security.rateLimitWindow': { env: 'RATE_LIMIT_WINDOW', default: '15' },
  'security.rateLimitMax':    { env: 'RATE_LIMIT_MAX',    default: '100' },

  // App
  'app.name':           { env: 'APP_NAME',              default: 'MyJourney' },
  'app.url':            { env: 'APP_URL',               default: 'http://localhost:3000' },
  'app.debug':          { env: 'DEBUG',                 default: 'false' },
};

class ConfigRegistry {
  /**
   * Get a configuration value.
   * @param {string} key        - Dot-notation key (e.g. 'jwt.secret')
   * @param {*}      [fallback] - Default if not found in map or env
   * @returns {string|null}
   */
  get(key, fallback = undefined) {
    const mapping = CONFIG_MAP[key];

    if (mapping) {
      const value = env[mapping.env];
      if (value !== undefined && value !== '') return value;
      if (mapping.default !== null) return mapping.default;
      return fallback ?? null;
    }

    // Direct env access fallback (SCREAMING_SNAKE_CASE)
    const directKey = key.toUpperCase().replace(/\./g, '_');
    return env[directKey] ?? fallback ?? null;
  }

  /**
   * Get a config value as integer.
   */
  getInt(key, fallback = 0) {
    return parseInt(this.get(key, String(fallback)), 10);
  }

  /**
   * Get a config value as boolean.
   */
  getBool(key, fallback = false) {
    const val = this.get(key, String(fallback));
    return val === 'true' || val === '1' || val === 'yes';
  }

  /**
   * Check if a config value is set (non-null, non-empty).
   */
  has(key) {
    const val = this.get(key);
    return val !== null && val !== '';
  }

  /**
   * Get all config for a namespace.
   * config.namespace('smtp') → { host, port, user, pass, from, secure }
   */
  namespace(ns) {
    const result = {};
    for (const [key, mapping] of Object.entries(CONFIG_MAP)) {
      if (key.startsWith(`${ns}.`)) {
        const shortKey = key.slice(ns.length + 1);
        result[shortKey] = this.get(key);
      }
    }
    return result;
  }

  /**
   * Dump all config (for debugging — masks secrets).
   */
  dump() {
    const SECRET_KEYS = ['secret', 'password', 'pass', 'key', 'token'];
    const result = {};
    for (const [key, mapping] of Object.entries(CONFIG_MAP)) {
      const val = this.get(key);
      const isSensitive = SECRET_KEYS.some(s => key.toLowerCase().includes(s));
      result[key] = isSensitive && val ? '***' : val;
    }
    return result;
  }
}

const config = new ConfigRegistry();
module.exports = config;
