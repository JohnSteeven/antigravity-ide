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

const getOtpHtml = ({ code, purpose }) => `
  <div style="margin:0;background:#fbfaf7;padding:32px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#2f3133">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e4ded4;border-radius:8px;overflow:hidden">
      <div style="padding:26px 28px;background:#f1eee8">
        <h1 style="margin:0;font-family:Georgia,serif;font-size:30px">MyJourney</h1>
        <p style="margin:8px 0 0;color:#666d6d">Secure verification</p>
      </div>
      <div style="padding:28px">
        <p style="margin:0 0 16px;line-height:1.7">Use this OTP to complete ${purpose.replace("-", " ")}.</p>
        <div style="letter-spacing:10px;font-size:36px;font-weight:800;color:#8f6b48">${code}</div>
        <p style="margin:18px 0 0;color:#666d6d">This code expires in five minutes.</p>
      </div>
    </div>
  </div>
`;

const sendOtpEmail = async ({ to, code, purpose }) => {
  if (!hasSmtpConfig()) {
    console.log(`[email:dev] OTP for ${to}: ${code}`);
    return;
  }

  const transporter = createTransporter();
  await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject: "Your MyJourney verification code",
    html: getOtpHtml({ code, purpose }),
  });
};

const getWelcomeSubscriberHtml = (email) => `
  <div style="margin:0;background:#fbfaf7;padding:32px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#2f3133">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e4ded4;border-radius:8px;overflow:hidden">
      <div style="padding:26px 28px;background:#f1eee8">
        <h1 style="margin:0;font-family:Georgia,serif;font-size:30px">MyJourney</h1>
        <p style="margin:8px 0 0;color:#666d6d">Newsletter Subscription Confirmed</p>
      </div>
      <div style="padding:28px">
        <h2 style="margin:0 0 12px;font-family:Georgia,serif;font-size:22px;color:#2f3133">Welcome to Stay Connected!</h2>
        <p style="margin:0 0 16px;line-height:1.7;color:#4a5568">
          Thank you for subscribing with <strong>${email}</strong>. You will now receive instant email notifications whenever new stories, reflections, articles, or updates are published on MyJourney.
        </p>
        <div style="margin-top:24px;padding-top:20px;border-top:1px solid #edf2f7;font-size:13px;color:#a0aec0">
          No spam. You can unsubscribe at any time.
        </div>
      </div>
    </div>
  </div>
`;

const sendWelcomeSubscriberEmail = async ({ to, email }) => {
  if (!hasSmtpConfig()) {
    console.log(`[email:dev] Welcome subscriber email dispatched to ${to}`);
    return;
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: env.smtp.from,
      to,
      subject: "Welcome to MyJourney — Subscription Confirmed",
      html: getWelcomeSubscriberHtml(email || to),
    });
  } catch (err) {
    console.error(`Failed to send welcome subscriber email to ${to}:`, err.message);
  }
};

const getNewArticleNotificationHtml = (article) => {
  const baseUrl = env.clientUrl || "http://localhost:1234";
  const articleUrl = `${baseUrl}/articles/${article.slug}`;

  return `
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
        </div>
      </div>
    </div>
  `;
};

const sendNewArticleNotificationEmail = async ({ to, article }) => {
  if (!hasSmtpConfig()) {
    console.log(`[email:dev] New Article notification "${article.title}" dispatched to ${to}`);
    return;
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: env.smtp.from,
      to,
      subject: `New Post on MyJourney: ${article.title}`,
      html: getNewArticleNotificationHtml(article),
    });
  } catch (err) {
    console.error(`Failed to send article notification to ${to}:`, err.message);
  }
};

const sendCampaignEmail = async ({ to, campaign }) => {
  if (!hasSmtpConfig()) {
    console.log(`[email:dev] Newsletter campaign "${campaign.title}" dispatched to ${to}`);
    return;
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: env.smtp.from,
      to,
      subject: campaign.subject || campaign.title,
      html: `
        <div style="margin:0;background:#fbfaf7;padding:32px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#2f3133">
          <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e4ded4;border-radius:8px;overflow:hidden">
            <div style="padding:26px 28px;background:#426c67;color:#fff">
              <h1 style="margin:0;font-family:Georgia,serif;font-size:28px;color:#fff">MyJourney</h1>
              <p style="margin:6px 0 0;color:#d8ebe7;font-size:14px">Newsletter Update</p>
            </div>
            <div style="padding:28px">
              <h2 style="margin:0 0 12px;font-family:Georgia,serif;font-size:24px;color:#1a202c">${campaign.title}</h2>
              <div style="margin:0 0 20px;line-height:1.7;color:#4a5568;font-size:15px;white-space:pre-wrap">
                ${campaign.body}
              </div>
            </div>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error(`Failed to send campaign email to ${to}:`, err.message);
  }
};

module.exports = {
  sendOtpEmail,
  sendWelcomeSubscriberEmail,
  sendNewArticleNotificationEmail,
  sendCampaignEmail,
};
