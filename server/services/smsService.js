const twilio = require("twilio");
const env = require("../config/env");

const sendOtpSms = async ({ to, code }) => {
  if (
    env.smsProvider !== "twilio" ||
    !env.twilio.accountSid ||
    !env.twilio.authToken ||
    !env.twilio.from
  ) {
    console.log(`[sms:dev] OTP for ${to}: ${code}`);
    return;
  }

  const client = twilio(env.twilio.accountSid, env.twilio.authToken);
  await client.messages.create({
    from: env.twilio.from,
    to,
    body: `Your MyJourney OTP is ${code}. It expires in 5 minutes.`,
  });
};

module.exports = { sendOtpSms };
