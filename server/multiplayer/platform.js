const mongoose = require("mongoose");
const env = require("../config/env");
const MongoRoomRepository = require("./persistence/MongoRoomRepository");
const InMemoryRoomRepository = require("./persistence/InMemoryRoomRepository");
const MultiplayerAnalyticsService = require("./services/analyticsService");
const MultiplayerMetrics = require("./observability/metrics");
const RoomService = require("./services/roomService");

class HybridRoomRepository {
  constructor() {
    this.mongoRepo = new MongoRoomRepository();
    this.memoryRepo = new InMemoryRoomRepository();
  }

  get activeRepo() {
    return mongoose.connection && mongoose.connection.readyState === 1
      ? this.mongoRepo
      : this.memoryRepo;
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
  const selectedRepository = repository || new HybridRoomRepository();
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
      storage: true,
      mode: "hybrid",
    },
  };
};

const multiplayerPlatform = createMultiplayerPlatform();

module.exports = { createMultiplayerPlatform, multiplayerPlatform };
