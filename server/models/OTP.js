const mongoose = require("mongoose");

const OTPSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    identifier: { type: String, required: true, index: true },
    channel: { type: String, enum: ["email", "mobile"], required: true },
    purpose: {
      type: String,
      enum: ["register", "login-otp", "password-reset"],
      required: true,
    },
    otpHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    lastSentAt: { type: Date, default: Date.now },
    resendAvailableAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OTP", OTPSchema);
