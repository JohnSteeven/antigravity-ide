const MultiplayerRoom = require("../../models/MultiplayerRoom");
const MultiplayerGameRecord = require("../../models/MultiplayerGameRecord");

const asObject = (value) => value?.toObject ? value.toObject({ flattenMaps: true }) : value;

class MongoRoomRepository {
  async create(room) {
    return asObject(await MultiplayerRoom.create(room));
  }

  async findByCode(roomCode) {
    return MultiplayerRoom.findOne({ roomCode }).lean();
  }

  async findById(roomId) {
    return MultiplayerRoom.findById(roomId).lean();
  }

  async save(room, expectedVersion) {
    const next = { ...asObject(room) };
    delete next._id;
    delete next.__v;
    delete next.createdAt;
    delete next.updatedAt;
    delete next.version;

    return MultiplayerRoom.findOneAndUpdate(
      { _id: room._id, version: expectedVersion },
      { $set: next, $inc: { version: 1 } },
      { new: true, runValidators: true, lean: true }
    );
  }

  async findDueRoundDeadlines(now, limit = 50) {
    return MultiplayerRoom.find({
      status: "IN_PROGRESS",
      "gameData.roundDeadline": { $lte: now },
    }).sort({ "gameData.roundDeadline": 1 }).limit(limit).lean();
  }

  async findDueBetweenRounds(now, limit = 50) {
    return MultiplayerRoom.find({
      status: { $in: ["ROUND_REVEAL", "BETWEEN_ROUNDS"] },
      "gameData.nextRoundAt": { $lte: now },
    }).sort({ "gameData.nextRoundAt": 1 }).limit(limit).lean();
  }

  async findDueHostGrace(now, limit = 50) {
    return MultiplayerRoom.find({
      hostDisconnectGraceUntil: { $ne: null, $lte: now },
      status: { $nin: ["FINISHED", "EXPIRED", "CANCELLED"] },
    }).sort({ hostDisconnectGraceUntil: 1 }).limit(limit).lean();
  }

  async findDueExpiry(now, limit = 50) {
    return MultiplayerRoom.find({
      expiresAt: { $lte: now },
      status: { $nin: ["EXPIRED", "CANCELLED"] },
    }).sort({ expiresAt: 1 }).limit(limit).lean();
  }

  async createGameRecord(record) {
    return MultiplayerGameRecord.findOneAndUpdate(
      { gameInstanceId: record.gameInstanceId },
      { $setOnInsert: record },
      { new: true, upsert: true }
    );
  }
}

module.exports = MongoRoomRepository;
