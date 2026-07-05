const mongoose = require("mongoose");

const RefreshTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true, unique: true },
    revokedAt: Date,
    replacedByToken: String,
    createdByIp: String,
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RefreshToken", RefreshTokenSchema);
