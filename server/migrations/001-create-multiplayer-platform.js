module.exports = {
  name: "001-create-multiplayer-platform",
  version: "1.0.0",

  async up(db) {
    const rooms = db.collection("multiplayerrooms");
    const records = db.collection("multiplayergamerecords");
    const analytics = db.collection("multiplayeranalyticsevents");

    await rooms.createIndex({ roomCode: 1 }, { unique: true, name: "room_code_unique" });
    await rooms.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "room_expiry_ttl" });
    await rooms.createIndex({ status: 1, "gameData.roundDeadline": 1 }, { name: "due_round_deadlines" });
    await rooms.createIndex({ status: 1, "gameData.nextRoundAt": 1 }, { name: "due_between_rounds" });
    await rooms.createIndex({ hostDisconnectGraceUntil: 1, status: 1 }, { name: "host_disconnect_grace" });

    await records.createIndex({ roomId: 1 }, { unique: true, name: "one_record_per_room" });
    await records.createIndex({ gameKey: 1, finishedAt: -1 }, { name: "game_history" });

    await analytics.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "analytics_expiry_ttl" });
    await analytics.createIndex({ eventType: 1, timestamp: -1 }, { name: "analytics_event_time" });
  },

  async down(db) {
    const drops = [
      ["multiplayerrooms", ["room_code_unique", "room_expiry_ttl", "due_round_deadlines", "due_between_rounds", "host_disconnect_grace"]],
      ["multiplayergamerecords", ["one_record_per_room", "game_history"]],
      ["multiplayeranalyticsevents", ["analytics_expiry_ttl", "analytics_event_time"]],
    ];
    for (const [collectionName, indexes] of drops) {
      const collection = db.collection(collectionName);
      for (const indexName of indexes) {
        try {
          await collection.dropIndex(indexName);
        } catch (error) {
          if (error.codeName !== "IndexNotFound") throw error;
        }
      }
    }
  },
};
