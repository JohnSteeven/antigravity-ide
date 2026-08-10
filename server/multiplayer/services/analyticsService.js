const MultiplayerAnalyticsEvent = require("../../models/MultiplayerAnalyticsEvent");
const env = require("../../config/env");
const { hashIdentity } = require("../security/guestTokens");
const logger = require("../observability/logger");

class MultiplayerAnalyticsService {
  constructor({ model = MultiplayerAnalyticsEvent } = {}) {
    this.model = model;
  }

  track(eventType, { room, playerId, metadata = {} } = {}) {
    const expiresAt = new Date(Date.now() + env.multiplayer.analyticsRetentionDays * 86400000);
    Promise.resolve(this.model.create({
      eventType,
      roomId: room?._id || null,
      gameKey: room?.gameKey || null,
      playerIdHash: playerId ? hashIdentity(playerId) : null,
      metadata,
      expiresAt,
    })).catch((error) => logger.warn("analytics_write_failed", { eventType, message: error.message }));
  }
}

module.exports = MultiplayerAnalyticsService;
