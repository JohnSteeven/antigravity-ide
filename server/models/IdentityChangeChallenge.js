const mongoose = require("mongoose");

const IdentityChangeChallengeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kind: { type: String, enum: ["email", "mobile"], required: true },
    currentIdentifier: { type: String, required: true, select: false },
    proposedIdentifier: { type: String, required: true, select: false },
    otpHash: { type: String, required: true, select: false },
    attempts: { type: Number, default: 0 },
    resendCount: { type: Number, default: 0 },
    reauthMethod: { type: String, enum: ["password", "totp"], required: true },
    reauthenticatedAt: { type: Date, required: true },
    lastSentAt: { type: Date, required: true },
    resendAvailableAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

IdentityChangeChallengeSchema.index({ user: 1, kind: 1 }, { unique: true });

module.exports = mongoose.models.IdentityChangeChallenge
  || mongoose.model("IdentityChangeChallenge", IdentityChangeChallengeSchema);
