const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    refreshToken: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RefreshToken",
      required: true,
    },
    ip: String,
    userAgent: String,
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", SessionSchema);
