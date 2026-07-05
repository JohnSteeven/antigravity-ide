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

module.exports = { sendOtpEmail };
