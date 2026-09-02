const mongoose = require("mongoose");
const { ROOM_STATUSES } = require("../multiplayer/domain/constants");

const playerSchema = new mongoose.Schema({
  playerId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, default: null },
  nickname: { type: String, required: true, maxlength: 24 },
  nicknameKey: { type: String, required: true },
  role: { type: String, enum: ["HOST", "PLAYER"], required: true },
  connected: { type: Boolean, default: false },
  joinedAt: { type: Date, required: true },
  lastSeenAt: { type: Date, required: true },
  disconnectedAt: { type: Date, default: null },
}, { _id: false });

const choiceSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
}, { _id: false });

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  version: { type: Number, required: true },
  locale: { type: String, required: true },
  category: { type: String, required: true },
  prompt: { type: String, required: true },
  choices: { type: [choiceSchema], default: [] },
}, { _id: false });

const requestSchema = new mongoose.Schema({
  requestId: { type: String, required: true },
  playerId: { type: String, required: true },
  event: { type: String, required: true },
  at: { type: Date, required: true },
}, { _id: false });

const multiplayerRoomSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true, index: true },
  partySessionId: { type: String, required: true, index: true },
  gameInstanceId: { type: String, required: true, index: true },
  gameKey: { type: String, required: true, index: true },
  gameVersion: { type: Number, required: true },
  locale: { type: String, default: "en" },
  status: { type: String, enum: Object.values(ROOM_STATUSES), required: true, index: true },
  version: { type: Number, default: 0 },
  hostPlayerId: { type: String, required: true },
  players: { type: [playerSchema], default: [] },
  settings: { type: mongoose.Schema.Types.Mixed, required: true },
  gameData: {
    questionBankVersion: { type: Number, required: true },
    questions: { type: [questionSchema], default: [] },
    hostAnswers: { type: Map, of: String, default: {} },
    guesses: { type: mongoose.Schema.Types.Mixed, default: {} },
    scores: { type: Map, of: Number, default: {} },
    currentRound: { type: Number, default: -1 },
    roundStartedAt: { type: Date, default: null },
    roundDeadline: { type: Date, default: null },
    nextRoundAt: { type: Date, default: null },
    reveal: { type: mongoose.Schema.Types.Mixed, default: null },
    state: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  processedRequests: { type: [requestSchema], default: [] },
  lifecycle: { type: [mongoose.Schema.Types.Mixed], default: [] },
  hostDisconnectGraceUntil: { type: Date, default: null },
  endedAt: { type: Date, default: null },
  cancelReason: { type: String, default: null },
  expiresAt: { type: Date, required: true },
}, {
  timestamps: true,
  minimize: false,
});

multiplayerRoomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
multiplayerRoomSchema.index({ status: 1, "gameData.roundDeadline": 1 });
multiplayerRoomSchema.index({ status: 1, "gameData.nextRoundAt": 1 });

module.exports = mongoose.model("MultiplayerRoom", multiplayerRoomSchema);
