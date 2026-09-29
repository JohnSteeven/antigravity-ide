const nodemailer = require("nodemailer");
const crypto = require("crypto");
const env = require("../config/env");

class EmailProviderError extends Error {
  constructor(message, code = "EMAIL_PROVIDER_ERROR", status = 500) {
    super(message);
    this.name = "EmailProviderError";
    this.code = code;
    this.status = status;
  }
}

/**
 * In-memory test provider to record sent emails during unit/integration tests
 */
class TestEmailProvider {
  constructor() {
    this.sentEmails = [];
    this.simulatedTimeout = false;
    this.simulatedError = null;
  }

  async sendMail(options) {
    if (this.simulatedTimeout) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      throw new EmailProviderError("Email provider request timed out.", "EMAIL_PROVIDER_TIMEOUT", 504);
    }
    if (this.simulatedError) {
      throw this.simulatedError;
    }
    const messageId = `<test-${crypto.randomBytes(8).toString("hex")}@myjourney.local>`;
    const record = { ...options, messageId, sentAt: new Date() };
    this.sentEmails.push(record);
    return {
      delivered: true,
      provider: "test",
      messageId,
    };
  }

  getSentEmails() {
    return [...this.sentEmails];
  }

  clearSentEmails() {
    this.sentEmails = [];
    this.simulatedTimeout = false;
    this.simulatedError = null;
  }
}

/**
 * Development fallback provider when SMTP is not configured
 */
class DevelopmentEmailProvider {
  async sendMail(options) {
    const messageId = `<dev-${crypto.randomBytes(8).toString("hex")}@myjourney.dev>`;
    return {
      delivered: false,
      provider: "development",
      messageId,
      recipient: options.to,
      subject: options.subject,
    };
  }
}

/**
 * Standard SMTP provider backed by nodemailer with configurable timeouts
 */
class SmtpEmailProvider {
  constructor(config = {}) {
    this.config = {
      host: config.host || env.smtp?.host,
      port: Number(config.port || env.smtp?.port || 587),
      secure: Boolean(config.secure !== undefined ? config.secure : env.smtp?.secure),
      user: config.user || env.smtp?.user,
      pass: config.pass || env.smtp?.pass,
      from: config.from || env.smtp?.from || "MyJourney <hello@myjourney.com>",
      timeoutMs: Number(config.timeoutMs || 8000),
    };

    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      auth: {
        user: this.config.user,
        pass: this.config.pass,
      },
      connectionTimeout: this.config.timeoutMs,
      greetingTimeout: this.config.timeoutMs,
      socketTimeout: this.config.timeoutMs,
    });
  }

  async sendMail({ to, subject, html, text, from, messageId }) {
    const mailOptions = {
      from: from || this.config.from,
      to,
      subject,
      html,
      text,
      messageId,
    };

    const timeoutPromise = new Promise((_, reject) => {
      const timer = setTimeout(() => {
        reject(new EmailProviderError("Email provider request timed out.", "EMAIL_PROVIDER_TIMEOUT", 504));
      }, this.config.timeoutMs);
      if (typeof timer.unref === "function") timer.unref();
    });

    try {
      const info = await Promise.race([
        this.transporter.sendMail(mailOptions),
        timeoutPromise,
      ]);

      return {
        delivered: true,
        provider: "smtp",
        messageId: info.messageId || messageId || `<smtp-${Date.now()}@myjourney.com>`,
      };
    } catch (err) {
      if (err instanceof EmailProviderError) throw err;

      // Sanitize error to prevent leaking credentials
      const sanitized = new EmailProviderError(
        "Email delivery failed through configured provider.",
        "EMAIL_DELIVERY_FAILED",
        502
      );
      sanitized.originalCode = err.code;
      throw sanitized;
    }
  }
}

// Global test provider instance for test environments
const testProviderInstance = new TestEmailProvider();

const hasSmtpConfig = () =>
  Boolean(env.smtp?.host && env.smtp?.user && env.smtp?.pass);

const getActiveProvider = () => {
  if (process.env.NODE_ENV === "test") {
    return testProviderInstance;
  }
  if (hasSmtpConfig()) {
    return new SmtpEmailProvider();
  }
  if (process.env.NODE_ENV === "production") {
    return {
      sendMail: async () => {
        const error = new EmailProviderError("Email delivery is unavailable.", "OTP_DELIVERY_UNAVAILABLE", 503);
        throw error;
      },
    };
  }
  return new DevelopmentEmailProvider();
};

const sendEmail = async ({ to, subject, html, text, from, timeoutMs, messageId }) => {
  const provider = getActiveProvider();
  return provider.sendMail({ to, subject, html, text, from, timeoutMs, messageId });
};

module.exports = {
  EmailProviderError,
  SmtpEmailProvider,
  TestEmailProvider,
  DevelopmentEmailProvider,
  getActiveProvider,
  hasSmtpConfig,
  sendEmail,
  testProviderInstance,
};
