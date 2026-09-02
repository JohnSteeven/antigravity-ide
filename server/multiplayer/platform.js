const mongoose = require("mongoose");
const env = require("../config/env");
const MongoRoomRepository = require("./persistence/MongoRoomRepository");
const MultiplayerError = require("./domain/MultiplayerError");
const { ERROR_CODES } = require("./domain/constants");
const MultiplayerAnalyticsService = require("./services/analyticsService");
const MultiplayerMetrics = require("./observability/metrics");
const RoomService = require("./services/roomService");

class MongoRequiredRoomRepository {
  constructor({ connection = mongoose.connection, repository = new MongoRoomRepository() } = {}) {
    this.connection = connection;
    this.mongoRepo = repository;
  }

  get activeRepo() {
    if (this.connection?.readyState !== 1) {
      throw new MultiplayerError(
        ERROR_CODES.SERVER_UNAVAILABLE,
        "Multiplayer storage is temporarily unavailable.",
        { status: 503, retryable: true }
      );
    }
    return this.mongoRepo;
  }

  create(room) { return this.activeRepo.create(room); }
  findByCode(code) { return this.activeRepo.findByCode(code); }
  findById(id) { return this.activeRepo.findById(id); }
  save(room, expectedVersion) { return this.activeRepo.save(room, expectedVersion); }
  findDueRoundDeadlines(now, limit) { return this.activeRepo.findDueRoundDeadlines(now, limit); }
  findDueBetweenRounds(now, limit) { return this.activeRepo.findDueBetweenRounds(now, limit); }
  findDueHostGrace(now, limit) { return this.activeRepo.findDueHostGrace(now, limit); }
  findDueExpiry(now, limit) { return this.activeRepo.findDueExpiry(now, limit); }
  createGameRecord(record) { return this.activeRepo.createGameRecord(record); }
}

const createMultiplayerPlatform = ({ repository, analytics, metrics, now } = {}) => {
  const selectedRepository = repository || new MongoRequiredRoomRepository();
  const selectedMetrics = metrics || new MultiplayerMetrics();
  const selectedAnalytics = analytics === undefined ? new MultiplayerAnalyticsService() : analytics;
  const roomService = new RoomService({
    repository: selectedRepository,
    analytics: selectedAnalytics,
    metrics: selectedMetrics,
    now,
    roomTtlHours: env.multiplayer.roomTtlHours,
    hostGraceSeconds: env.multiplayer.hostGraceSeconds,
  });

  return {
    analytics: selectedAnalytics,
    metrics: selectedMetrics,
    repository: selectedRepository,
    roomService,
    readiness: {
      enabled: env.multiplayer.enabled,
      realtime: false,
      redis: false,
      storage: mongoose.connection.readyState === 1,
      mode: "mongo-required",
    },
  };
};

const multiplayerPlatform = createMultiplayerPlatform();

module.exports = { createMultiplayerPlatform, MongoRequiredRoomRepository, multiplayerPlatform };
