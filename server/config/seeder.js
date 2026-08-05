/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  server/config/seeder.js  —  CMS Startup Seeder
 *  MyJourney Platform
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Runs on every startup via connectDb(). Performs three tasks:
 *
 *  1. Seed default permissions (idempotent upsert).
 *  2. Seed default system roles (idempotent, $setOnInsert — never overwrites).
 *  3. Optionally bootstrap a first administrator account, controlled
 *     entirely by environment variables (opt-in, disabled by default).
 *
 *  ADMINISTRATOR BOOTSTRAP RULES
 *  ──────────────────────────────
 *  This block is DISABLED by default.
 *  To enable it for a fresh installation set in .env:
 *
 *    BOOTSTRAP_ADMIN_ENABLED=true
 *    BOOTSTRAP_ADMIN_EMAIL=your-admin@example.com
 *    BOOTSTRAP_ADMIN_PASSWORD=<strong-password-min-12-chars>
 *
 *  Behavior when enabled:
 *  - Skips silently if any administrator account already exists in the DB.
 *  - Creates one administrator document using the env credentials.
 *  - Never resets, unlocks, re-verifies, or reassigns an existing user.
 *  - Never prints any password to stdout or logs.
 *  - Exits with a warning (not a crash) if required env vars are absent.
 *
 *  Once the first admin has been created, set BOOTSTRAP_ADMIN_ENABLED=false
 *  (or remove it) so this block never runs again.
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

const Permission = require('../models/Permission');
const Role = require('../models/Role');

// ── 1. Default Permissions ────────────────────────────────────────────────────

const defaultPermissions = [
  { key: 'articles.create',      name: 'Create Articles',          module: 'articles'     },
  { key: 'articles.read',        name: 'Read Articles',            module: 'articles'     },
  { key: 'articles.update',      name: 'Update Articles',          module: 'articles'     },
  { key: 'articles.delete',      name: 'Delete Articles',          module: 'articles'     },
  { key: 'articles.publish',     name: 'Publish Articles',         module: 'articles'     },
  { key: 'articles.archive',     name: 'Archive Articles',         module: 'articles'     },
  { key: 'categories.manage',    name: 'Manage Categories',        module: 'categories'   },
  { key: 'tags.manage',          name: 'Manage Tags',              module: 'tags'         },
  { key: 'media.upload',         name: 'Upload Media',             module: 'media'        },
  { key: 'media.delete',         name: 'Delete Media',             module: 'media'        },
  { key: 'comments.moderate',    name: 'Moderate Comments',        module: 'comments'     },
  { key: 'users.manage',         name: 'Manage Users',             module: 'users'        },
  { key: 'roles.manage',         name: 'Manage Roles',            module: 'roles'        },
  { key: 'permissions.manage',   name: 'Manage Permissions',       module: 'permissions'  },
  { key: 'settings.manage',      name: 'Manage Settings',          module: 'settings'     },
  { key: 'analytics.view',       name: 'View Analytics',           module: 'analytics'    },
  { key: 'seo.manage',           name: 'Manage SEO',               module: 'seo'          },
  { key: 'navigation.manage',    name: 'Manage Navigation',        module: 'navigation'   },
  { key: 'newsletter.manage',    name: 'Manage Newsletters',       module: 'newsletter'   },
  { key: 'backup.manage',        name: 'Manage Backups',           module: 'backup'       },
  { key: 'system.manage',        name: 'Manage System Settings',   module: 'system'       },
];

// ── 2. Default Roles ──────────────────────────────────────────────────────────

function buildDefaultRoles(allPermissionKeys) {
  return [
    {
      name: 'Admin',
      description: 'System Administrator with full system control.',
      permissions: allPermissionKeys,
      isSystem: true,
    },
    {
      name: 'Editor',
      description: 'Content Editor who can write, publish, manage content and categories.',
      permissions: [
        'articles.create',
        'articles.read',
        'articles.update',
        'articles.delete',
        'articles.publish',
        'articles.archive',
        'categories.manage',
        'tags.manage',
        'media.upload',
        'media.delete',
        'comments.moderate',
        'analytics.view',
        'seo.manage',
      ],
      isSystem: true,
    },
    {
      name: 'Reader',
      description: 'Standard reader role with read access to public articles and commenting permissions.',
      permissions: ['articles.read'],
      isSystem: true,
    },
  ];
}

// ── 3. Administrator Bootstrap (opt-in, disabled by default) ──────────────────

/**
 * Creates the first administrator account from environment variables.
 * This function is entirely non-destructive: it does nothing if any admin
 * already exists, and it never modifies any existing user document.
 *
 * Required env vars (only read when BOOTSTRAP_ADMIN_ENABLED=true):
 *   BOOTSTRAP_ADMIN_EMAIL     — email address for the new admin account
 *   BOOTSTRAP_ADMIN_PASSWORD  — password for the new admin account (min 12 chars)
 *
 * @returns {Promise<void>}
 */
async function bootstrapAdminIfEnabled() {
  // Guard 1: feature must be explicitly enabled
  if (process.env.BOOTSTRAP_ADMIN_ENABLED !== 'true') {
    return; // silent — this is the normal path on every startup
  }

  const email    = (process.env.BOOTSTRAP_ADMIN_EMAIL    || '').trim();
  const password = (process.env.BOOTSTRAP_ADMIN_PASSWORD || '').trim();

  // Guard 2: both credentials must be supplied
  if (!email || !password) {
    console.warn(
      '[Seeder] BOOTSTRAP_ADMIN_ENABLED=true but BOOTSTRAP_ADMIN_EMAIL or ' +
      'BOOTSTRAP_ADMIN_PASSWORD is not set. Admin bootstrap skipped.'
    );
    return;
  }

  // Guard 3: password minimum length (12 chars)
  if (password.length < 12) {
    console.warn(
      '[Seeder] BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters. ' +
      'Admin bootstrap skipped.'
    );
    return;
  }

  const User   = require('../models/User');
  const bcrypt = require('bcrypt');

  // Guard 4: skip if ANY admin account already exists (regardless of email)
  const anyAdminExists = await User.exists({ role: 'Admin', isDeleted: { $ne: true } });
  if (anyAdminExists) {
    console.log('[Seeder] Admin bootstrap skipped — an administrator account already exists.');
    return;
  }

  // Guard 5: skip if the target email is already registered (any role)
  const emailTaken = await User.exists({ email: email.toLowerCase() });
  if (emailTaken) {
    console.warn(
      `[Seeder] Admin bootstrap skipped — the email "${email}" is already registered.`
    );
    return;
  }

  // All guards passed — create the bootstrap administrator
  const passwordHash = await bcrypt.hash(password, 12);

  // Derive a safe default username from the email local-part
  const defaultUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);

  // Check username collision (unlikely but possible)
  const usernameTaken = await User.exists({ username: defaultUsername });
  const username = usernameTaken ? `${defaultUsername}_admin` : defaultUsername;

  await User.create({
    firstName:   'Bootstrap',
    lastName:    'Administrator',
    username,
    email:       email.toLowerCase(),
    // mobile is required by the User schema; use a placeholder that the
    // operator must update via the profile settings after first login.
    countryCode: '+00',
    mobile:      `+00-bootstrap-${Date.now()}`,
    passwordHash,
    role:        'Admin',
    status:      'ACTIVE',
    verified: {
      email:  true,
      mobile: false, // operator should verify mobile after first login
    },
    profile: {
      bio: 'Bootstrap administrator. Please update your profile after first login.',
    },
  });

  // Log confirmation WITHOUT the password
  console.log(`[Seeder] Bootstrap administrator created. Email: ${email}`);
  console.log('[Seeder] Set BOOTSTRAP_ADMIN_ENABLED=false once you have logged in.');
}

// ── Main Export ───────────────────────────────────────────────────────────────

const seedCmsPermissionsAndRoles = async () => {
  try {
    // Step 1: Upsert permissions (idempotent)
    for (const p of defaultPermissions) {
      await Permission.findOneAndUpdate(
        { key: p.key },
        { $set: p },
        { upsert: true, new: true }
      );
    }
    console.log('[Seeder] CMS permissions seeded.');

    // Step 2: Upsert roles using $setOnInsert (never overwrites existing roles)
    const allPermissionKeys = defaultPermissions.map((p) => p.key);
    for (const r of buildDefaultRoles(allPermissionKeys)) {
      await Role.findOneAndUpdate(
        { name: r.name },
        { $setOnInsert: r },
        { upsert: true, new: true }
      );
    }
    console.log('[Seeder] CMS roles seeded.');

    // Step 3: Bootstrap admin (opt-in, disabled by default)
    await bootstrapAdminIfEnabled();

  } catch (error) {
    console.error('[Seeder] CMS seeding failed:', error);
  }
};

module.exports = seedCmsPermissionsAndRoles;

// Export the inner function for unit testing
module.exports._bootstrapAdminIfEnabled = bootstrapAdminIfEnabled;
module.exports._buildDefaultRoles       = buildDefaultRoles;
module.exports._defaultPermissions      = defaultPermissions;
