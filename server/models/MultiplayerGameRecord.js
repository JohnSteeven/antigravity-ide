const mongoose = require("mongoose");

const multiplayerGameRecordSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  partySessionId: { type: String, required: true, index: true },
  gameInstanceId: { type: String, required: true, unique: true, index: true },
  roomCode: { type: String, required: true, index: true },
  gameKey: { type: String, required: true, index: true },
  gameVersion: { type: Number, required: true },
  questionBankVersion: { type: Number, required: true },
  playerCount: { type: Number, required: true },
  roundCount: { type: Number, required: true },
  standings: { type: [mongoose.Schema.Types.Mixed], default: [] },
  versionMetadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  summary: { type: mongoose.Schema.Types.Mixed, default: {} },
  startedAt: { type: Date, default: null },
  finishedAt: { type: Date, required: true, index: true },
  durationMs: { type: Number, required: true },
}, { timestamps: true });

multiplayerGameRecordSchema.index({ gameKey: 1, finishedAt: -1 });

module.exports = mongoose.model("MultiplayerGameRecord", multiplayerGameRecordSchema);
