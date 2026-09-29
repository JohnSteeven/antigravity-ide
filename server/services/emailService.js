const nodemailer = require("nodemailer");
const env = require("../config/env");
const emailProvider = require("./emailProvider");
const {
  getEmailFooter,
  renderOtpTemplate,
  renderPasswordResetTemplate,
  renderPasswordChangedTemplate,
} = require("./emailTemplates");

const hasSmtpConfig = () => emailProvider.hasSmtpConfig();

const createTransporter = () =>
  nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass,
    },
    connectionTimeout: Number(env.smtp?.timeoutMs || 8000),
    greetingTimeout: Number(env.smtp?.timeoutMs || 8000),
    socketTimeout: Number(env.smtp?.timeoutMs || 8000),
  });

const getBaseUrl = () => env.clientUrl || "http://localhost:1234";

/**
 * Transactional OTP Email
 */
const sendOtpEmail = async ({ to, code, purpose }) => {
  const { subject, html, text } = renderOtpTemplate({ code, purpose });

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
    const info = await transporter.sendMail({
      from: env.smtp.from,
      to,
      subject,
      text,
      html,
    });
    return { delivered: true, provider: "smtp", messageId: info?.messageId };
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

/**
 * Newsletter / General Verification Email
 */
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
    const info = await transporter.sendMail({
      from: env.smtp.from,
      to,
      subject: "Confirm your MyJourney newsletter subscription",
      html,
      text,
    });
    console.info("[emailService] Verification email dispatched.");
    return { delivered: true, provider: "smtp", messageId: info?.messageId };
  } catch (err) {
    console.error("[emailService] Verification email dispatch failed.");
    if (env.nodeEnv === "production") throw err;
    return { delivered: false, provider: "unavailable" };
  }
};

/**
 * Already Subscribed Email
 */
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

/**
 * Welcome Subscriber Email
 */
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

/**
 * New Article Notification Email
 */
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

/**
 * Campaign Broadcast Email
 */
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

/**
 * Password Reset Link Email
 */
const sendPasswordResetEmail = async ({ to, token, name, requestMeta = {} }) => {
  const { subject, html, text } = renderPasswordResetTemplate({ token, name, requestMeta });

  if (!hasSmtpConfig()) {
    return { delivered: false, provider: "unavailable" };
  }

  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject,
    html,
    text,
  });
  return { delivered: true, provider: "smtp", messageId: info?.messageId };
};

/**
 * Password Changed Notification Email
 */
const sendPasswordChangedNotificationEmail = async ({ to, name, requestMeta = {} }) => {
  const { subject, html, text } = renderPasswordChangedTemplate({ name, requestMeta });

  if (!hasSmtpConfig()) {
    return { delivered: false, provider: "unavailable" };
  }

  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject,
    html,
    text,
  });
  return { delivered: true, provider: "smtp", messageId: info?.messageId };
};

/**
 * Generic Transactional Email Dispatcher
 */
const sendTransactionalEmail = async (options) => {
  return emailProvider.sendEmail(options);
};

const handlers = {
  verification: sendVerificationEmail,
  alreadySubscribed: sendAlreadySubscribedEmail,
  welcome: sendWelcomeSubscriberEmail,
  newArticle: sendNewArticleNotificationEmail,
  campaign: sendCampaignEmail,
  passwordReset: sendPasswordResetEmail,
  passwordChanged: sendPasswordChangedNotificationEmail,
  otp: sendOtpEmail,
};

module.exports = {
  handlers,
  hasSmtpConfig,
  emailProvider,
  sendOtpEmail,
  sendVerificationEmail,
  sendAlreadySubscribedEmail,
  sendWelcomeSubscriberEmail,
  sendNewArticleNotificationEmail,
  sendCampaignEmail,
  sendPasswordResetEmail,
  sendPasswordChangedNotificationEmail,
  sendTransactionalEmail,
};
