const crypto = require("crypto");

const signatureError = () => Object.assign(new Error("Razorpay signature verification failed."), {
  status: 400,
  code: "INVALID_RAZORPAY_SIGNATURE",
});

const secureHexEqual = (expected, supplied) => {
  if (!/^[a-f0-9]{64}$/i.test(String(supplied || ""))) return false;
  const expectedBuffer = Buffer.from(expected, "hex");
  const suppliedBuffer = Buffer.from(String(supplied), "hex");
  return expectedBuffer.length === suppliedBuffer.length && crypto.timingSafeEqual(expectedBuffer, suppliedBuffer);
};

const hmacHex = (message, secret) => crypto.createHmac("sha256", secret).update(message).digest("hex");

const verifyPaymentSignature = ({ orderId, paymentId, signature, keySecret }) => {
  if (!orderId || !paymentId || !keySecret) throw signatureError();
  if (!secureHexEqual(hmacHex(`${orderId}|${paymentId}`, keySecret), signature)) throw signatureError();
  return true;
};

const verifyWebhookSignature = ({ rawBody, signature, webhookSecrets }) => {
  if (!Buffer.isBuffer(rawBody) || !rawBody.length || !Array.isArray(webhookSecrets) || !webhookSecrets.length) {
    throw signatureError();
  }
  const valid = webhookSecrets.some((secret) => secureHexEqual(hmacHex(rawBody, secret), signature));
  if (!valid) throw signatureError();
  return true;
};

module.exports = { hmacHex, secureHexEqual, verifyPaymentSignature, verifyWebhookSignature };
