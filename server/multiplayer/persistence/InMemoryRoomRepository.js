const crypto = require("crypto");

const clone = (value) => structuredClone(value);

class InMemoryRoomRepository {
  constructor() {
    this.rooms = new Map();
    this.records = [];
  }

  async create(room) {
    const stored = { ...clone(room), _id: crypto.randomUUID(), version: 0, createdAt: new Date(), updatedAt: new Date() };
    this.rooms.set(stored._id, stored);
    return clone(stored);
  }

  async findByCode(roomCode) {
    const room = [...this.rooms.values()].find((candidate) => candidate.roomCode === roomCode);
    return room ? clone(room) : null;
  }

  async findById(roomId) {
    const room = this.rooms.get(String(roomId));
    return room ? clone(room) : null;
  }

  async save(room, expectedVersion) {
    const current = this.rooms.get(String(room._id));
    if (!current || current.version !== expectedVersion) return null;
    const stored = { ...clone(room), version: expectedVersion + 1, updatedAt: new Date() };
    this.rooms.set(String(room._id), stored);
    return clone(stored);
  }

  async findDueRoundDeadlines(now, limit = 50) {
    return [...this.rooms.values()].filter((room) =>
      room.status === "IN_PROGRESS" && room.gameData.roundDeadline && new Date(room.gameData.roundDeadline) <= now
    ).slice(0, limit).map(clone);
  }

  async findDueBetweenRounds(now, limit = 50) {
    return [...this.rooms.values()].filter((room) =>
      ["ROUND_REVEAL", "BETWEEN_ROUNDS"].includes(room.status) && room.gameData.nextRoundAt && new Date(room.gameData.nextRoundAt) <= now
    ).slice(0, limit).map(clone);
  }

  async findDueHostGrace(now, limit = 50) {
    return [...this.rooms.values()].filter((room) =>
      room.hostDisconnectGraceUntil && new Date(room.hostDisconnectGraceUntil) <= now &&
      !["FINISHED", "EXPIRED", "CANCELLED"].includes(room.status)
    ).slice(0, limit).map(clone);
  }

  async findDueExpiry(now, limit = 50) {
    return [...this.rooms.values()].filter((room) =>
      new Date(room.expiresAt) <= now && !["EXPIRED", "CANCELLED"].includes(room.status)
    ).slice(0, limit).map(clone);
  }

  async createGameRecord(record) {
    if (!this.records.some((candidate) => String(candidate.gameInstanceId) === String(record.gameInstanceId))) {
      this.records.push(clone(record));
    }
    return clone(record);
  }
}

module.exports = InMemoryRoomRepository;
