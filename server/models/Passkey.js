const mongoose = require("mongoose");

const PasskeySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // WebAuthn credential fields
    credentialId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    publicKey: {
      type: String, // base64url encoded
      required: true,
      select: false,
    },
    counter: {
      type: Number,
      required: true,
      default: 0,
    },
    aaguid: {
      type: String,
      default: null,
    },
    transports: {
      type: [String], // ['internal', 'usb', 'ble', 'nfc']
      default: [],
    },
    // Human-readable metadata
    deviceName: {
      type: String,
      default: "Passkey",
      trim: true,
    },
    deviceType: {
      type: String,
      default: "unknown", // 'singleDevice' | 'multiDevice'
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

PasskeySchema.index({ user: 1, credentialId: 1 });

module.exports = mongoose.models.Passkey || mongoose.model("Passkey", PasskeySchema);
