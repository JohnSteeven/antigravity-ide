/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  server/tests/seeder.test.js  —  Unit tests for server/config/seeder.js
 *  MyJourney Platform  |  P0 Stabilization Batch 1B
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  Tests cover:
 *   - bootstrapAdminIfEnabled() guard conditions
 *   - Permission seeding idempotency
 *   - Role seeding uses $setOnInsert (never overwrites)
 *   - No password is ever printed to stdout under any condition
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../models/User');
jest.mock('../models/Permission');
jest.mock('../models/Role');
jest.mock('bcrypt');

const User       = require('../models/User');
const Permission = require('../models/Permission');
const Role       = require('../models/Role');
const bcrypt     = require('bcrypt');

const {
  _bootstrapAdminIfEnabled: bootstrapAdminIfEnabled,
  _buildDefaultRoles:       buildDefaultRoles,
  _defaultPermissions:      defaultPermissions,
} = require('../config/seeder');

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Restore and reset all env vars changed in a test. */
function withEnv(vars, fn) {
  return async () => {
    const saved = {};
    for (const [k, v] of Object.entries(vars)) {
      saved[k] = process.env[k];
      if (v === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = v;
      }
    }
    try {
      await fn();
    } finally {
      for (const [k, v] of Object.entries(saved)) {
        if (v === undefined) {
          delete process.env[k];
        } else {
          process.env[k] = v;
        }
      }
    }
  };
}

// ── Suite: bootstrapAdminIfEnabled ────────────────────────────────────────────

describe('bootstrapAdminIfEnabled()', () => {
  let consoleSpy;
  let consoleWarnSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy     = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  // ── Guard 1: feature disabled by default ─────────────────────────────────

  it('does nothing when BOOTSTRAP_ADMIN_ENABLED is not set',
    withEnv(
      {
        BOOTSTRAP_ADMIN_ENABLED:  undefined,
        BOOTSTRAP_ADMIN_EMAIL:    undefined,
        BOOTSTRAP_ADMIN_PASSWORD: undefined,
      },
      async () => {
        await bootstrapAdminIfEnabled();
        expect(User.exists).not.toHaveBeenCalled();
        expect(User.create).not.toHaveBeenCalled();
      }
    )
  );

  it('does nothing when BOOTSTRAP_ADMIN_ENABLED=false',
    withEnv(
      { BOOTSTRAP_ADMIN_ENABLED: 'false', BOOTSTRAP_ADMIN_EMAIL: 'a@b.com', BOOTSTRAP_ADMIN_PASSWORD: 'ValidPass123!' },
      async () => {
        await bootstrapAdminIfEnabled();
        expect(User.exists).not.toHaveBeenCalled();
        expect(User.create).not.toHaveBeenCalled();
      }
    )
  );

  // ── Guard 2: missing credentials ─────────────────────────────────────────

  it('warns and skips when BOOTSTRAP_ADMIN_EMAIL is missing',
    withEnv(
      { BOOTSTRAP_ADMIN_ENABLED: 'true', BOOTSTRAP_ADMIN_EMAIL: '', BOOTSTRAP_ADMIN_PASSWORD: 'ValidPass123!' },
      async () => {
        await bootstrapAdminIfEnabled();
        expect(User.create).not.toHaveBeenCalled();
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('BOOTSTRAP_ADMIN_EMAIL'));
      }
    )
  );

  it('warns and skips when BOOTSTRAP_ADMIN_PASSWORD is missing',
    withEnv(
      { BOOTSTRAP_ADMIN_ENABLED: 'true', BOOTSTRAP_ADMIN_EMAIL: 'admin@example.com', BOOTSTRAP_ADMIN_PASSWORD: '' },
      async () => {
        await bootstrapAdminIfEnabled();
        expect(User.create).not.toHaveBeenCalled();
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('BOOTSTRAP_ADMIN_PASSWORD'));
      }
    )
  );

  it('warns and skips when both credentials are missing',
    withEnv(
      { BOOTSTRAP_ADMIN_ENABLED: 'true', BOOTSTRAP_ADMIN_EMAIL: undefined, BOOTSTRAP_ADMIN_PASSWORD: undefined },
      async () => {
        await bootstrapAdminIfEnabled();
        expect(User.create).not.toHaveBeenCalled();
        expect(consoleWarnSpy).toHaveBeenCalled();
      }
    )
  );

  // ── Guard 3: password minimum length ─────────────────────────────────────

  it('warns and skips when password is shorter than 12 characters',
    withEnv(
      { BOOTSTRAP_ADMIN_ENABLED: 'true', BOOTSTRAP_ADMIN_EMAIL: 'admin@example.com', BOOTSTRAP_ADMIN_PASSWORD: 'Short1!' },
      async () => {
        await bootstrapAdminIfEnabled();
        expect(User.create).not.toHaveBeenCalled();
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('12 characters'));
      }
    )
  );

  // ── Guard 4: admin already exists ────────────────────────────────────────

  it('skips creation when an administrator account already exists in the database',
    withEnv(
      { BOOTSTRAP_ADMIN_ENABLED: 'true', BOOTSTRAP_ADMIN_EMAIL: 'admin@example.com', BOOTSTRAP_ADMIN_PASSWORD: 'ValidPass123!' },
      async () => {
        User.exists.mockResolvedValueOnce(true); // anyAdminExists = true

        await bootstrapAdminIfEnabled();

        expect(User.create).not.toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('already exists'));
      }
    )
  );

  // ── Guard 5: target email already taken ──────────────────────────────────

  it('warns and skips when the bootstrap email address is already registered',
    withEnv(
      { BOOTSTRAP_ADMIN_ENABLED: 'true', BOOTSTRAP_ADMIN_EMAIL: 'taken@example.com', BOOTSTRAP_ADMIN_PASSWORD: 'ValidPass123!' },
      async () => {
        User.exists
          .mockResolvedValueOnce(false)  // anyAdminExists = false
          .mockResolvedValueOnce(true);  // emailTaken = true

        await bootstrapAdminIfEnabled();

        expect(User.create).not.toHaveBeenCalled();
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('taken@example.com'));
      }
    )
  );

  // ── Happy path: create admin when all guards pass ─────────────────────────

  it('creates an administrator when all guards pass and no admin exists',
    withEnv(
      { BOOTSTRAP_ADMIN_ENABLED: 'true', BOOTSTRAP_ADMIN_EMAIL: 'admin@example.com', BOOTSTRAP_ADMIN_PASSWORD: 'ValidPass123!' },
      async () => {
        User.exists
          .mockResolvedValueOnce(false)  // anyAdminExists = false
          .mockResolvedValueOnce(false)  // emailTaken = false
          .mockResolvedValueOnce(false); // usernameTaken = false

        bcrypt.hash.mockResolvedValue('$2b$12$hashedpassword');
        User.create.mockResolvedValue({ _id: 'mock-id' });

        await bootstrapAdminIfEnabled();

        expect(bcrypt.hash).toHaveBeenCalledTimes(1);
        expect(User.create).toHaveBeenCalledTimes(1);

        const createArg = User.create.mock.calls[0][0];
        expect(createArg.email).toBe('admin@example.com');
        expect(createArg.role).toBe('Admin');
        expect(createArg.status).toBe('ACTIVE');
        expect(createArg.verified.email).toBe(true);
      }
    )
  );

  // ── Security: password is never printed ──────────────────────────────────

  it('never logs the plaintext password to console.log under any condition',
    withEnv(
      { BOOTSTRAP_ADMIN_ENABLED: 'true', BOOTSTRAP_ADMIN_EMAIL: 'admin@example.com', BOOTSTRAP_ADMIN_PASSWORD: 'ValidPass123!' },
      async () => {
        User.exists
          .mockResolvedValueOnce(false)
          .mockResolvedValueOnce(false)
          .mockResolvedValueOnce(false);

        bcrypt.hash.mockResolvedValue('$2b$12$hashedpassword');
        User.create.mockResolvedValue({ _id: 'mock-id' });

        await bootstrapAdminIfEnabled();

        const allLoggedMessages = consoleSpy.mock.calls
          .flat()
          .concat(consoleWarnSpy.mock.calls.flat())
          .join(' ');

        expect(allLoggedMessages).not.toContain('ValidPass123!');
      }
    )
  );

  it('never logs the plaintext password even when bootstrap is skipped',
    withEnv(
      { BOOTSTRAP_ADMIN_ENABLED: 'true', BOOTSTRAP_ADMIN_EMAIL: 'admin@example.com', BOOTSTRAP_ADMIN_PASSWORD: 'ValidPass123!' },
      async () => {
        User.exists.mockResolvedValueOnce(true); // admin already exists → skip

        await bootstrapAdminIfEnabled();

        const allLoggedMessages = consoleSpy.mock.calls
          .flat()
          .concat(consoleWarnSpy.mock.calls.flat())
          .join(' ');

        expect(allLoggedMessages).not.toContain('ValidPass123!');
      }
    )
  );

  // ── User document shape ───────────────────────────────────────────────────

  it('does not include passwordHash in the console output',
    withEnv(
      { BOOTSTRAP_ADMIN_ENABLED: 'true', BOOTSTRAP_ADMIN_EMAIL: 'admin@example.com', BOOTSTRAP_ADMIN_PASSWORD: 'ValidPass123!' },
      async () => {
        User.exists
          .mockResolvedValueOnce(false)
          .mockResolvedValueOnce(false)
          .mockResolvedValueOnce(false);

        bcrypt.hash.mockResolvedValue('$2b$12$hashedpassword');
        User.create.mockResolvedValue({ _id: 'mock-id' });

        await bootstrapAdminIfEnabled();

        const allLoggedMessages = consoleSpy.mock.calls.flat().join(' ');
        expect(allLoggedMessages).not.toContain('$2b$12$hashedpassword');
      }
    )
  );

  it('stores a bcrypt hash, not the plaintext password, in the User document',
    withEnv(
      { BOOTSTRAP_ADMIN_ENABLED: 'true', BOOTSTRAP_ADMIN_EMAIL: 'admin@example.com', BOOTSTRAP_ADMIN_PASSWORD: 'ValidPass123!' },
      async () => {
        User.exists
          .mockResolvedValueOnce(false)
          .mockResolvedValueOnce(false)
          .mockResolvedValueOnce(false);

        bcrypt.hash.mockResolvedValue('$2b$12$hashedpassword');
        User.create.mockResolvedValue({ _id: 'mock-id' });

        await bootstrapAdminIfEnabled();

        const createArg = User.create.mock.calls[0][0];
        expect(createArg.passwordHash).toBe('$2b$12$hashedpassword');
        expect(createArg.passwordHash).not.toBe('ValidPass123!');
      }
    )
  );

  // ── Username derivation ───────────────────────────────────────────────────

  it('derives the username from the email local-part',
    withEnv(
      { BOOTSTRAP_ADMIN_ENABLED: 'true', BOOTSTRAP_ADMIN_EMAIL: 'john.doe@example.com', BOOTSTRAP_ADMIN_PASSWORD: 'ValidPass123!' },
      async () => {
        User.exists
          .mockResolvedValueOnce(false)
          .mockResolvedValueOnce(false)
          .mockResolvedValueOnce(false);

        bcrypt.hash.mockResolvedValue('hash');
        User.create.mockResolvedValue({});

        await bootstrapAdminIfEnabled();

        const createArg = User.create.mock.calls[0][0];
        expect(createArg.username).toBe('john_doe');
      }
    )
  );

  it('appends _admin to username when the derived username is already taken',
    withEnv(
      { BOOTSTRAP_ADMIN_ENABLED: 'true', BOOTSTRAP_ADMIN_EMAIL: 'admin@example.com', BOOTSTRAP_ADMIN_PASSWORD: 'ValidPass123!' },
      async () => {
        User.exists
          .mockResolvedValueOnce(false)  // anyAdminExists = false
          .mockResolvedValueOnce(false)  // emailTaken = false
          .mockResolvedValueOnce(true);  // usernameTaken = true

        bcrypt.hash.mockResolvedValue('hash');
        User.create.mockResolvedValue({});

        await bootstrapAdminIfEnabled();

        const createArg = User.create.mock.calls[0][0];
        expect(createArg.username).toBe('admin_admin');
      }
    )
  );
});

// ── Suite: buildDefaultRoles ──────────────────────────────────────────────────

describe('buildDefaultRoles()', () => {
  it('returns Admin, Editor, and Reader roles', () => {
    const roles = buildDefaultRoles(['articles.read', 'articles.create']);
    const names = roles.map((r) => r.name);
    expect(names).toContain('Admin');
    expect(names).toContain('Editor');
    expect(names).toContain('Reader');
  });

  it('gives Admin role all permission keys', () => {
    const keys  = ['articles.read', 'articles.create', 'roles.manage'];
    const roles = buildDefaultRoles(keys);
    const admin = roles.find((r) => r.name === 'Admin');
    expect(admin.permissions).toEqual(keys);
  });

  it('marks all roles as isSystem: true', () => {
    const roles = buildDefaultRoles([]);
    roles.forEach((r) => expect(r.isSystem).toBe(true));
  });
});

// ── Suite: defaultPermissions list ────────────────────────────────────────────

describe('defaultPermissions', () => {
  it('contains exactly 21 permission entries', () => {
    expect(defaultPermissions).toHaveLength(21);
  });

  it('every permission has a key, name, and module', () => {
    defaultPermissions.forEach((p) => {
      expect(p.key).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.module).toBeTruthy();
    });
  });

  it('has no duplicate permission keys', () => {
    const keys = defaultPermissions.map((p) => p.key);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });
});

// ── Suite: seedCmsPermissionsAndRoles (integration of steps 1 + 2) ────────────

describe('seedCmsPermissionsAndRoles()', () => {
  let consoleSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy      = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Default: bootstrap disabled (normal startup path)
    delete process.env.BOOTSTRAP_ADMIN_ENABLED;
    delete process.env.BOOTSTRAP_ADMIN_EMAIL;
    delete process.env.BOOTSTRAP_ADMIN_PASSWORD;
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('calls findOneAndUpdate for each permission with upsert:true', async () => {
    Permission.findOneAndUpdate.mockResolvedValue({});
    Role.findOneAndUpdate.mockResolvedValue({});

    const seedCmsPermissionsAndRoles = require('../config/seeder');
    await seedCmsPermissionsAndRoles();

    expect(Permission.findOneAndUpdate).toHaveBeenCalledTimes(21);

    // Verify each call used $set and upsert:true
    Permission.findOneAndUpdate.mock.calls.forEach((call) => {
      const [_filter, update, options] = call;
      expect(update.$set).toBeDefined();
      expect(options.upsert).toBe(true);
    });
  });

  it('calls findOneAndUpdate for each role with $setOnInsert (never overwrites)', async () => {
    Permission.findOneAndUpdate.mockResolvedValue({});
    Role.findOneAndUpdate.mockResolvedValue({});

    const seedCmsPermissionsAndRoles = require('../config/seeder');
    await seedCmsPermissionsAndRoles();

    expect(Role.findOneAndUpdate).toHaveBeenCalledTimes(3);

    // Verify $setOnInsert is used (not $set) — prevents overwriting existing roles
    Role.findOneAndUpdate.mock.calls.forEach((call) => {
      const [_filter, update, options] = call;
      expect(update.$setOnInsert).toBeDefined();
      expect(update.$set).toBeUndefined();
      expect(options.upsert).toBe(true);
    });
  });

  it('does not touch User model during a normal startup (bootstrap disabled)', async () => {
    Permission.findOneAndUpdate.mockResolvedValue({});
    Role.findOneAndUpdate.mockResolvedValue({});

    const seedCmsPermissionsAndRoles = require('../config/seeder');
    await seedCmsPermissionsAndRoles();

    expect(User.exists).not.toHaveBeenCalled();
    expect(User.create).not.toHaveBeenCalled();
    expect(User.findOne).not.toHaveBeenCalled();
  });

  it('logs completion messages for permissions and roles', async () => {
    Permission.findOneAndUpdate.mockResolvedValue({});
    Role.findOneAndUpdate.mockResolvedValue({});

    const seedCmsPermissionsAndRoles = require('../config/seeder');
    await seedCmsPermissionsAndRoles();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('permissions seeded'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('roles seeded'));
  });

  it('catches and logs errors without throwing (server must not crash)', async () => {
    Permission.findOneAndUpdate.mockRejectedValue(new Error('DB connection lost'));

    const seedCmsPermissionsAndRoles = require('../config/seeder');
    await expect(seedCmsPermissionsAndRoles()).resolves.not.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('seeding failed'),
      expect.any(Error)
    );
  });
});
