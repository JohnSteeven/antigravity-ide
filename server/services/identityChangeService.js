const bcrypt = require("bcrypt");
const crypto = require("crypto");
const speakeasy = require("speakeasy");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const Session = require("../models/Session");
const IdentityChangeChallenge = require("../models/IdentityChangeChallenge");
const activityLogService = require("./activityLogService");
const emailService = require("./emailService");
const smsService = require("./smsService");
const { createAuthSession } = require("./tokenService");
const env = require("../config/env");
const {
  isValidE164,
  isValidEmail,
  maskIdentifier,
  normalizeE164,
  normalizeEmail,
} = require("../utils/accountIdentity");

const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_RESENDS = 3;

const errorWith = (message, status, code) => Object.assign(new Error(message), { status, code });
const createCode = () => crypto.randomInt(100000, 1000000).toString();

const serializeChallenge = (challenge, delivery, devCode) => ({
  id: challenge._id.toString(),
  kind: challenge.kind,
  maskedIdentifier: maskIdentifier(challenge.kind, challenge.proposedIdentifier),
  expiresAt: new Date(challenge.expiresAt).getTime(),
  resendAfter: new Date(challenge.resendAvailableAt).getTime(),
  resendsRemaining: Math.max(0, MAX_RESENDS - Number(challenge.resendCount || 0)),
  delivery: {
    delivered: Boolean(delivery?.delivered),
    provider: delivery?.provider || "unavailable",
  },
  message: delivery?.delivered
    ? `A verification code was sent to ${maskIdentifier(challenge.kind, challenge.proposedIdentifier)}.`
    : "Delivery is not configured in this development environment.",
  ...(env.nodeEnv !== "production" && devCode ? { devCode } : {}),
});

const createIdentityChangeService = (dependencies = {}) => {
  const deps = {
    User: dependencies.User || User,
    RefreshToken: dependencies.RefreshToken || RefreshToken,
    Session: dependencies.Session || Session,
    Challenge: dependencies.Challenge || IdentityChangeChallenge,
    activityLog: dependencies.activityLog || activityLogService,
    email: dependencies.email || emailService,
    sms: dependencies.sms || smsService,
    createSession: dependencies.createSession || createAuthSession,
    now: dependencies.now || (() => new Date()),
    code: dependencies.code || createCode,
    compare: dependencies.compare || bcrypt.compare,
    hash: dependencies.hash || ((value) => bcrypt.hash(value, 12)),
    verifyTotp: dependencies.verifyTotp || ((options) => speakeasy.totp.verify(options)),
  };

  const normalizeProposed = (kind, value) => {
    if (kind === "email") {
      const normalized = normalizeEmail(value);
      if (!isValidEmail(normalized)) throw errorWith("Enter a valid email address.", 422, "IDENTITY_INVALID");
      return normalized;
    }
    if (kind === "mobile") {
      const normalized = normalizeE164(value);
      if (!isValidE164(normalized)) {
        throw errorWith("Enter a mobile number in international E.164 format, such as +14155552671.", 422, "IDENTITY_INVALID");
      }
      return normalized;
    }
    throw errorWith("Identity type must be email or mobile.", 422, "IDENTITY_INVALID");
  };

  const findChallenge = (userId, challengeId) => deps.Challenge.findOne({
    _id: challengeId,
    user: userId,
  }).select("+currentIdentifier +proposedIdentifier +otpHash");

  const ensureAvailable = async (kind, proposed, userId) => {
    const conflict = await deps.User.findOne({
      [kind]: proposed,
      _id: { $ne: userId },
    }).select("_id").lean();
    if (conflict) throw errorWith(`That ${kind} is already in use.`, 409, "IDENTITY_CONFLICT");
  };

  const reauthenticate = async (userId, reauth = {}) => {
    const user = await deps.User.findOne({ _id: userId, isDeleted: false, status: "ACTIVE" })
      .select("passwordHash +twoFactor.secret email mobile twoFactor.enabled");
    if (!user) throw errorWith("Account is unavailable.", 403, "ACCOUNT_UNAVAILABLE");

    const credential = String(reauth.credential || "");
    if (reauth.method === "password") {
      if (!credential || !await deps.compare(credential, user.passwordHash)) {
        throw errorWith("Your password was not accepted.", 401, "REAUTH_FAILED");
      }
    } else if (reauth.method === "totp") {
      if (!user.twoFactor?.enabled || !user.twoFactor?.secret) {
        throw errorWith("Authenticator reauthentication is unavailable for this account.", 503, "REAUTH_METHOD_UNAVAILABLE");
      }
      const valid = deps.verifyTotp({ secret: user.twoFactor.secret, encoding: "base32", token: credential, window: 1 });
      if (!valid) throw errorWith("The authenticator code was not accepted.", 401, "REAUTH_FAILED");
    } else {
      throw errorWith("Choose password or authenticator reauthentication.", 422, "REAUTH_METHOD_INVALID");
    }
    return user;
  };

  const deliver = async (kind, identifier, code) => {
    try {
      if (kind === "email") return await deps.email.sendOtpEmail({ to: identifier, code, purpose: "identity-change" });
      return await deps.sms.sendOtpSms({ to: identifier, code, purpose: "identity-change" });
    } catch (_error) {
      throw errorWith("Verification delivery is unavailable. Your account was not changed.", 424, "OTP_DELIVERY_UNAVAILABLE");
    }
  };

  return {
    async start(userId, input) {
      const proposed = normalizeProposed(input.kind, input.value);
      const user = await reauthenticate(userId, input.reauth);
      const current = String(user[input.kind] || "");
      const normalizedCurrent = input.kind === "email" ? normalizeEmail(current) : normalizeE164(current);
      if (proposed === normalizedCurrent) throw errorWith(`Enter a different ${input.kind}.`, 409, "IDENTITY_UNCHANGED");
      await ensureAvailable(input.kind, proposed, userId);

      const now = deps.now();
      const code = deps.code();
      const challenge = await deps.Challenge.findOneAndUpdate(
        { user: userId, kind: input.kind },
        {
          $set: {
            currentIdentifier: current,
            proposedIdentifier: proposed,
            otpHash: await deps.hash(code),
            attempts: 0,
            resendCount: 0,
            reauthMethod: input.reauth.method,
            reauthenticatedAt: now,
            lastSentAt: now,
            resendAvailableAt: new Date(now.getTime() + RESEND_COOLDOWN_MS),
            expiresAt: new Date(now.getTime() + CHALLENGE_TTL_MS),
          },
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      ).select("+proposedIdentifier");

      try {
        return serializeChallenge(challenge, await deliver(input.kind, proposed, code), code);
      } catch (error) {
        await deps.Challenge.deleteOne({ _id: challenge._id, user: userId });
        throw error;
      }
    },

    async resend(userId, challengeId) {
      const now = deps.now();
      const code = deps.code();
      const challenge = await deps.Challenge.findOneAndUpdate(
        {
          _id: challengeId,
          user: userId,
          expiresAt: { $gt: now },
          resendAvailableAt: { $lte: now },
          resendCount: { $lt: MAX_RESENDS },
          attempts: { $lt: MAX_ATTEMPTS },
        },
        {
          $set: {
            otpHash: await deps.hash(code),
            lastSentAt: now,
            resendAvailableAt: new Date(now.getTime() + RESEND_COOLDOWN_MS),
          },
          $inc: { resendCount: 1 },
        },
        { new: true, runValidators: true }
      ).select("+proposedIdentifier");

      if (!challenge) {
        const existing = await findChallenge(userId, challengeId);
        if (!existing) throw errorWith("Identity-change challenge was not found.", 404, "IDENTITY_CHALLENGE_NOT_FOUND");
        if (new Date(existing.expiresAt) <= now) throw errorWith("The verification code has expired.", 410, "IDENTITY_CHALLENGE_EXPIRED");
        if (Number(existing.attempts) >= MAX_ATTEMPTS) throw errorWith("Too many incorrect code attempts.", 429, "IDENTITY_ATTEMPTS_EXHAUSTED");
        if (Number(existing.resendCount) >= MAX_RESENDS) throw errorWith("The resend limit has been reached.", 429, "IDENTITY_RESENDS_EXHAUSTED");
        throw errorWith("Please wait before requesting another code.", 429, "IDENTITY_RESEND_COOLDOWN");
      }

      try {
        return serializeChallenge(challenge, await deliver(challenge.kind, challenge.proposedIdentifier, code), code);
      } catch (error) {
        await deps.Challenge.deleteOne({ _id: challenge._id, user: userId });
        throw error;
      }
    },

    async cancel(userId, challengeId) {
      const result = await deps.Challenge.deleteOne({ _id: challengeId, user: userId });
      if (!result.deletedCount) throw errorWith("Identity-change challenge was not found.", 404, "IDENTITY_CHALLENGE_NOT_FOUND");
      return { message: "Identity change cancelled." };
    },

    async verify(userId, challengeId, code, req, res) {
      const now = deps.now();
      const challenge = await findChallenge(userId, challengeId);
      if (!challenge) throw errorWith("Identity-change challenge was not found.", 404, "IDENTITY_CHALLENGE_NOT_FOUND");
      if (new Date(challenge.expiresAt) <= now) {
        await deps.Challenge.deleteOne({ _id: challenge._id, user: userId });
        throw errorWith("The verification code has expired.", 410, "IDENTITY_CHALLENGE_EXPIRED");
      }
      if (Number(challenge.attempts) >= MAX_ATTEMPTS) {
        throw errorWith("Too many incorrect code attempts.", 429, "IDENTITY_ATTEMPTS_EXHAUSTED");
      }

      if (!await deps.compare(String(code || ""), challenge.otpHash)) {
        const updated = await deps.Challenge.findOneAndUpdate(
          { _id: challenge._id, user: userId, attempts: { $lt: MAX_ATTEMPTS } },
          { $inc: { attempts: 1 } },
          { new: true }
        );
        const exhausted = Number(updated?.attempts || MAX_ATTEMPTS) >= MAX_ATTEMPTS;
        throw errorWith(
          exhausted ? "Too many incorrect code attempts." : "The verification code was not accepted.",
          exhausted ? 429 : 401,
          exhausted ? "IDENTITY_ATTEMPTS_EXHAUSTED" : "IDENTITY_CODE_INVALID"
        );
      }

      await ensureAvailable(challenge.kind, challenge.proposedIdentifier, userId);
      let updatedUser;
      try {
        updatedUser = await deps.User.findOneAndUpdate(
          {
            _id: userId,
            isDeleted: false,
            status: "ACTIVE",
            [challenge.kind]: challenge.currentIdentifier,
          },
          {
            $set: {
              [challenge.kind]: challenge.proposedIdentifier,
              [`verified.${challenge.kind}`]: true,
            },
            $inc: { tokenVersion: 1 },
          },
          { new: true, runValidators: true }
        );
      } catch (error) {
        if (error?.code !== 11000) throw error;
        await deps.Challenge.deleteOne({ _id: challenge._id, user: userId });
        throw errorWith(`That ${challenge.kind} is already in use.`, 409, "IDENTITY_CONFLICT");
      }

      if (!updatedUser) {
        await deps.Challenge.deleteOne({ _id: challenge._id, user: userId });
        throw errorWith("Account identity changed before this challenge completed. Start again.", 409, "IDENTITY_CHALLENGE_STALE");
      }

      await deps.Challenge.deleteMany({ user: userId });
      await Promise.all([
        deps.RefreshToken.updateMany({ user: userId, revokedAt: null }, { $set: { revokedAt: now } }),
        deps.Session.updateMany({ user: userId, isActive: true }, { $set: { isActive: false } }),
      ]);
      const session = await deps.createSession({ user: updatedUser, req, res, remember: false });

      await deps.activityLog.createLog({
        userId,
        action: `account_${challenge.kind}_change`,
        description: `Changed account ${challenge.kind} from ${maskIdentifier(challenge.kind, challenge.currentIdentifier)} to ${maskIdentifier(challenge.kind, challenge.proposedIdentifier)}.`,
        resourceType: "account_identity",
        resourceId: String(userId),
        module: "security",
        status: "success",
        ipAddress: req?.ip,
        userAgent: req?.headers?.["user-agent"],
      }).catch(() => {});

      return {
        user: updatedUser,
        session,
        message: `${challenge.kind === "email" ? "Email address" : "Mobile number"} updated. Other sessions were signed out.`,
      };
    },
  };
};

module.exports = {
  CHALLENGE_TTL_MS,
  MAX_ATTEMPTS,
  MAX_RESENDS,
  RESEND_COOLDOWN_MS,
  createIdentityChangeService,
  identityChangeService: createIdentityChangeService(),
};
