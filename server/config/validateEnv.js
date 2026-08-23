/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  validateEnv.js  —  Environment Variable Validation
 *  MyJourney CMS  |  Phase -1: CMS Core
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Application fails immediately if required config is missing.
 *  "Fail fast" — catch config problems at startup, not at runtime.
 *
 *  Call once at the top of server/index.js, before anything else.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const REQUIRED = [
  { key: 'MONGO_URI',      description: 'MongoDB connection string' },
  { key: 'JWT_SECRET',     description: 'JWT signing secret (min 32 chars)' },
  { key: 'JWT_REFRESH_SECRET', description: 'JWT refresh token secret' },
];

const OPTIONAL_WITH_DEFAULTS = [
  { key: 'PORT',            default: '5000',    description: 'Server port' },
  { key: 'CLIENT_URL',      default: 'http://localhost:3000', description: 'Frontend URL (for CORS)' },
  { key: 'NODE_ENV',        default: 'development', description: 'Runtime environment' },

  // Cache
  { key: 'CACHE_DRIVER',   default: 'memory',   description: 'Cache driver: memory | redis' },
  { key: 'REDIS_URL',      default: null,        description: 'Redis connection URL (required if CACHE_DRIVER=redis)' },

  // Queue
  { key: 'QUEUE_DRIVER',   default: 'memory',   description: 'Queue driver: memory (other adapters are not implemented)' },

  // Storage
  { key: 'STORAGE_DRIVER', default: 'local',    description: 'Storage driver: local (shared adapters are not implemented)' },

  // Search
  { key: 'SEARCH_DRIVER',  default: 'mongo',    description: 'Search driver: mongo | meilisearch | elasticsearch | algolia' },

  // AI
  { key: 'AI_PROVIDER',    default: null,        description: 'AI provider: openai | claude | gemini | deepseek | local' },

  // Email (optional — warn if missing)
  { key: 'SMTP_HOST',      default: null,        description: 'SMTP server host' },
  { key: 'SMTP_PORT',      default: '587',       description: 'SMTP server port' },
  { key: 'SMTP_USER',      default: null,        description: 'SMTP username' },
  { key: 'SMTP_PASS',      default: null,        description: 'SMTP password' },
];

// Conditional requirements (required only if another env is set)
const CONDITIONAL = [
  { requires: 'CACHE_DRIVER=redis',       key: 'REDIS_URL',          description: 'Required when CACHE_DRIVER=redis' },
  { requires: 'QUEUE_DRIVER=bull',        key: 'REDIS_URL',          description: 'Required when QUEUE_DRIVER=bull' },
  { requires: 'STORAGE_DRIVER=s3',        key: 'AWS_ACCESS_KEY_ID',  description: 'Required when STORAGE_DRIVER=s3' },
  { requires: 'STORAGE_DRIVER=s3',        key: 'AWS_SECRET_ACCESS_KEY', description: 'Required when STORAGE_DRIVER=s3' },
  { requires: 'STORAGE_DRIVER=s3',        key: 'AWS_S3_BUCKET',      description: 'Required when STORAGE_DRIVER=s3' },
  { requires: 'STORAGE_DRIVER=cloudinary',key: 'CLOUDINARY_URL',     description: 'Required when STORAGE_DRIVER=cloudinary' },
  { requires: 'AI_PROVIDER=openai',       key: 'OPENAI_API_KEY',     description: 'Required when AI_PROVIDER=openai' },
  { requires: 'AI_PROVIDER=claude',       key: 'ANTHROPIC_API_KEY',  description: 'Required when AI_PROVIDER=claude' },
  { requires: 'AI_PROVIDER=gemini',       key: 'GEMINI_API_KEY',     description: 'Required when AI_PROVIDER=gemini' },
];

/**
 * Validate all environment variables.
 * Throws on missing required vars.
 * Warns on missing optional vars.
 * Sets defaults where applicable.
 *
 * @param {object} options
 * @param {boolean} options.strict  - If true, throw on any warning (CI/CD mode)
 * @param {boolean} options.silent  - If true, suppress all output
 */
function validateEnv({ strict = false, silent = false } = {}) {
  const errors   = [];
  const warnings = [];
  const defaults = [];

  const log = (level, msg) => {
    if (silent) return;
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️ ' : '✅';
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info'](`[ENV] ${prefix} ${msg}`);
  };

  // ── Check required variables ──────────────────────────────────────────────
  for (const { key, description } of REQUIRED) {
    if (!process.env[key]) {
      errors.push(`${key}: ${description}`);
      log('error', `MISSING required: ${key} — ${description}`);
    }
  }

  // ── JWT secret length check ───────────────────────────────────────────────
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters for security');
    log('error', 'JWT_SECRET is too short (minimum 32 characters)');
  }

  // ── Apply defaults for optional vars ─────────────────────────────────────
  for (const { key, default: def, description } of OPTIONAL_WITH_DEFAULTS) {
    if (!process.env[key]) {
      if (def !== null) {
        process.env[key] = def;
        defaults.push(key);
        log('info', `${key} not set — using default: "${def}"`);
      } else {
        warnings.push(`${key}: ${description}`);
        log('warn', `MISSING optional: ${key} — ${description}`);
      }
    }
  }

  // ── Check conditional requirements ────────────────────────────────────────
  for (const { requires, key, description } of CONDITIONAL) {
    const [envKey, envVal] = requires.split('=');
    if (process.env[envKey] === envVal && !process.env[key]) {
      errors.push(`${key}: ${description}`);
      log('error', `MISSING conditional: ${key} — ${description}`);
    }
  }

  // ── Fail fast on errors ───────────────────────────────────────────────────
  if (errors.length > 0) {
    console.error('\n[ENV] ─────────────────────────────────────────────');
    console.error('[ENV] Application cannot start due to missing configuration:');
    errors.forEach(e => console.error(`[ENV]   • ${e}`));
    console.error('[ENV] Copy .env.example to .env and fill in the values.');
    console.error('[ENV] ─────────────────────────────────────────────\n');
    process.exit(1);
  }

  if (strict && warnings.length > 0) {
    console.error('[ENV] Strict mode: warnings treated as errors.');
    process.exit(1);
  }

  if (!silent) {
    console.info(`[ENV] ✅ Environment validated (${defaults.length} defaults applied, ${warnings.length} warnings)`);
  }
}

module.exports = { validateEnv };
