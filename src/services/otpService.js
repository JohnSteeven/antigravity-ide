import {
  AUTH_STORAGE_KEYS,
  OTP_EXPIRY_MS,
  OTP_LENGTH,
  OTP_RESEND_MS,
} from "../utils/constants";
import {
  createId,
  createOtp,
  maskIdentifier,
  readStorage,
  writeStorage,
} from "../utils/helpers";

const getOtps = () => readStorage(AUTH_STORAGE_KEYS.otps, []);
const saveOtps = (otps) => writeStorage(AUTH_STORAGE_KEYS.otps, otps);

const sanitizeOtps = () => {
  const now = Date.now();
  const active = getOtps().filter((challenge) => challenge.expiresAt > now);
  saveOtps(active);
  return active;
};

export const otpService = {
  createChallenge({ identifier, channel, purpose, userId, metadata = {} }) {
    const now = Date.now();
    const code = createOtp(OTP_LENGTH);
    const challenge = {
      id: createId("otp"),
      code,
      identifier,
      channel,
      purpose,
      userId,
      metadata,
      attempts: 0,
      createdAt: now,
      lastSentAt: now,
      expiresAt: now + OTP_EXPIRY_MS,
      resendAfter: now + OTP_RESEND_MS,
      maskedIdentifier: maskIdentifier(identifier),
    };

    const active = sanitizeOtps().filter(
      (item) => !(item.userId === userId && item.purpose === purpose)
    );

    saveOtps([challenge, ...active]);
    writeStorage(AUTH_STORAGE_KEYS.currentChallenge, challenge);

    return {
      ...challenge,
      message: `OTP sent to ${challenge.maskedIdentifier}.`,
      devCode: code,
    };
  },

  getChallenge(challengeId) {
    return sanitizeOtps().find((challenge) => challenge.id === challengeId);
  },

  getCurrentChallenge() {
    const challenge = readStorage(AUTH_STORAGE_KEYS.currentChallenge, null);
    if (!challenge) return null;
    return this.getChallenge(challenge.id) || null;
  },

  resendChallenge(challengeId) {
    const active = sanitizeOtps();
    const challenge = active.find((item) => item.id === challengeId);

    if (!challenge) {
      throw new Error("OTP challenge expired. Please request a new code.");
    }

    const now = Date.now();
    if (challenge.resendAfter > now) {
      const waitFor = Math.ceil((challenge.resendAfter - now) / 1000);
      throw new Error(`Please wait ${waitFor} seconds before resending.`);
    }

    const nextCode = createOtp(OTP_LENGTH);
    const updated = {
      ...challenge,
      code: nextCode,
      attempts: 0,
      lastSentAt: now,
      expiresAt: now + OTP_EXPIRY_MS,
      resendAfter: now + OTP_RESEND_MS,
    };

    saveOtps(active.map((item) => (item.id === challengeId ? updated : item)));
    writeStorage(AUTH_STORAGE_KEYS.currentChallenge, updated);

    return {
      ...updated,
      message: `A fresh OTP was sent to ${updated.maskedIdentifier}.`,
      devCode: nextCode,
    };
  },

  verifyChallenge({ challengeId, code, purpose }) {
    const active = sanitizeOtps();
    const challenge = active.find((item) => item.id === challengeId);

    if (!challenge) {
      throw new Error("OTP challenge expired. Please request a new code.");
    }

    if (challenge.purpose !== purpose) {
      throw new Error("This OTP cannot be used for the selected action.");
    }

    if (challenge.attempts >= 5) {
      throw new Error("Too many failed attempts. Please request a new OTP.");
    }

    if (String(code) !== String(challenge.code)) {
      const updated = { ...challenge, attempts: challenge.attempts + 1 };
      saveOtps(active.map((item) => (item.id === challengeId ? updated : item)));
      throw new Error("Invalid OTP. Please check the code and try again.");
    }

    saveOtps(active.filter((item) => item.id !== challengeId));

    return {
      ...challenge,
      verifiedAt: Date.now(),
    };
  },
};
