const settingService = require("../services/settingService");

class SettingController {
  async getSetting(req, res, next) {
    try {
      const { key } = req.params;
      const value = await settingService.getSettingByKey(key);
      res.json({ success: true, key, value });
    } catch (err) {
      next(err);
    }
  }

  async updateSetting(req, res, next) {
    try {
      const { key } = req.params;
      const { value } = req.body;
      const setting = await settingService.updateSetting(key, value, req.user?._id);
      res.json({ success: true, setting });
    } catch (err) {
      next(err);
    }
  }

  async testSmtp(req, res, next) {
    try {
      const { testEmail } = req.body;
      const recipient = testEmail || req.user?.email || "test@example.com";
      const nodemailer = require("nodemailer");
      const env = require("../config/env");

      if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) {
        return res.status(400).json({
          success: false,
          message: "SMTP is running in Development Fallback mode because SMTP_HOST, SMTP_USER, or SMTP_PASS are blank in .env.",
        });
      }

      const transporter = nodemailer.createTransport({
        host: env.smtp.host,
        port: env.smtp.port,
        secure: env.smtp.secure,
        auth: { user: env.smtp.user, pass: env.smtp.pass },
      });

      await transporter.verify();
      await transporter.sendMail({
        from: env.smtp.from,
        to: recipient,
        subject: "MyJourney — SMTP Configuration Test",
        text: "This is a test email sent from the MyJourney CMS to confirm SMTP server connectivity.",
        html: "<div style='font-family:sans-serif;padding:20px;background:#f8fafc'><h2>MyJourney SMTP Test</h2><p>Your SMTP server connection is verified and functioning correctly.</p></div>",
      });

      res.json({ success: true, message: `SMTP connection verified and test email sent to ${recipient}!` });
    } catch (err) {
      res.status(500).json({ success: false, message: `SMTP Test Failed: ${err.message}` });
    }
  }
}

module.exports = new SettingController();
