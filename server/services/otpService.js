const bcrypt = require("bcrypt");
const OTP = require("../models/OTP");
const { sendOtpEmail } = require("./emailService");
const { sendOtpSms } = require("./smsService");

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const OTP_RESEND_MS = 60 * 1000;

const generateCode = () =>
  Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join("");

const maskIdentifier = (identifier) => {
  const value = String(identifier || "");
  const [name, domain] = value.split("@");
  if (domain) return `${name.slice(0, 2)}***@${domain}`;
  return value.length > 4 ? `${value.slice(0, 3)}***${value.slice(-2)}` : value;
};

const createOtpChallenge = async ({ user, identifier, channel, purpose }) => {
  const now = Date.now();
  const recentCount = await OTP.countDocuments({
    user: user._id,
    purpose,
    createdAt: { $gte: new Date(now - 10 * 60 * 1000) },
  });

  if (recentCount >= 5) {
    const error = new Error("Too many OTP requests. Please try again later.");
    error.status = 429;
    throw error;
  }

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

  if (channel === "email") {
    await sendOtpEmail({ to: identifier, code, purpose });
  } else {
    await sendOtpSms({ to: identifier, code });
  }

  return {
    id: challenge._id,
    channel,
    purpose,
    maskedIdentifier: maskIdentifier(identifier),
    expiresAt: challenge.expiresAt.getTime(),
    resendAfter: challenge.resendAvailableAt.getTime(),
    message: `OTP sent to ${maskIdentifier(identifier)}.`,
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
    challenge.attempts += 1;
    await challenge.save();
    const error = new Error("Invalid OTP. Please check the code and try again.");
    error.status = 400;
    throw error;
  }

  await OTP.deleteOne({ _id: challenge._id });
  return challenge;
};

module.exports = { createOtpChallenge, resendOtpChallenge, verifyOtpChallenge };
