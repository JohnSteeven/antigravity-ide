const bcrypt = require("bcrypt");
const crypto = require("crypto");

jest.mock("../services/emailService", () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../services/smsService", () => ({
  sendOtpSms: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../models/OTP", () => ({
  countDocuments: jest.fn(),
  deleteMany: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findOneAndDelete: jest.fn(),
  findOneAndUpdate: jest.fn(),
  deleteOne: jest.fn(),
}));

const OTP = require("../models/OTP");
const { sendOtpEmail } = require("../services/emailService");
const { createOtpChallenge, resendOtpChallenge } = require("../services/otpService");

describe("authentication OTP delivery", () => {
  const user = { _id: "64b000000000000000000001" };

  beforeEach(() => {
    jest.clearAllMocks();
    OTP.deleteMany.mockResolvedValue({ deletedCount: 0 });
    OTP.deleteOne.mockResolvedValue({ deletedCount: 1 });
    OTP.findOneAndDelete.mockResolvedValue({ _id: "64b000000000000000000002" });
    OTP.create.mockImplementation(async (input) => ({
      _id: "64b000000000000000000002",
      ...input,
      resendAvailableAt: input.resendAvailableAt,
      expiresAt: input.expiresAt,
    }));
  });

  test("uses a cryptographically secure random integer and zero-pads the code", async () => {
    const randomSpy = jest.spyOn(crypto, "randomInt").mockReturnValue(42);
    const { generateCode } = require("../services/otpService");

    expect(generateCode()).toBe("000042");
    expect(randomSpy).toHaveBeenCalledWith(0, 1_000_000);
  });

  test("sends an email OTP and returns only the development challenge contract", async () => {
    const challenge = await createOtpChallenge({
      user,
      identifier: "reader@example.test",
      channel: "email",
      purpose: "register",
    });

    expect(sendOtpEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: "reader@example.test",
      purpose: "register",
      code: expect.stringMatching(/^\d{6}$/),
    }));
    expect(challenge).toMatchObject({
      id: "64b000000000000000000002",
      channel: "email",
      purpose: "register",
    });
    expect(challenge).not.toHaveProperty("otpHash");
  });

  test("resend preserves the original account, destination, channel, and purpose", async () => {
    OTP.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: "64b000000000000000000002",
        user,
        identifier: "reader@example.test",
        channel: "email",
        purpose: "register",
        resendAvailableAt: new Date(Date.now() - 1000),
        expiresAt: new Date(Date.now() + 60_000),
      }),
    });

    const challenge = await resendOtpChallenge("64b000000000000000000002");

    expect(challenge.channel).toBe("email");
    expect(challenge.purpose).toBe("register");
    expect(sendOtpEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: "reader@example.test",
      purpose: "register",
    }));
  });

  test("rejects resend attempts made before the cooldown expires", async () => {
    OTP.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: "64b000000000000000000002",
        user,
        identifier: "reader@example.test",
        channel: "email",
        purpose: "register",
        resendAvailableAt: new Date(Date.now() + 60_000),
      }),
    });

    await expect(resendOtpChallenge("64b000000000000000000002")).rejects.toMatchObject({
      status: 429,
      code: "OTP_RESEND_NOT_READY",
    });
  });

  test("atomically consumes a valid OTP so replay cannot succeed", async () => {
    const otpHash = await bcrypt.hash("123456", 4);
    const challenge = {
      _id: "64b000000000000000000002",
      user,
      purpose: "login-otp",
      otpHash,
      attempts: 0,
      expiresAt: new Date(Date.now() + 60_000),
    };
    OTP.findById.mockReturnValue({ populate: jest.fn().mockResolvedValue(challenge) });
    OTP.findOneAndDelete.mockResolvedValueOnce(challenge).mockResolvedValueOnce(null);
    const { verifyOtpChallenge } = require("../services/otpService");

    await expect(verifyOtpChallenge({
      challengeId: challenge._id,
      code: "123456",
      purpose: "login-otp",
    })).resolves.toBe(challenge);
    await expect(verifyOtpChallenge({
      challengeId: challenge._id,
      code: "123456",
      purpose: "login-otp",
    })).rejects.toMatchObject({ code: "OTP_CHALLENGE_CONSUMED" });
  });
});

describe("authentication service OTP boundary", () => {
  test("passes the account destination to the OTP service as identifier", async () => {
    jest.resetModules();
    const createChallenge = jest.fn().mockResolvedValue({ id: "challenge" });
    const findOne = jest.fn().mockResolvedValue({
      _id: "64b000000000000000000001",
      email: "reader@example.test",
      mobile: "+911234567890",
    });
    jest.doMock("../models/User", () => ({ findOne }));
    jest.doMock("../services/otpService", () => ({
      createOtpChallenge: createChallenge,
      resendOtpChallenge: jest.fn(),
      verifyOtpChallenge: jest.fn(),
    }));

    const authService = require("../services/authService");
    await authService.sendOtp({
      userId: "64b000000000000000000001",
      channel: "email",
      purpose: "register",
    });

    expect(createChallenge).toHaveBeenCalledWith(expect.objectContaining({
      identifier: "reader@example.test",
      channel: "email",
      purpose: "register",
    }));
  });
});
