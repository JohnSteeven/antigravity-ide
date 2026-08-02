const mongoose = require("mongoose");

const trustedDeviceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    deviceName: {
      type: String,
      required: true,
      trim: true,
    },
    deviceType: {
      type: String,
      enum: ["Desktop", "Laptop", "Mobile", "Tablet", "Other"],
      default: "Desktop",
    },
    browser: {
      type: String,
      default: "Chrome",
    },
    os: {
      type: String,
      default: "Windows",
    },
    ipAddress: {
      type: String,
      default: "127.0.0.1",
    },
    country: {
      type: String,
      default: "Localhost",
    },
    city: {
      type: String,
      default: "Development",
    },
    isCurrentDevice: {
      type: Boolean,
      default: false,
    },
    trustedSince: {
      type: Date,
      default: Date.now,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

trustedDeviceSchema.index({ user: 1 });

module.exports = mongoose.models.TrustedDevice || mongoose.model("TrustedDevice", trustedDeviceSchema);
