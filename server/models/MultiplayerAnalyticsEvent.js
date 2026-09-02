const mongoose = require("mongoose");

const multiplayerAnalyticsEventSchema = new mongoose.Schema({
  eventType: { type: String, required: true, index: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
  gameKey: { type: String, default: null, index: true },
  playerIdHash: { type: String, default: null },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now, index: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

multiplayerAnalyticsEventSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
multiplayerAnalyticsEventSchema.index({ eventType: 1, timestamp: -1 });

module.exports = mongoose.model("MultiplayerAnalyticsEvent", multiplayerAnalyticsEventSchema);
