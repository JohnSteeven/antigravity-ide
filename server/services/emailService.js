const nodemailer = require("nodemailer");
const env = require("../config/env");

const hasSmtpConfig = () =>
  Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);

const createTransporter = () =>
  nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass,
    },
  });

const getBaseUrl = () => env.clientUrl || "http://localhost:1234";

const sendOtpEmail = async ({ to, code, purpose }) => {
  const subject = purpose === "password-reset"
    ? "Your MyJourney password reset code"
    : "Your MyJourney verification code";
  const text = `Your MyJourney verification code is ${code}. It expires in 5 minutes.`;

  if (!hasSmtpConfig()) {
    if (env.nodeEnv === "production") {
      const error = new Error("Email OTP delivery is unavailable.");
      error.status = 503;
      error.code = "OTP_DELIVERY_UNAVAILABLE";
      throw error;
    }
    return { delivered: false, provider: "development" };
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: env.smtp.from,
      to,
      subject,
      text,
      html: `<p>Your MyJourney verification code is <strong>${code}</strong>.</p><p>It expires in 5 minutes.</p>`,
    });
    return { delivered: true, provider: "smtp" };
  } catch (error) {
    if (env.nodeEnv === "production") {
      const unavailable = new Error("Email OTP delivery is unavailable.");
      unavailable.status = 503;
      unavailable.code = "OTP_DELIVERY_UNAVAILABLE";
      throw unavailable;
    }
    console.warn("[email:dev] SMTP unavailable for OTP delivery; using the explicit development response code.");
    return { delivered: false, provider: "development" };
  }
};

const getEmailFooter = (token = "") => {
  const baseUrl = getBaseUrl();
  const prefUrl = token ? `${baseUrl}/newsletter/preferences?token=${token}` : `${baseUrl}/contact`;
  const contactUrl = `${baseUrl}/contact`;

  return `
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0;font-size:12px;color:#718096;text-align:center;line-height:1.6">
      <p style="margin:0 0 8px">You received this email because of your subscription preferences on <strong>MyJourney</strong>.</p>
      <p style="margin:0 0 12px">
        <a href="${prefUrl}" target="_blank" style="color:#426c67;text-decoration:underline;margin:0 6px">Manage Preferences</a> &bull;
        <a href="${prefUrl}" target="_blank" style="color:#426c67;text-decoration:underline;margin:0 6px">Unsubscribe</a> &bull;
        <a href="${contactUrl}" target="_blank" style="color:#426c67;text-decoration:underline;margin:0 6px">Contact Support</a>
      </p>
      <p style="margin:0;color:#a0aec0">&copy; 2026 MyJourney. All rights reserved.</p>
    </div>
  `;
};

// ─── Verification Email ────────────────────────────────────────────────────────
const sendVerificationEmail = async ({ to, token }) => {
  const verifyUrl = `${getBaseUrl()}/newsletter/verify?token=${token}`;

  const html = `
    <div style="margin:0;background:#fbfaf7;padding:32px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#2f3133">
      <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e4ded4;border-radius:8px;overflow:hidden">
        <div style="padding:26px 28px;background:#f1eee8">
          <h1 style="margin:0;font-family:Georgia,serif;font-size:28px;color:#2f3133">MyJourney</h1>
          <p style="margin:6px 0 0;color:#666d6d">Newsletter Email Verification</p>
        </div>
        <div style="padding:28px">
          <h2 style="margin:0 0 14px;font-family:Georgia,serif;font-size:22px;color:#2f3133">Confirm Your Subscription</h2>
          <p style="margin:0 0 20px;line-height:1.7;color:#4a5568">
            Please click the button below to verify your email address and complete your subscription to MyJourney.
          </p>
          <div style="margin:24px 0">
            <a href="${verifyUrl}" target="_blank" style="display:inline-block;padding:14px 28px;background:#426c67;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px">
              Verify Email Address →
            </a>
          </div>
          <p style="margin:0;font-size:13px;color:#718096">
            This verification link will expire in 24 hours. If you did not request this, you can safely ignore this email.
          </p>
          ${getEmailFooter(token)}
        </div>
      </div>
    </div>
  `;

  const text = `MyJourney Email Verification\n\nPlease confirm your email address by visiting this link:\n${verifyUrl}\n\nThis link expires in 24 hours.`;

  if (!hasSmtpConfig()) {
    return { delivered: false, provider: "unavailable" };
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: env.smtp.from,
      to,
      subject: "Confirm your MyJourney newsletter subscription",
      html,
      text,
    });
    console.info("[emailService] Verification email dispatched.");
    return { delivered: true, provider: "smtp" };
  } catch (err) {
    console.error("[emailService] Verification email dispatch failed.");
    if (env.nodeEnv === "production") throw err;
    return { delivered: false, provider: "unavailable" };
  }
};

// ─── Already Subscribed Email ─────────────────────────────────────────────────
const sendAlreadySubscribedEmail = async ({ to }) => {
  const html = `
    <div style="margin:0;background:#fbfaf7;padding:32px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#2f3133">
      <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e4ded4;border-radius:8px;overflow:hidden">
        <div style="padding:26px 28px;background:#f1eee8">
          <h1 style="margin:0;font-family:Georgia,serif;font-size:28px;color:#2f3133">MyJourney</h1>
        </div>
        <div style="padding:28px">
          <h2 style="margin:0 0 14px;font-family:Georgia,serif;font-size:20px;color:#2f3133">You're Already Subscribed!</h2>
          <p style="margin:0 0 16px;line-height:1.7;color:#4a5568">
            Your email address <strong>${to}</strong> is already active and verified on MyJourney. You will continue to receive our latest updates.
          </p>
          ${getEmailFooter()}
        </div>
      </div>
    </div>
  `;

  const text = `MyJourney\n\nYou are already subscribed with email ${to}. You will continue to receive updates.`;

  if (!hasSmtpConfig()) {
    console.info('[email:dev] Already-subscribed notification suppressed because SMTP is unavailable.');
    return;
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject: "You're already subscribed to MyJourney",
    html,
    text,
  });
};

// ─── Welcome Email ─────────────────────────────────────────────────────────────
const sendWelcomeSubscriberEmail = async ({ to, token }) => {
  const baseUrl = getBaseUrl();
  const html = `
    <div style="margin:0;background:#fbfaf7;padding:32px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#2f3133">
      <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e4ded4;border-radius:8px;overflow:hidden">
        <div style="padding:26px 28px;background:#426c67;color:#ffffff">
          <h1 style="margin:0;font-family:Georgia,serif;font-size:28px;color:#ffffff">MyJourney</h1>
          <p style="margin:6px 0 0;color:#d8ebe7;font-size:14px">Welcome to our community</p>
        </div>
        <div style="padding:28px">
          <h2 style="margin:0 0 14px;font-family:Georgia,serif;font-size:22px;color:#2f3133">Subscription Verified!</h2>
          <p style="margin:0 0 16px;line-height:1.7;color:#4a5568">
            Thank you for confirming your email address. You will now receive occasional stories, reflections, popular articles, and personal development notes directly in your inbox.
          </p>
          <div style="margin:24px 0">
            <a href="${baseUrl}" target="_blank" style="display:inline-block;padding:12px 24px;background:#426c67;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">
              Explore Stories →
            </a>
          </div>
          ${getEmailFooter(token)}
        </div>
      </div>
    </div>
  `;

  const text = `Welcome to MyJourney!\n\nYour subscription is verified. You will receive stories and updates.\nVisit: ${baseUrl}`;

  if (!hasSmtpConfig()) {
    console.info('[email:dev] Welcome notification suppressed because SMTP is unavailable.');
    return;
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject: "Welcome to MyJourney — Subscription Verified",
    html,
    text,
  });
};

// ─── New Article Notification ────────────────────────────────────────────────
const sendNewArticleNotificationEmail = async ({ to, article, token }) => {
  const baseUrl = getBaseUrl();
  const articleUrl = `${baseUrl}/articles/${article.slug}`;

  const html = `
    <div style="margin:0;background:#fbfaf7;padding:32px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#2f3133">
      <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e4ded4;border-radius:8px;overflow:hidden">
        <div style="padding:26px 28px;background:#426c67;color:#fff">
          <h1 style="margin:0;font-family:Georgia,serif;font-size:28px;color:#fff">MyJourney</h1>
          <p style="margin:6px 0 0;color:#d8ebe7;font-size:14px">New Story Published</p>
        </div>
        ${
          article.coverImage
            ? `<img src="${article.coverImage}" alt="${article.title}" style="width:100%;max-height:240px;object-fit:cover" />`
            : ""
        }
        <div style="padding:28px">
          <span style="display:inline-block;padding:4px 10px;background:#eef6f5;color:#426c67;border-radius:4px;font-size:12px;font-weight:600;text-transform:uppercase;margin-bottom:12px">
            ${article.category || "Story"}
          </span>
          <h2 style="margin:0 0 12px;font-family:Georgia,serif;font-size:24px;color:#1a202c">${article.title}</h2>
          <p style="margin:0 0 20px;line-height:1.7;color:#4a5568;font-size:15px">
            ${article.description || article.excerpt || "Read the latest update published on MyJourney."}
          </p>
          <a href="${articleUrl}" target="_blank" style="display:inline-block;padding:12px 24px;background:#426c67;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">
            Read Article →
          </a>
          ${getEmailFooter(token)}
        </div>
      </div>
    </div>
  `;

  const text = `New Story Published: ${article.title}\n\n${article.description || ""}\n\nRead here: ${articleUrl}`;

  if (!hasSmtpConfig()) {
    console.info('[email:dev] New-article notification suppressed because SMTP is unavailable.');
    return;
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject: `New Post on MyJourney: ${article.title}`,
    html,
    text,
  });
};

// ─── Campaign Broadcast ───────────────────────────────────────────────────────
const sendCampaignEmail = async ({ to, campaign, token }) => {
  const html = `
    <div style="margin:0;background:#fbfaf7;padding:32px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#2f3133">
      <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e4ded4;border-radius:8px;overflow:hidden">
        <div style="padding:26px 28px;background:#426c67;color:#fff">
          <h1 style="margin:0;font-family:Georgia,serif;font-size:28px;color:#fff">MyJourney</h1>
          <p style="margin:6px 0 0;color:#d8ebe7;font-size:14px">Newsletter Broadcast</p>
        </div>
        <div style="padding:28px">
          <h2 style="margin:0 0 12px;font-family:Georgia,serif;font-size:24px;color:#1a202c">${campaign.title}</h2>
          <div style="margin:0 0 20px;line-height:1.7;color:#4a5568;font-size:15px;white-space:pre-wrap">
            ${campaign.body}
          </div>
          ${getEmailFooter(token)}
        </div>
      </div>
    </div>
  `;

  const text = `${campaign.title}\n\n${campaign.body.replace(/<[^>]+>/g, "")}`;

  if (!hasSmtpConfig()) {
    console.info('[email:dev] Campaign notification suppressed because SMTP is unavailable.');
    return;
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject: campaign.subject || campaign.title,
    html,
    text,
  });
};

// ─── Password Reset Link Email ────────────────────────────────────────────────
const sendPasswordResetEmail = async ({ to, token, name, requestMeta = {} }) => {
  const baseUrl = getBaseUrl();
  const resetUrl = `${baseUrl}/reset-password/${token}`;
  const ip = requestMeta.ip || "Unknown IP";
  const browser = requestMeta.browser || "Web Browser";
  const device = requestMeta.device || "Unknown Device";
  const time = requestMeta.time || new Date().toUTCString();

  const html = `
    <div style="margin:0;background:#fbfaf7;padding:32px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#2f3133">
      <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e4ded4;border-radius:8px;overflow:hidden">
        <div style="padding:26px 28px;background:#2f3133;color:#fff">
          <h1 style="margin:0;font-family:Georgia,serif;font-size:26px;color:#fff">MyJourney</h1>
          <p style="margin:4px 0 0;color:#cbd5e1;font-size:13px">Security & Account Recovery</p>
        </div>
        <div style="padding:28px">
          <h2 style="margin:0 0 12px;font-family:Georgia,serif;font-size:22px;color:#1a202c">Reset Your Password</h2>
          <p style="margin:0 0 16px;line-height:1.7;color:#4a5568">
            Hello ${name || "there"},
          </p>
          <p style="margin:0 0 20px;line-height:1.7;color:#4a5568">
            We received a request to reset your password for your <strong>MyJourney</strong> account. Click the button below to set a new password:
          </p>
          <div style="margin:24px 0;text-align:center">
            <a href="${resetUrl}" target="_blank" style="display:inline-block;padding:14px 32px;background:#c05621;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;box-shadow:0 4px 12px rgba(192,86,33,0.25)">
              Reset Password →
            </a>
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:14px 16px;margin:20px 0;font-size:12px;color:#64748b;line-height:1.6">
            <strong style="color:#334155;display:block;margin-bottom:4px">Request Details:</strong>
            • <strong>Time:</strong> ${time}<br/>
            • <strong>Browser & Device:</strong> ${browser} (${device})<br/>
            • <strong>IP Address:</strong> ${ip}
          </div>
          <p style="margin:0 0 16px;font-size:13px;color:#ef4444;font-weight:600">
            ⏰ Note: This password reset link will expire in 15 minutes and can only be used once.
          </p>
          <p style="margin:0 0 20px;font-size:13px;color:#718096">
            If you did not request a password reset, please ignore this email or contact support immediately if you suspect unauthorized activity.
          </p>
          ${getEmailFooter()}
        </div>
      </div>
    </div>
  `;

  const text = `MyJourney Password Reset\n\nHello ${name || "there"},\n\nReset your password by visiting this link:\n${resetUrl}\n\nThis link expires in 15 minutes.\n\nRequest Details:\nIP: ${ip}\nDevice: ${device}\nBrowser: ${browser}\nTime: ${time}`;

  if (!hasSmtpConfig()) {
    return { delivered: false, provider: "unavailable" };
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject: "Reset your MyJourney password",
    html,
    text,
  });
  return { delivered: true, provider: "smtp" };
};

// ─── Password Changed Notification Email ─────────────────────────────────────
const sendPasswordChangedNotificationEmail = async ({ to, name, requestMeta = {} }) => {
  const baseUrl = getBaseUrl();
  const contactUrl = `${baseUrl}/contact`;
  const ip = requestMeta.ip || "Unknown IP";
  const browser = requestMeta.browser || "Web Browser";
  const device = requestMeta.device || "Unknown Device";
  const time = requestMeta.time || new Date().toUTCString();

  const html = `
    <div style="margin:0;background:#fbfaf7;padding:32px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#2f3133">
      <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e4ded4;border-radius:8px;overflow:hidden">
        <div style="padding:26px 28px;background:#2f3133;color:#fff">
          <h1 style="margin:0;font-family:Georgia,serif;font-size:26px;color:#fff">MyJourney</h1>
          <p style="margin:4px 0 0;color:#cbd5e1;font-size:13px">Security Alert</p>
        </div>
        <div style="padding:28px">
          <h2 style="margin:0 0 12px;font-family:Georgia,serif;font-size:22px;color:#1a202c">Password Updated Successfully</h2>
          <p style="margin:0 0 16px;line-height:1.7;color:#4a5568">
            Hello ${name || "there"},
          </p>
          <p style="margin:0 0 20px;line-height:1.7;color:#4a5568">
            This is a security confirmation that your password for <strong>MyJourney</strong> was successfully changed.
          </p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:14px 16px;margin:20px 0;font-size:12px;color:#64748b;line-height:1.6">
            <strong style="color:#334155;display:block;margin-bottom:4px">Security Details:</strong>
            • <strong>Time:</strong> ${time}<br/>
            • <strong>Browser & Device:</strong> ${browser} (${device})<br/>
            • <strong>IP Address:</strong> ${ip}
          </div>
          <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:6px;padding:14px 16px;margin:20px 0;font-size:13px;color:#9f1239">
            <strong>Didn't make this change?</strong><br/>
            If you did not reset your password, your account may be compromised. Please <a href="${contactUrl}" style="color:#9f1239;font-weight:700;text-decoration:underline">contact our security team immediately</a>.
          </div>
          ${getEmailFooter()}
        </div>
      </div>
    </div>
  `;

  const text = `MyJourney Security Alert: Your password was successfully changed.\n\nTime: ${time}\nIP: ${ip}\nDevice: ${device}\nBrowser: ${browser}\n\nIf you did not request this, please contact support immediately: ${contactUrl}`;

  if (!hasSmtpConfig()) {
    return { delivered: false, provider: "unavailable" };
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject: "Security Alert: Your MyJourney password was changed",
    html,
    text,
  });
  return { delivered: true, provider: "smtp" };
};

const handlers = {
  verification: sendVerificationEmail,
  alreadySubscribed: sendAlreadySubscribedEmail,
  welcome: sendWelcomeSubscriberEmail,
  newArticle: sendNewArticleNotificationEmail,
  campaign: sendCampaignEmail,
  passwordReset: sendPasswordResetEmail,
  passwordChanged: sendPasswordChangedNotificationEmail,
};

module.exports = {
  handlers,
  sendOtpEmail,
  sendVerificationEmail,
  sendAlreadySubscribedEmail,
  sendWelcomeSubscriberEmail,
  sendNewArticleNotificationEmail,
  sendCampaignEmail,
  sendPasswordResetEmail,
  sendPasswordChangedNotificationEmail,
};
