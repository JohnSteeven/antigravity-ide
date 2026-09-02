const bcrypt = require("bcrypt");
const crypto = require("crypto");
const OTP = require("../models/OTP");
const { sendOtpEmail } = require("./emailService");
const { sendOtpSms } = require("./smsService");

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const OTP_RESEND_MS = 60 * 1000;

const generateCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");

const maskIdentifier = (identifier) => {
  const value = String(identifier || "");
  const [name, domain] = value.split("@");
  if (domain) return `${name.slice(0, 2)}***@${domain}`;
  return value.length > 4 ? `${value.slice(0, 3)}***${value.slice(-2)}` : value;
};

const createOtpChallenge = async ({ user, identifier, channel, purpose }) => {
  const now = Date.now();
  await OTP.deleteMany({ user: user._id, purpose });

  const code = generateCode();
  const challenge = await OTP.create({
    user: user._id,
    identifier,
    channel,
    purpose,
    otpHash: await bcrypt.hash(code, 10),
    resendAvailableAt: new Date(now + OTP_RESEND_MS),
    expiresAt: new Date(now + OTP_EXPIRY_MS),
  });

  let delivery;
  try {
    delivery = channel === "email"
      ? await sendOtpEmail({ to: identifier, code, purpose })
      : await sendOtpSms({ to: identifier, code });
  } catch (error) {
    await OTP.deleteOne({ _id: challenge._id });
    throw error;
  }

  return {
    id: challenge._id,
    channel,
    purpose,
    maskedIdentifier: maskIdentifier(identifier),
    expiresAt: challenge.expiresAt.getTime(),
    resendAfter: challenge.resendAvailableAt.getTime(),
    message: delivery?.delivered === false
      ? "Development OTP generated; no delivery provider is configured."
      : `OTP sent to ${maskIdentifier(identifier)}.`,
    devCode: process.env.NODE_ENV === "production" ? undefined : code,
  };
};

const resendOtpChallenge = async (challengeId) => {
  const challenge = await OTP.findById(challengeId).populate("user");

  if (!challenge || !challenge.user) {
    const error = new Error("OTP challenge was not found. Please start again.");
    error.status = 404;
    error.code = "OTP_CHALLENGE_NOT_FOUND";
    throw error;
  }

  if (challenge.resendAvailableAt.getTime() > Date.now()) {
    const error = new Error("Please wait before requesting another OTP.");
    error.status = 429;
    error.code = "OTP_RESEND_NOT_READY";
    throw error;
  }

  const consumed = await OTP.findOneAndDelete({
    _id: challenge._id,
    resendAvailableAt: { $lte: new Date() },
    expiresAt: { $gt: new Date() },
  });
  if (!consumed) {
    const error = new Error("OTP challenge expired or was already resent. Please request a new code.");
    error.status = 400;
    error.code = "OTP_CHALLENGE_CONSUMED";
    throw error;
  }

  return createOtpChallenge({
    user: challenge.user,
    identifier: challenge.identifier,
    channel: challenge.channel,
    purpose: challenge.purpose,
  });
};

const verifyOtpChallenge = async ({ challengeId, code, purpose }) => {
  const challenge = await OTP.findById(challengeId).populate("user");

  if (!challenge || challenge.expiresAt.getTime() < Date.now()) {
    const error = new Error("OTP challenge expired. Please request a new code.");
    error.status = 400;
    throw error;
  }

  if (challenge.purpose !== purpose) {
    const error = new Error("This OTP cannot be used for the selected action.");
    error.status = 400;
    throw error;
  }

  if (challenge.attempts >= 5) {
    const error = new Error("Too many failed attempts. Please request a new OTP.");
    error.status = 429;
    throw error;
  }

  const isValid = await bcrypt.compare(String(code), challenge.otpHash);
  if (!isValid) {
    const updated = await OTP.findOneAndUpdate(
      {
        _id: challenge._id,
        attempts: { $lt: 5 },
        expiresAt: { $gt: new Date() },
      },
      { $inc: { attempts: 1 } },
      { new: true }
    );
    const error = new Error("Invalid OTP. Please check the code and try again.");
    error.status = updated?.attempts >= 5 ? 429 : 400;
    error.code = updated?.attempts >= 5 ? "OTP_ATTEMPTS_EXHAUSTED" : "OTP_INVALID";
    throw error;
  }

  const consumed = await OTP.findOneAndDelete({
    _id: challenge._id,
    purpose,
    attempts: { $lt: 5 },
    expiresAt: { $gt: new Date() },
  });
  if (!consumed) {
    const error = new Error("OTP challenge expired or was already used. Please request a new code.");
    error.status = 400;
    error.code = "OTP_CHALLENGE_CONSUMED";
    throw error;
  }
  return challenge;
};

module.exports = { createOtpChallenge, generateCode, resendOtpChallenge, verifyOtpChallenge };
