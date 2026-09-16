'use strict';

const bcrypt = require('bcrypt');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const Session = require('../models/Session');
const userRepository = require('../repositories/userRepository');
const activityLogRepository = require('../repositories/activityLogRepository');
const userService = require('../services/userService');
const { PASSWORD_SALT_ROUNDS } = require('../config/security');

describe('Account Reset Security & Password Hash Invariants', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. User Schema passwordHash select: false', () => {
    it('configures User.passwordHash with select: false by default', () => {
      const pathConfig = User.schema.path('passwordHash');
      expect(pathConfig).toBeDefined();
      expect(pathConfig.options.select).toBe(false);
    });

    it('omits passwordHash from default plain queries/objects', () => {
      const user = new User({
        firstName: 'Alice',
        lastName: 'Smith',
        username: 'alicesmith',
        email: 'alice@example.com',
        mobile: '+14155552671',
        passwordHash: '$2b$12$sampleHashedPasswordVal',
      });
      const safe = user.toSafeJSON();
      expect(safe.passwordHash).toBeUndefined();
    });
  });

  describe('2. Admin Password Reset Target-User Authorization', () => {
    const adminTarget = {
      _id: 'admin_target_123',
      username: 'target_admin',
      role: 'Admin',
      tokenVersion: 1,
      save: jest.fn().mockResolvedValue(true),
    };

    const readerTarget = {
      _id: 'reader_target_456',
      username: 'target_reader',
      role: 'Reader',
      tokenVersion: 3,
      save: jest.fn().mockResolvedValue(true),
    };

    const adminActor = {
      _id: 'actor_admin_789',
      username: 'acting_admin',
      role: 'Admin',
    };

    const nonAdminActor = {
      _id: 'actor_operator_999',
      username: 'acting_operator',
      role: 'Operator',
    };

    beforeEach(() => {
      jest.spyOn(RefreshToken, 'updateMany').mockResolvedValue({ modifiedCount: 1 });
      jest.spyOn(Session, 'updateMany').mockResolvedValue({ modifiedCount: 1 });
      jest.spyOn(activityLogRepository, 'create').mockResolvedValue(true);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('rejects non-admin actor attempting to reset an Administrator password with 403', async () => {
      jest.spyOn(userRepository, 'findById').mockImplementation(async (id) => {
        if (id === adminTarget._id) return { ...adminTarget };
        if (id === nonAdminActor._id) return { ...nonAdminActor };
        return null;
      });

      await expect(
        userService.resetPassword(adminTarget._id, 'NewPassword123!', nonAdminActor._id, nonAdminActor)
      ).rejects.toMatchObject({
        status: 403,
        message: expect.stringMatching(/Non-admin users cannot reset an Administrator's password/i),
      });
    });

    it('allows an Administrator to reset another Administrator password', async () => {
      const targetCopy = { ...adminTarget, save: jest.fn().mockResolvedValue(true) };
      jest.spyOn(userRepository, 'findById').mockImplementation(async (id) => {
        if (id === adminTarget._id) return targetCopy;
        if (id === adminActor._id) return { ...adminActor };
        return null;
      });

      const updated = await userService.resetPassword(adminTarget._id, 'NewPassword123!', adminActor._id, adminActor);
      expect(updated).toBeDefined();
      expect(targetCopy.save).toHaveBeenCalled();
      expect(targetCopy.tokenVersion).toBe(2);
      expect(targetCopy.passwordHash).toMatch(/^\$2[ab]\$12\$/);
      expect(RefreshToken.updateMany).toHaveBeenCalledWith({ user: adminTarget._id }, expect.any(Object));
      expect(Session.updateMany).toHaveBeenCalledWith({ user: adminTarget._id }, expect.any(Object));
    });

    it('allows a non-admin actor with management authority to reset a regular (non-admin) user', async () => {
      const targetCopy = { ...readerTarget, save: jest.fn().mockResolvedValue(true) };
      jest.spyOn(userRepository, 'findById').mockImplementation(async (id) => {
        if (id === readerTarget._id) return targetCopy;
        if (id === nonAdminActor._id) return { ...nonAdminActor };
        return null;
      });

      const updated = await userService.resetPassword(readerTarget._id, 'NewPassword123!', nonAdminActor._id, nonAdminActor);
      expect(updated).toBeDefined();
      expect(targetCopy.save).toHaveBeenCalled();
      expect(targetCopy.tokenVersion).toBe(4);
      expect(targetCopy.passwordHash).toMatch(/^\$2[ab]\$12\$/);
    });

    it('throws 404 when target user does not exist', async () => {
      jest.spyOn(userRepository, 'findById').mockResolvedValue(null);

      await expect(
        userService.resetPassword('missing_id', 'NewPassword123!', adminActor._id, adminActor)
      ).rejects.toMatchObject({
        status: 404,
        message: 'User not found.',
      });
    });

    it('uses the shared PASSWORD_SALT_ROUNDS standard (12)', async () => {
      expect(PASSWORD_SALT_ROUNDS).toBe(12);

      const targetCopy = { ...readerTarget, save: jest.fn().mockResolvedValue(true) };
      jest.spyOn(userRepository, 'findById').mockResolvedValue(targetCopy);

      await userService.resetPassword(readerTarget._id, 'Cost12VerifyPass!', adminActor._id, adminActor);
      expect(targetCopy.passwordHash.startsWith('$2b$12$') || targetCopy.passwordHash.startsWith('$2a$12$')).toBe(true);

      const isValid = await bcrypt.compare('Cost12VerifyPass!', targetCopy.passwordHash);
      expect(isValid).toBe(true);
    });
  });
});
