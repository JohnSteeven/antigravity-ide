const crypto = require("crypto");

const backfill = async (collection, fieldsFor) => {
  const cursor = collection.find({ $or: [{ partySessionId: { $exists: false } }, { gameInstanceId: { $exists: false } }] }, { projection: { _id: 1 } });
  const operations = [];
  for await (const document of cursor) {
    operations.push({ updateOne: { filter: { _id: document._id }, update: { $set: fieldsFor() } } });
    if (operations.length === 500) {
      await collection.bulkWrite(operations, { ordered: false });
      operations.length = 0;
    }
  }
  if (operations.length) await collection.bulkWrite(operations, { ordered: false });
};

module.exports = {
  name: "002-multiplayer-party-game-instances",
  version: "1.0.0",

  async up(db) {
    const rooms = db.collection("multiplayerrooms");
    const records = db.collection("multiplayergamerecords");

    await backfill(rooms, () => ({ partySessionId: crypto.randomUUID(), gameInstanceId: crypto.randomUUID() }));
    const roomParties = new Map((await rooms.find({}, { projection: { _id: 1, partySessionId: 1 } }).toArray())
      .map((room) => [String(room._id), room.partySessionId]));
    const recordCursor = records.find({ $or: [{ partySessionId: { $exists: false } }, { gameInstanceId: { $exists: false } }] }, { projection: { _id: 1, roomId: 1 } });
    const recordOps = [];
    for await (const record of recordCursor) {
      recordOps.push({ updateOne: { filter: { _id: record._id }, update: { $set: {
        partySessionId: roomParties.get(String(record.roomId)) || crypto.randomUUID(),
        gameInstanceId: crypto.randomUUID(),
      } } } });
    }
    if (recordOps.length) await records.bulkWrite(recordOps, { ordered: false });

    try {
      await records.dropIndex("one_record_per_room");
    } catch (error) {
      if (error.codeName !== "IndexNotFound") throw error;
    }

    await rooms.createIndex({ partySessionId: 1 }, { name: "party_session_lookup", sparse: true });
    await rooms.createIndex({ gameInstanceId: 1 }, { name: "active_game_instance", sparse: true });
    await records.createIndex({ gameInstanceId: 1 }, { unique: true, name: "one_record_per_game_instance", sparse: true });
    await records.createIndex({ partySessionId: 1, finishedAt: -1 }, { name: "party_game_history", sparse: true });
    await records.createIndex({ roomId: 1, finishedAt: -1 }, { name: "room_game_history" });
  },

  async down(db) {
    const rooms = db.collection("multiplayerrooms");
    const records = db.collection("multiplayergamerecords");
    for (const [collection, indexes] of [
      [rooms, ["party_session_lookup", "active_game_instance"]],
      [records, ["one_record_per_game_instance", "party_game_history", "room_game_history"]],
    ]) {
      for (const indexName of indexes) {
        try {
          await collection.dropIndex(indexName);
        } catch (error) {
          if (error.codeName !== "IndexNotFound") throw error;
        }
      }
    }
    await records.createIndex({ roomId: 1 }, { unique: true, name: "one_record_per_room" });
  },
};
