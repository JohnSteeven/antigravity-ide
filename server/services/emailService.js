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
    console.log(`\n📧 [EMAIL DEV LOG] ----------------------------------------`);
    console.log(`Type: Verification Email`);
    console.log(`To: ${to}`);
    console.log(`Verify URL: ${verifyUrl}`);
    console.log(`-----------------------------------------------------------\n`);
    return;
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject: "Confirm your MyJourney newsletter subscription",
    html,
    text,
  });
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
    console.log(`\n📧 [EMAIL DEV LOG] Already Subscribed alert for ${to}`);
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
    console.log(`\n📧 [EMAIL DEV LOG] Welcome Email sent to ${to}`);
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
    console.log(`\n📧 [EMAIL DEV LOG] New Article email "${article.title}" dispatched to ${to}`);
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
    console.log(`\n📧 [EMAIL DEV LOG] Campaign email "${campaign.title}" dispatched to ${to}`);
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

const handlers = {
  verification: sendVerificationEmail,
  alreadySubscribed: sendAlreadySubscribedEmail,
  welcome: sendWelcomeSubscriberEmail,
  newArticle: sendNewArticleNotificationEmail,
  campaign: sendCampaignEmail,
};

module.exports = {
  handlers,
  sendVerificationEmail,
  sendAlreadySubscribedEmail,
  sendWelcomeSubscriberEmail,
  sendNewArticleNotificationEmail,
  sendCampaignEmail,
};
