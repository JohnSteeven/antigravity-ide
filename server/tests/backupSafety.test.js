'use strict';

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const backupService = require('../services/backupService');
const backupRepository = require('../repositories/backupRepository');
const activityLogRepository = require('../repositories/activityLogRepository');

describe('Legacy Backup Safety & Production Isolation Suite', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('1. Production Blocking & Feature Gating', () => {
    it('blocks triggerBackup in production when ALLOW_LEGACY_BACKUP_IN_PRODUCTION is not set', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.ALLOW_LEGACY_BACKUP_IN_PRODUCTION;

      await expect(backupService.triggerBackup('admin123')).rejects.toMatchObject({
        status: 403,
        message: expect.stringMatching(/Legacy backup is disabled in production/i),
      });
    });

    it('blocks getBackupFilePath in production when ALLOW_LEGACY_BACKUP_IN_PRODUCTION is not set', async () => {
      process.env.NODE_ENV = 'production';
      delete process.env.ALLOW_LEGACY_BACKUP_IN_PRODUCTION;

      await expect(backupService.getBackupFilePath('backup123')).rejects.toMatchObject({
        status: 403,
        message: expect.stringMatching(/Legacy backup operations are disabled in production/i),
      });
    });

    it('blocks destructive restoreBackup in production unconditionally', async () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOW_LEGACY_BACKUP_IN_PRODUCTION = 'true';

      await expect(backupService.restoreBackup('backup123', 'admin123')).rejects.toMatchObject({
        status: 403,
        message: expect.stringMatching(/Destructive restore using legacy backup is permanently disabled in production/i),
      });
    });
  });

  describe('2. Sensitive Authentication Secret Redaction', () => {
    it('redacts passwordHash, reset tokens, MFA secrets, and backup codes from User documents in backup', async () => {
      process.env.NODE_ENV = 'development';

      const mockUsers = [
        {
          _id: 'user_1',
          username: 'john_doe',
          email: 'john@example.com',
          passwordHash: '$2b$12$superSecretHashVal12345678901234567890',
          passwordResetToken: 'sha256-reset-token-secret',
          passwordResetExpires: new Date(Date.now() + 60000),
          twoFactor: {
            enabled: true,
            secret: 'TOTPSECRET123456',
          },
          backupCodes: [
            { codeHash: 'hashed-code-1' },
            { codeHash: 'hashed-code-2' },
          ],
          passwordHistory: ['$2b$12$oldHash1', '$2b$12$oldHash2'],
          role: 'Reader',
        },
      ];

      const writtenPayloads = [];
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'mkdirSync').mockReturnValue(true);
      jest.spyOn(fs, 'writeFileSync').mockImplementation((filePath, data) => {
        writtenPayloads.push({ filePath, data: JSON.parse(data) });
      });
      jest.spyOn(fs, 'statSync').mockReturnValue({ size: 1024 });

      jest.spyOn(mongoose, 'model').mockImplementation((modelName) => {
        return {
          find: () => ({
            lean: async () => (modelName === 'User' ? mockUsers : []),
          }),
        };
      });

      jest.spyOn(backupRepository, 'create').mockResolvedValue({ _id: 'backup_new', fileName: 'backup-test.json' });
      jest.spyOn(activityLogRepository, 'create').mockResolvedValue(true);

      await backupService.triggerBackup('admin123');

      expect(writtenPayloads.length).toBe(1);
      const dumpedUser = writtenPayloads[0].data.User[0];

      expect(dumpedUser.username).toBe('john_doe');
      expect(dumpedUser.email).toBe('john@example.com');
      expect(dumpedUser.role).toBe('Reader');

      // Assert all sensitive authentication fields are deleted
      expect(dumpedUser.passwordHash).toBeUndefined();
      expect(dumpedUser.passwordResetToken).toBeUndefined();
      expect(dumpedUser.passwordResetExpires).toBeUndefined();
      expect(dumpedUser.twoFactor).toBeUndefined();
      expect(dumpedUser.backupCodes).toBeUndefined();
      expect(dumpedUser.passwordHistory).toBeUndefined();
    });
  });

  describe('3. Path Traversal Defense', () => {
    it('sanitizes filename using path.basename to prevent directory traversal', async () => {
      process.env.NODE_ENV = 'development';

      jest.spyOn(backupRepository, 'findById').mockResolvedValue({
        _id: 'b1',
        fileName: '../../../../etc/passwd',
      });

      const existsSpy = jest.spyOn(fs, 'existsSync').mockImplementation((checkedPath) => {
        expect(checkedPath).not.toContain('..');
        expect(path.basename(checkedPath)).toBe('passwd');
        return true;
      });

      const result = await backupService.getBackupFilePath('b1');
      expect(result.fileName).toBe('passwd');
      expect(result.filePath).not.toContain('..');
      existsSpy.mockRestore();
    });
  });
});
