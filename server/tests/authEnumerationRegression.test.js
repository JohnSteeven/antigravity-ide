const loadAuthService = ({ user = null, passwordMatches = true, delivery = { delivered: true }, failedAttempts = 1 } = {}) => {
  jest.resetModules();
  const bcrypt = {
    compare: jest.fn().mockResolvedValue(passwordMatches),
    hash: jest.fn().mockResolvedValue('hashed-value'),
  };
  const User = {
    findOne: jest.fn().mockResolvedValue(user),
    findOneAndUpdate: jest.fn().mockResolvedValue({ ...user, failedLoginAttempts: failedAttempts }),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  };
  const emailService = {
    sendPasswordResetEmail: jest.fn().mockResolvedValue(delivery),
    sendPasswordChangedNotificationEmail: jest.fn().mockResolvedValue({ delivered: true }),
  };
  const createAuthSession = jest.fn().mockResolvedValue({ authenticated: true });

  jest.doMock('bcrypt', () => bcrypt);
  jest.doMock('../models/User', () => User);
  jest.doMock('../models/Notification', () => ({ create: jest.fn() }));
  jest.doMock('../models/RefreshToken', () => ({ updateMany: jest.fn() }));
  jest.doMock('../models/Session', () => ({ updateMany: jest.fn() }));
  jest.doMock('../config/env', () => ({ passwordHistoryLimit: 5 }));
  jest.doMock('../services/activityLogService', () => ({ createLog: jest.fn().mockResolvedValue(undefined) }));
  jest.doMock('../services/emailService', () => emailService);
  jest.doMock('../services/otpService', () => ({}));
  jest.doMock('../services/tokenService', () => ({
    clearAuthCookies: jest.fn(),
    createAuthSession,
    hashToken: jest.fn(),
  }));

  return { authService: require('../services/authService'), bcrypt, createAuthSession, emailService, User };
};

describe('authentication enumeration and lockout regressions', () => {
  test('unknown-account login performs a password-hash comparison before the generic denial', async () => {
    const runtime = loadAuthService({ user: null, passwordMatches: false });
    await expect(runtime.authService.login('missing@example.com', 'guess', false, {}, {}))
      .rejects.toMatchObject({ status: 401, message: 'Invalid email/mobile or password.' });
    expect(runtime.bcrypt.compare).toHaveBeenCalledWith('guess', expect.stringMatching(/^\$2b\$12\$/));
  });

  test('password-reset responses are identical for missing accounts and unavailable delivery', async () => {
    const missing = loadAuthService({ user: null });
    const missingResult = await missing.authService.requestPasswordReset('missing@example.com', { headers: {} });

    const account = {
      _id: 'user-1',
      email: 'reader@example.com',
      firstName: 'Reader',
      passwordResetExpires: null,
      save: jest.fn().mockResolvedValue(undefined),
    };
    const unavailable = loadAuthService({ user: account, delivery: { delivered: false } });
    const unavailableResult = await unavailable.authService.requestPasswordReset(account.email, { headers: {} });

    expect(unavailableResult.message).toBe(missingResult.message);
    expect(account.passwordResetToken).toBeUndefined();
    expect(account.passwordResetExpires).toBeUndefined();
  });

  test('an expired temporary lock resets the failure window before login', async () => {
    const user = {
      _id: 'user-1',
      lockUntil: new Date(Date.now() - 1000),
      failedLoginAttempts: 5,
      passwordHash: 'password-hash',
      status: 'ACTIVE',
      isDeleted: false,
      verified: { email: true, mobile: false },
    };
    const runtime = loadAuthService({ user, passwordMatches: true });
    await expect(runtime.authService.login('reader@example.com', 'correct', false, { ip: '127.0.0.1', headers: {} }, {}))
      .resolves.toMatchObject({ session: { authenticated: true } });

    expect(runtime.User.updateOne).toHaveBeenNthCalledWith(
      1,
      { _id: 'user-1', lockUntil: { $lte: expect.any(Date) } },
      { $set: { failedLoginAttempts: 0 }, $unset: { lockUntil: 1 } }
    );
    expect(runtime.createAuthSession).toHaveBeenCalledTimes(1);
  });

  test('the threshold failure returns the locked status immediately', async () => {
    const user = {
      _id: 'user-1',
      lockUntil: null,
      passwordHash: 'password-hash',
      status: 'ACTIVE',
      isDeleted: false,
      verified: { email: true, mobile: false },
    };
    const runtime = loadAuthService({ user, passwordMatches: false, failedAttempts: 5 });
    await expect(runtime.authService.login('reader@example.com', 'wrong', false, {}, {}))
      .rejects.toMatchObject({ status: 423, code: 'ACCOUNT_LOCKED' });
  });
});
