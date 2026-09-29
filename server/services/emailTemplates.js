const env = require("../config/env");

const getBaseUrl = () => env.clientUrl || "http://localhost:1234";

const getEmailFooter = (token = "") => {
  const baseUrl = getBaseUrl();
  const prefUrl = token ? `${baseUrl}/newsletter/preferences?token=${token}` : `${baseUrl}/contact`;
  const contactUrl = `${baseUrl}/contact`;

  return `
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e2e8f0;font-size:12px;color:#718096;text-align:center;line-height:1.6">
      <p style="margin:0 0 8px">You received this transactional security email regarding your <strong>MyJourney</strong> account.</p>
      <p style="margin:0 0 12px">
        <a href="${contactUrl}" target="_blank" style="color:#426c67;text-decoration:underline;margin:0 6px">Contact Support</a> &bull;
        <a href="${baseUrl}/security" target="_blank" style="color:#426c67;text-decoration:underline;margin:0 6px">Security Overview</a>
      </p>
      <p style="margin:0;color:#a0aec0">&copy; ${new Date().getFullYear()} MyJourney. All rights reserved.</p>
    </div>
  `;
};

/**
 * Transactional OTP Email Template
 */
const renderOtpTemplate = ({ code, purpose, expiryMinutes = 5 }) => {
  const titles = {
    "register": {
      heading: "Confirm Your Email Address",
      subtitle: "Account Registration Verification",
      subject: "Your MyJourney verification code",
      actionText: "Enter the code below to complete your registration on MyJourney:",
    },
    "password-reset": {
      heading: "Reset Your Password",
      subtitle: "Password Reset Request",
      subject: "Your MyJourney password reset code",
      actionText: "Enter the verification code below to proceed with resetting your password:",
    },
    "login-otp": {
      heading: "Sign In to MyJourney",
      subtitle: "Login Verification Code",
      subject: "Your MyJourney sign-in code",
      actionText: "Enter the verification code below to sign in to your MyJourney account:",
    },
    "verify-email": {
      heading: "Verify Your Email",
      subtitle: "Email Address Confirmation",
      subject: "Your MyJourney verification code",
      actionText: "Enter the code below to verify your email address on MyJourney:",
    },
  };

  const meta = titles[purpose] || {
    heading: "Verification Code",
    subtitle: "Account Security Code",
    subject: "Your MyJourney verification code",
    actionText: "Enter the verification code below to confirm your request:",
  };

  const html = `
    <div style="margin:0;background:#fbfaf7;padding:32px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#2f3133">
      <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e4ded4;border-radius:8px;overflow:hidden">
        <div style="padding:26px 28px;background:#2f3133;color:#fff">
          <h1 style="margin:0;font-family:Georgia,serif;font-size:26px;color:#fff">MyJourney</h1>
          <p style="margin:4px 0 0;color:#cbd5e1;font-size:13px">${meta.subtitle}</p>
        </div>
        <div style="padding:28px">
          <h2 style="margin:0 0 14px;font-family:Georgia,serif;font-size:22px;color:#1a202c">${meta.heading}</h2>
          <p style="margin:0 0 20px;line-height:1.7;color:#4a5568">
            ${meta.actionText}
          </p>
          <div style="margin:24px 0;text-align:center">
            <div style="display:inline-block;padding:16px 36px;background:#f1eee8;border:2px dashed #426c67;border-radius:8px;font-family:'Courier New',Courier,monospace;font-size:32px;font-weight:700;letter-spacing:6px;color:#2f3133">
              ${code}
            </div>
          </div>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px 16px;margin:20px 0;font-size:13px;color:#64748b;line-height:1.5">
            ⏰ <strong>Expiry:</strong> This code expires in <strong>${expiryMinutes} minutes</strong> and can only be used once.<br/>
            🔒 <strong>Security Notice:</strong> Never share this code with anyone. MyJourney staff will never ask for your code.
          </div>
          <p style="margin:0;font-size:13px;color:#718096">
            If you did not make this request, you can safely ignore this email. No changes will be made to your account.
          </p>
          ${getEmailFooter()}
        </div>
      </div>
    </div>
  `;

  const text = `MyJourney — ${meta.heading}\n\n${meta.actionText}\n\nCode: ${code}\n\nThis code expires in ${expiryMinutes} minutes and can only be used once.\nNever share this code with anyone.\n\nIf you did not request this, please ignore this email.`;

  return { subject: meta.subject, html, text };
};

/**
 * Transactional Password Reset Link Template
 */
const renderPasswordResetTemplate = ({ token, name, requestMeta = {} }) => {
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
            We received a request to reset the password for your <strong>MyJourney</strong> account. Click the button below to set a new password:
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

  return { subject: "Reset your MyJourney password", html, text };
};

/**
 * Transactional Password Changed Notification Template
 */
const renderPasswordChangedTemplate = ({ name, requestMeta = {} }) => {
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
            This is a confirmation that the password for your <strong>MyJourney</strong> account was successfully changed.
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

  return { subject: "Security Alert: Your MyJourney password was changed", html, text };
};

module.exports = {
  getEmailFooter,
  renderOtpTemplate,
  renderPasswordResetTemplate,
  renderPasswordChangedTemplate,
};
