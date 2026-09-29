'use strict';

const bcrypt = require("bcrypt");
const crypto = require("crypto");

describe("Phase 21 — Email and OTP Foundation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("1. Secure OTP Generation and Hashing", () => {
    const { generateCode, maskIdentifier } = require("../services/otpService");
    const OTP = require("../models/OTP");

    it("generates 6-digit zero-padded cryptographically secure codes", () => {
      const randomSpy = jest.spyOn(crypto, "randomInt").mockReturnValue(7);
      expect(generateCode()).toBe("000007");
      randomSpy.mockRestore();

      for (let i = 0; i < 20; i++) {
        const code = generateCode();
        expect(code).toMatch(/^\d{6}$/);
      }
    });

    it("masks email and mobile identifiers without leaking full addresses", () => {
      expect(maskIdentifier("john.doe@example.com")).toBe("jo***@example.com");
      expect(maskIdentifier("+14155552671")).toBe("+14***71");
      expect(maskIdentifier("")).toBe("");
    });

    it("OTP schema enforces hashed storage and TTL index", () => {
      const otpHashPath = OTP.schema.path("otpHash");
      expect(otpHashPath).toBeDefined();
      expect(otpHashPath.isRequired).toBe(true);

      const expiresAtPath = OTP.schema.path("expiresAt");
      expect(expiresAtPath).toBeDefined();
      expect(expiresAtPath.options.index).toEqual({ expires: 0 });
    });
  });

  describe("2. OTP Lifecycle: Expiry, Replay, Attempt Limits, and Resend", () => {
    let otpService;
    let mockOtp;
    const user = { _id: "64b000000000000000000001" };

    beforeEach(() => {
      jest.resetModules();
      mockOtp = {
        deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
        deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
        create: jest.fn(),
        findById: jest.fn(),
        findOneAndDelete: jest.fn(),
        findOneAndUpdate: jest.fn(),
      };
      jest.doMock("../models/OTP", () => mockOtp);
      jest.doMock("../services/emailService", () => ({
        sendOtpEmail: jest.fn().mockResolvedValue({ delivered: true, provider: "test" }),
      }));
      jest.doMock("../services/smsService", () => ({
        sendOtpSms: jest.fn().mockResolvedValue({ delivered: true, provider: "test" }),
      }));

      otpService = require("../services/otpService");
    });

    it("creates challenge with hashed OTP and never stores plaintext code", async () => {
      mockOtp.create.mockImplementation(async (data) => ({
        _id: "64b000000000000000000002",
        ...data,
      }));

      const challenge = await otpService.createOtpChallenge({
        user,
        identifier: "alice@example.com",
        channel: "email",
        purpose: "register",
      });

      expect(mockOtp.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: user._id,
          identifier: "alice@example.com",
          channel: "email",
          purpose: "register",
          otpHash: expect.stringMatching(/^\$2[aby]?\$\d+\$/),
        })
      );
      // Plaintext code is never returned in production challenge contract
      expect(challenge).not.toHaveProperty("otpHash");
      expect(challenge.maskedIdentifier).toBe("al***@example.com");
    });

    it("rejects expired OTP challenge with 400 OTP_EXPIRED", async () => {
      mockOtp.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: "64b000000000000000000002",
          user,
          expiresAt: new Date(Date.now() - 5000), // Expired 5 seconds ago
          purpose: "register",
        }),
      });

      await expect(
        otpService.verifyOtpChallenge({
          challengeId: "64b000000000000000000002",
          code: "123456",
          purpose: "register",
        })
      ).rejects.toMatchObject({
        status: 400,
        code: "OTP_EXPIRED",
      });
    });

    it("rejects purpose mismatch with 400 OTP_INVALID_PURPOSE", async () => {
      mockOtp.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: "64b000000000000000000002",
          user,
          expiresAt: new Date(Date.now() + 60000),
          purpose: "register",
          attempts: 0,
        }),
      });

      await expect(
        otpService.verifyOtpChallenge({
          challengeId: "64b000000000000000000002",
          code: "123456",
          purpose: "password-reset",
        })
      ).rejects.toMatchObject({
        status: 400,
        code: "OTP_INVALID_PURPOSE",
      });
    });

    it("enforces max attempt limit and locks out with 429 OTP_ATTEMPTS_EXHAUSTED", async () => {
      const otpHash = await bcrypt.hash("654321", 4);
      mockOtp.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: "64b000000000000000000002",
          user,
          expiresAt: new Date(Date.now() + 60000),
          purpose: "register",
          otpHash,
          attempts: 4,
        }),
      });
      // 5th failed attempt increments attempts to 5
      mockOtp.findOneAndUpdate.mockResolvedValue({
        _id: "64b000000000000000000002",
        attempts: 5,
      });

      await expect(
        otpService.verifyOtpChallenge({
          challengeId: "64b000000000000000000002",
          code: "000000", // Wrong code
          purpose: "register",
        })
      ).rejects.toMatchObject({
        status: 429,
        code: "OTP_ATTEMPTS_EXHAUSTED",
      });
    });

    it("atomically consumes challenge on successful verification preventing replay", async () => {
      const otpHash = await bcrypt.hash("123456", 4);
      const challengeDoc = {
        _id: "64b000000000000000000002",
        user,
        expiresAt: new Date(Date.now() + 60000),
        purpose: "register",
        otpHash,
        attempts: 0,
      };

      mockOtp.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(challengeDoc),
      });
      // First verification succeeds and consumes doc
      mockOtp.findOneAndDelete.mockResolvedValueOnce(challengeDoc);
      // Replay attempt fails because doc is already deleted
      mockOtp.findOneAndDelete.mockResolvedValueOnce(null);

      await expect(
        otpService.verifyOtpChallenge({
          challengeId: challengeDoc._id,
          code: "123456",
          purpose: "register",
        })
      ).resolves.toBe(challengeDoc);

      await expect(
        otpService.verifyOtpChallenge({
          challengeId: challengeDoc._id,
          code: "123456",
          purpose: "register",
        })
      ).rejects.toMatchObject({
        status: 400,
        code: "OTP_CHALLENGE_CONSUMED",
      });
    });

    it("resend enforces 60-second cooldown and invalidates old challenge", async () => {
      // 1. Resend before cooldown fails
      mockOtp.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: "64b000000000000000000002",
          user,
          identifier: "alice@example.com",
          channel: "email",
          purpose: "register",
          resendAvailableAt: new Date(Date.now() + 30000), // 30s remaining
          expiresAt: new Date(Date.now() + 120000),
        }),
      });

      await expect(otpService.resendOtpChallenge("64b000000000000000000002")).rejects.toMatchObject({
        status: 429,
        code: "OTP_RESEND_NOT_READY",
      });

      // 2. Resend after cooldown invalidates previous challenge and creates a new one
      mockOtp.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          _id: "64b000000000000000000002",
          user,
          identifier: "alice@example.com",
          channel: "email",
          purpose: "register",
          resendAvailableAt: new Date(Date.now() - 1000), // Cooldown elapsed
          expiresAt: new Date(Date.now() + 120000),
        }),
      });
      mockOtp.findOneAndDelete.mockResolvedValue({ _id: "64b000000000000000000002" });
      mockOtp.create.mockResolvedValue({
        _id: "64b000000000000000000003",
        resendAvailableAt: new Date(Date.now() + 60000),
        expiresAt: new Date(Date.now() + 300000),
      });

      const resent = await otpService.resendOtpChallenge("64b000000000000000000002");
      expect(mockOtp.findOneAndDelete).toHaveBeenCalledWith(
        expect.objectContaining({ _id: "64b000000000000000000002" })
      );
      expect(resent.channel).toBe("email");
    });
  });

  describe("3. Email Provider Abstraction, Templates, and Timeout Handling", () => {
    const {
      TestEmailProvider,
      SmtpEmailProvider,
      EmailProviderError,
    } = require("../services/emailProvider");
    const {
      renderOtpTemplate,
      renderPasswordResetTemplate,
      renderPasswordChangedTemplate,
    } = require("../services/emailTemplates");

    it("TestEmailProvider safely records transactional emails in memory", async () => {
      const provider = new TestEmailProvider();
      const result = await provider.sendMail({
        to: "recipient@example.com",
        subject: "Security Test",
        html: "<p>Test Content</p>",
        text: "Test Content",
      });

      expect(result.delivered).toBe(true);
      expect(result.provider).toBe("test");
      expect(result.messageId).toMatch(/^<test-[0-9a-f]+@myjourney\.local>$/);
      expect(provider.getSentEmails()).toHaveLength(1);

      provider.clearSentEmails();
      expect(provider.getSentEmails()).toHaveLength(0);
    });

    it("handles provider timeout gracefully with 504 status", async () => {
      const provider = new TestEmailProvider();
      provider.simulatedTimeout = true;

      await expect(
        provider.sendMail({
          to: "user@example.com",
          subject: "Timeout Test",
          html: "<p>Timeout</p>",
        })
      ).rejects.toMatchObject({
        status: 504,
        code: "EMAIL_PROVIDER_TIMEOUT",
      });
    });

    it("sanitizes provider error and prevents leaking SMTP passwords", async () => {
      const provider = new SmtpEmailProvider({
        host: "smtp.invalid.domain",
        user: "admin_user",
        pass: "super_secret_smtp_password",
        timeoutMs: 50,
      });

      await expect(
        provider.sendMail({
          to: "user@example.com",
          subject: "Error Test",
          text: "Hello",
        })
      ).rejects.toThrow();

      try {
        await provider.sendMail({ to: "user@example.com", subject: "Error Test", text: "Hello" });
      } catch (err) {
        expect(err.message).not.toContain("super_secret_smtp_password");
        expect(err.code).toBeDefined();
      }
    });

    it("renders branded OTP email template with required security disclaimers", () => {
      const rendered = renderOtpTemplate({
        code: "987654",
        purpose: "register",
        expiryMinutes: 5,
      });

      expect(rendered.subject).toBe("Your MyJourney verification code");
      expect(rendered.html).toContain("987654");
      expect(rendered.html).toContain("5 minutes");
      expect(rendered.html).toContain("Never share this code with anyone");
      expect(rendered.text).toContain("987654");
      expect(rendered.text).toContain("5 minutes");
    });

    it("renders password reset email template with request metadata and 15m expiry", () => {
      const rendered = renderPasswordResetTemplate({
        token: "abcdef123456",
        name: "David",
        requestMeta: { ip: "192.168.1.100", browser: "Chrome", device: "Desktop" },
      });

      expect(rendered.subject).toBe("Reset your MyJourney password");
      expect(rendered.html).toContain("15 minutes");
      expect(rendered.html).toContain("192.168.1.100");
      expect(rendered.html).toContain("abcdef123456");
      expect(rendered.text).toContain("abcdef123456");
    });

    it("renders password changed security alert with immediate action notice", () => {
      const rendered = renderPasswordChangedTemplate({
        name: "David",
        requestMeta: { ip: "192.168.1.100", browser: "Chrome", device: "Desktop" },
      });

      expect(rendered.subject).toBe("Security Alert: Your MyJourney password was changed");
      expect(rendered.html).toContain("Didn't make this change?");
      expect(rendered.text).toContain("Security Alert");
    });
  });

  describe("4. Account Enumeration and Auth Flow Integration", () => {
    it("sendOtp neutralizes enumeration by returning identical fake response for missing users", async () => {
      jest.resetModules();
      const User = {
        findOne: jest.fn().mockResolvedValue(null),
      };
      jest.doMock("../models/User", () => User);
      const authService = require("../services/authService");

      const response = await authService.sendOtp({
        identifier: "nonexistent@example.com",
        channel: "email",
        purpose: "login-otp",
      });

      expect(response).toMatchObject({
        channel: "email",
        purpose: "login-otp",
        maskedIdentifier: "your email",
        message: "If an eligible account exists, an OTP will be sent.",
      });
      expect(response.id).toBeDefined();
    });

    it("verifyOtp activates user and marks email verified for registration", async () => {
      jest.resetModules();
      const mockUser = {
        _id: "64b000000000000000000001",
        status: "PENDING_VERIFICATION",
        verified: { email: false, mobile: false },
        save: jest.fn().mockResolvedValue(true),
      };
      const mockChallenge = {
        _id: "64b000000000000000000002",
        user: mockUser,
        channel: "email",
        purpose: "register",
      };

      jest.doMock("../services/otpService", () => ({
        verifyOtpChallenge: jest.fn().mockResolvedValue(mockChallenge),
      }));
      jest.doMock("../services/tokenService", () => ({
        createAuthSession: jest.fn().mockResolvedValue({ authenticated: true }),
      }));

      const authService = require("../services/authService");
      const result = await authService.verifyOtp(
        { challengeId: "64b000000000000000000002", code: "123456", purpose: "register" },
        {},
        {}
      );

      expect(mockUser.verified.email).toBe(true);
      expect(mockUser.status).toBe("ACTIVE");
      expect(mockUser.save).toHaveBeenCalled();
      expect(result.session).toEqual({ authenticated: true });
    });
  });
});
