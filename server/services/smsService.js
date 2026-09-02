const twilio = require("twilio");
const env = require("../config/env");

const sendOtpSms = async ({ to, code }) => {
  if (
    env.smsProvider !== "twilio" ||
    !env.twilio.accountSid ||
    !env.twilio.authToken ||
    !env.twilio.from
  ) {
    if (env.nodeEnv === "production") {
      const error = new Error("SMS OTP delivery is unavailable.");
      error.status = 503;
      error.code = "OTP_DELIVERY_UNAVAILABLE";
      throw error;
    }
    return { delivered: false, provider: "development" };
  }

  const client = twilio(env.twilio.accountSid, env.twilio.authToken);
  await client.messages.create({
    from: env.twilio.from,
    to,
    body: `Your MyJourney OTP is ${code}. It expires in 5 minutes.`,
  });
  return { delivered: true, provider: "twilio" };
};

module.exports = { sendOtpSms };
