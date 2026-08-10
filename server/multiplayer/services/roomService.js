const crypto = require("crypto");
const { ERROR_CODES, PLAYER_ROLES, ROOM_STATUSES, TERMINAL_ROOM_STATUSES } = require("../domain/constants");
const MultiplayerError = require("../domain/MultiplayerError");
const { assertTransition } = require("../domain/lifecycle");
const { validateNickname } = require("../domain/moderation");
const { getGame } = require("../games/registry");
const { standingsFor } = require("../domain/serializer");

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const REQUEST_LOG_LIMIT = 250;

const mapObject = (value) => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value);
  return { ...value };
};

class RoomService {
  constructor({ repository, analytics, metrics, now = () => new Date(), roomTtlHours = 6, hostGraceSeconds = 45 }) {
    this.repository = repository;
    this.analytics = analytics;
    this.metrics = metrics;
    this.now = now;
    this.roomTtlHours = roomTtlHours;
    this.hostGraceSeconds = hostGraceSeconds;
  }

  _code() {
    const bytes = crypto.randomBytes(4);
    return `MJ-${[...bytes].map((byte) => CODE_ALPHABET[byte % CODE_ALPHABET.length]).join("")}`;
  }

  _player(room, playerId) {
    const player = room.players.find((candidate) => candidate.playerId === playerId);
    if (!player) {
      throw new MultiplayerError(ERROR_CODES.INVALID_TOKEN, "Player session does not belong to this room.", { status: 401 });
    }
    return player;
  }

  _host(room, playerId) {
    const player = this._player(room, playerId);
    if (player.role !== PLAYER_ROLES.HOST || room.hostPlayerId !== playerId) {
      throw new MultiplayerError(ERROR_CODES.NOT_HOST, "Only the host can do that.", { status: 403 });
    }
    return player;
  }

  _transition(room, status, reason = null) {
    if (room.status === status) return;
    assertTransition(room.status, status);
    room.status = status;
    room.lifecycle = [...(room.lifecycle || []), { status, at: this.now(), reason }].slice(-30);
  }

  _recordRequest(room, requestId, playerId, event) {
    if (!requestId) return;
    room.processedRequests = [
      ...(room.processedRequests || []),
      { requestId, playerId, event, at: this.now() },
    ].slice(-REQUEST_LOG_LIMIT);
  }

  async _mutate(roomCode, playerId, event, requestId, callback, maxAttempts = 4) {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const room = await this.repository.findByCode(roomCode);
      if (!room) throw new MultiplayerError(ERROR_CODES.ROOM_NOT_FOUND, "Room not found.", { status: 404 });
      this._player(room, playerId);
      const duplicate = requestId && room.processedRequests?.some((entry) =>
        entry.requestId === requestId && entry.playerId === playerId && entry.event === event
      );
      if (duplicate) return { room, duplicate: true };

      const changed = await callback(room);
      if (changed === false) return { room, duplicate: false };
      this._recordRequest(room, requestId, playerId, event);
      const saved = await this.repository.save(room, room.version);
      if (saved) return { room: saved, duplicate: false };
      this.metrics?.increment("room_version_conflict", { event });
    }

    throw new MultiplayerError(ERROR_CODES.VERSION_CONFLICT, "Room changed while processing that action. Please retry.", {
      status: 409,
      retryable: true,
    });
  }

  async createRoom({ gameKey, nickname, locale = "en", userId = null }) {
    const game = getGame(gameKey);
    if (!game) throw new MultiplayerError(ERROR_CODES.BAD_REQUEST, "Unsupported game.");
    const cleanNickname = validateNickname(nickname);
    const now = this.now();
    const playerId = crypto.randomUUID();
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const roomCode = this._code();
      const { settings, gameData } = game.createRoomState({ roomCode, locale });
      const room = {
        roomCode,
        partySessionId: crypto.randomUUID(),
        gameInstanceId: crypto.randomUUID(),
        gameKey,
        gameVersion: game.manifest.version,
        locale: game.manifest.supportedLocales.includes(locale) ? locale : "en",
        status: ROOM_STATUSES.LOBBY,
        hostPlayerId: playerId,
        players: [{
          playerId,
          userId,
          nickname: cleanNickname,
          nicknameKey: cleanNickname.toLocaleLowerCase("en"),
          role: PLAYER_ROLES.HOST,
          connected: false,
          joinedAt: now,
          lastSeenAt: now,
          disconnectedAt: null,
        }],
        settings,
        gameData,
        processedRequests: [],
        lifecycle: [
          { status: ROOM_STATUSES.CREATED, at: now },
          { status: ROOM_STATUSES.LOBBY, at: now },
        ],
        expiresAt: new Date(now.getTime() + this.roomTtlHours * 3600000),
      };

      try {
        const created = await this.repository.create(room);
        this.analytics?.track("room_created", { room: created, playerId });
        this.metrics?.increment("rooms_created", { gameKey });
        return { room: created, playerId };
      } catch (error) {
        if (error?.code !== 11000) throw error;
      }
    }
    throw new MultiplayerError(ERROR_CODES.SERVER_UNAVAILABLE, "Could not allocate a room code. Please retry.", {
      status: 503,
      retryable: true,
    });
  }

  async joinRoom({ roomCode, nickname, userId = null }) {
    const cleanNickname = validateNickname(nickname);
    const nicknameKey = cleanNickname.toLocaleLowerCase("en");
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const room = await this.repository.findByCode(roomCode);
      if (!room) throw new MultiplayerError(ERROR_CODES.ROOM_NOT_FOUND, "Room not found.", { status: 404 });
      if (![ROOM_STATUSES.LOBBY, ROOM_STATUSES.HOST_SETUP, ROOM_STATUSES.READY].includes(room.status)) {
        throw new MultiplayerError(ERROR_CODES.ROOM_CLOSED, "This room is no longer accepting players.", { status: 409 });
      }
      if (room.players.length >= room.settings.maxPlayers) {
        throw new MultiplayerError(ERROR_CODES.ROOM_FULL, "This room is full.", { status: 409 });
      }
      if (room.players.some((player) => player.nicknameKey === nicknameKey)) {
        throw new MultiplayerError(ERROR_CODES.NICKNAME_TAKEN, "That nickname is already in this room.", { status: 409 });
      }

      const playerId = crypto.randomUUID();
      const now = this.now();
      room.players.push({
        playerId,
        userId,
        nickname: cleanNickname,
        nicknameKey,
        role: PLAYER_ROLES.PLAYER,
        connected: false,
        joinedAt: now,
        lastSeenAt: now,
        disconnectedAt: null,
      });
      const game = getGame(room.gameKey);
      game.onPlayerJoined?.({ room, transition: (status) => this._transition(room, status) });
      const saved = await this.repository.save(room, room.version);
      if (saved) {
        this.analytics?.track("player_joined", { room: saved, playerId });
        this.metrics?.increment("players_joined", { gameKey: room.gameKey });
        return { room: saved, playerId };
      }
    }
    throw new MultiplayerError(ERROR_CODES.VERSION_CONFLICT, "Room changed while joining. Please retry.", { status: 409, retryable: true });
  }

  async prepareHost({ roomCode, playerId, requestId, questionCount, roundDurationSec, categories }) {
    const result = await this._mutate(roomCode, playerId, "host:prepare", requestId, (room) => {
      this._host(room, playerId);
      if (![ROOM_STATUSES.LOBBY, ROOM_STATUSES.HOST_SETUP, ROOM_STATUSES.READY].includes(room.status)) {
        throw new MultiplayerError(ERROR_CODES.INVALID_STATE, "Questions can only be prepared before the game starts.", { status: 409 });
      }
      const game = getGame(room.gameKey);
      const allowed = new Set(game.listCategories());
      if (categories.some((category) => !allowed.has(category))) {
        throw new MultiplayerError(ERROR_CODES.BAD_REQUEST, "One or more question categories are invalid.");
      }
      room.settings.questionCount = questionCount;
      room.settings.roundDurationSec = roundDurationSec;
      room.settings.categories = categories;
      room.gameData.questions = game.selectQuestions({ categories, count: questionCount, seed: `${room.roomCode}:${room.version + 1}` });
      if (room.gameData.questions.length !== questionCount) {
        throw new MultiplayerError(ERROR_CODES.BAD_REQUEST, "Not enough questions are available for that selection.");
      }
      room.gameData.hostAnswers = {};
      this._transition(room, ROOM_STATUSES.HOST_SETUP);
    });
    if (!result.duplicate) this.analytics?.track("host_setup_prepared", { room: result.room, playerId });
    return result;
  }

  async saveHostAnswers({ roomCode, playerId, requestId, answers }) {
    const result = await this._mutate(roomCode, playerId, "host:setup", requestId, (room) => {
      this._host(room, playerId);
      if (![ROOM_STATUSES.LOBBY, ROOM_STATUSES.HOST_SETUP, ROOM_STATUSES.READY].includes(room.status)) {
        throw new MultiplayerError(ERROR_CODES.INVALID_STATE, "Answers can only be saved before the game starts.", { status: 409 });
      }
      const validAnswers = {};
      room.gameData.questions.forEach((question) => {
        const choiceId = answers[question.id];
        if (!question.choices.some((choice) => choice.id === choiceId)) {
          throw new MultiplayerError(ERROR_CODES.BAD_REQUEST, "Every question needs one valid private answer.");
        }
        validAnswers[question.id] = choiceId;
      });
      room.gameData.hostAnswers = validAnswers;
      this._transition(
        room,
        room.players.length >= room.settings.minPlayers ? ROOM_STATUSES.READY : ROOM_STATUSES.HOST_SETUP
      );
    });
    if (!result.duplicate) this.analytics?.track("host_setup_completed", { room: result.room, playerId });
    return result;
  }

  async startGame({ roomCode, playerId, requestId }) {
    const result = await this._mutate(roomCode, playerId, "game:start", requestId, (room) => {
      this._host(room, playerId);
      if (room.status !== ROOM_STATUSES.READY) {
        throw new MultiplayerError(ERROR_CODES.INVALID_STATE, "The room is not ready to start.", { status: 409 });
      }
      if (room.players.length < room.settings.minPlayers) {
        throw new MultiplayerError(ERROR_CODES.INVALID_STATE, "At least one friend must join before starting.", { status: 409 });
      }
      const now = this.now();
      this._transition(room, ROOM_STATUSES.IN_PROGRESS);
      room.gameData.currentRound = 0;
      room.gameData.roundStartedAt = now;
      room.gameData.roundDeadline = new Date(now.getTime() + room.settings.roundDurationSec * 1000);
      room.gameData.nextRoundAt = null;
      room.gameData.reveal = null;
      room.gameData.guesses = {};
      room.gameData.scores = {};
    });
    if (!result.duplicate) this.analytics?.track("game_started", {
      room: result.room,
      playerId,
      metadata: { playerCount: result.room.players.length, roundCount: result.room.gameData.questions.length },
    });
    return result;
  }

  _reveal(room) {
    const question = room.gameData.questions[room.gameData.currentRound];
    const answers = mapObject(room.gameData.hostAnswers);
    const guesses = room.gameData.guesses?.[question.id] || {};
    const scores = mapObject(room.gameData.scores);
    const game = getGame(room.gameKey);
    const correctChoiceId = answers[question.id];
    Object.entries(guesses).forEach(([guessPlayerId, guess]) => {
      const points = game.scoreAnswer({
        correct: guess.choiceId === correctChoiceId,
        elapsedMs: Math.max(0, new Date(guess.answeredAt).getTime() - new Date(room.gameData.roundStartedAt).getTime()),
        roundDurationSec: room.settings.roundDurationSec,
      });
      guess.points = points;
      scores[guessPlayerId] = Number(scores[guessPlayerId] || 0) + points;
    });
    room.gameData.scores = scores;
    room.gameData.reveal = {
      questionId: question.id,
      correctChoiceId,
      answers: Object.fromEntries(Object.entries(guesses).map(([id, guess]) => [id, {
        choiceId: guess.choiceId,
        points: guess.points,
      }])),
    };
    room.gameData.roundDeadline = null;
    this._transition(room, ROOM_STATUSES.ROUND_REVEAL);
  }

  async answerRound({ roomCode, playerId, requestId, questionId, choiceId }) {
    const result = await this._mutate(roomCode, playerId, "round:answer", requestId, (room) => {
      const player = this._player(room, playerId);
      if (player.role === PLAYER_ROLES.HOST) {
        throw new MultiplayerError(ERROR_CODES.INVALID_ACTION, "The host observes this game instead of guessing.", { status: 403 });
      }
      if (room.status !== ROOM_STATUSES.IN_PROGRESS) {
        throw new MultiplayerError(ERROR_CODES.INVALID_STATE, "Answers are not open right now.", { status: 409 });
      }
      const question = room.gameData.questions[room.gameData.currentRound];
      if (question.id !== questionId || !question.choices.some((choice) => choice.id === choiceId)) {
        throw new MultiplayerError(ERROR_CODES.BAD_REQUEST, "That answer does not match the active question.");
      }
      const guesses = room.gameData.guesses || {};
      guesses[question.id] = guesses[question.id] || {};
      if (guesses[question.id][playerId]) {
        throw new MultiplayerError(ERROR_CODES.DUPLICATE_ACTION, "Your answer is already locked in.", { status: 409 });
      }
      guesses[question.id][playerId] = { choiceId, answeredAt: this.now(), points: 0 };
      room.gameData.guesses = guesses;
      const activePlayers = room.players.filter((candidate) => candidate.role === PLAYER_ROLES.PLAYER && candidate.connected);
      if (activePlayers.length && activePlayers.every((candidate) => guesses[question.id][candidate.playerId])) {
        this._reveal(room);
      }
    });
    if (!result.duplicate) this.analytics?.track("answer_submitted", {
      room: result.room,
      playerId,
      metadata: { round: result.room.gameData.currentRound + 1, causedReveal: result.room.status === ROOM_STATUSES.ROUND_REVEAL },
    });
    return result;
  }

  async advanceRound({ roomCode, playerId, requestId }) {
    const result = await this._mutate(roomCode, playerId, "round:advance", requestId, (room) => {
      this._host(room, playerId);
      if (room.status !== ROOM_STATUSES.ROUND_REVEAL) {
        throw new MultiplayerError(ERROR_CODES.INVALID_STATE, "The current round has not been revealed.", { status: 409 });
      }
      if (room.gameData.currentRound >= room.gameData.questions.length - 1) {
        this._transition(room, ROOM_STATUSES.FINISHED);
        room.endedAt = this.now();
        room.gameData.nextRoundAt = null;
      } else {
        this._transition(room, ROOM_STATUSES.BETWEEN_ROUNDS);
        room.gameData.nextRoundAt = new Date(this.now().getTime() + 3000);
      }
    });
    if (!result.duplicate) this.analytics?.track("round_advanced", {
      room: result.room,
      playerId,
      metadata: { status: result.room.status, round: result.room.gameData.currentRound + 1 },
    });
    if (result.room.status === ROOM_STATUSES.FINISHED && !result.duplicate) await this._persistResult(result.room);
    return result;
  }

  async rematch({ roomCode, playerId, requestId }) {
    const result = await this._mutate(roomCode, playerId, "game:rematch", requestId, (room) => {
      this._host(room, playerId);
      if (room.status !== ROOM_STATUSES.FINISHED) {
        throw new MultiplayerError(ERROR_CODES.INVALID_STATE, "A rematch can start after the final results.", { status: 409 });
      }
      const game = getGame(room.gameKey);
      room.gameInstanceId = crypto.randomUUID();
      if (typeof game.rematchRoomState === "function") {
        const next = game.rematchRoomState({ room, now: this.now });
        room.settings = next.settings;
        room.gameData = next.gameData;
      } else {
        room.gameData.questions = game.selectQuestions({
          categories: room.settings.categories,
          count: room.settings.questionCount,
          seed: `${room.roomCode}:rematch:${room.version + 1}`,
        });
        room.gameData.hostAnswers = {};
        room.gameData.guesses = {};
        room.gameData.scores = {};
        room.gameData.currentRound = -1;
        room.gameData.roundStartedAt = null;
        room.gameData.roundDeadline = null;
        room.gameData.nextRoundAt = null;
        room.gameData.reveal = null;
      }
      room.endedAt = null;
      this._transition(room, ROOM_STATUSES.LOBBY);
      game.onPlayerJoined?.({ room, transition: (status) => this._transition(room, status) });
    });
    if (!result.duplicate) {
      this.analytics?.track("rematch_created", { room: result.room, playerId });
      if (result.room.gameKey === "life-auction") this.analytics?.track("rematch_started", { room: result.room, playerId });
    }
    return result;
  }

  async transferHost({ roomCode, playerId, requestId, targetPlayerId }) {
    return this._mutate(roomCode, playerId, "host:transfer", requestId, (room) => {
      this._host(room, playerId);
      if (![ROOM_STATUSES.LOBBY, ROOM_STATUSES.HOST_SETUP, ROOM_STATUSES.READY, ROOM_STATUSES.FINISHED].includes(room.status)) {
        throw new MultiplayerError(ERROR_CODES.INVALID_STATE, "Host transfer is unavailable during active rounds.", { status: 409 });
      }
      const target = room.players.find((candidate) => candidate.playerId === targetPlayerId);
      if (!target || targetPlayerId === playerId) {
        throw new MultiplayerError(ERROR_CODES.BAD_REQUEST, "Choose another player in this room.");
      }
      room.players.forEach((candidate) => {
        candidate.role = candidate.playerId === targetPlayerId ? PLAYER_ROLES.HOST : PLAYER_ROLES.PLAYER;
      });
      room.hostPlayerId = targetPlayerId;
      room.hostDisconnectGraceUntil = null;
    });
  }

  async removePlayer({ roomCode, playerId, requestId, targetPlayerId }) {
    return this._mutate(roomCode, playerId, "player:remove", requestId, (room) => {
      this._host(room, playerId);
      if (![ROOM_STATUSES.LOBBY, ROOM_STATUSES.HOST_SETUP, ROOM_STATUSES.READY].includes(room.status)) {
        throw new MultiplayerError(ERROR_CODES.INVALID_STATE, "Players can only be removed before the game starts.", { status: 409 });
      }
      if (targetPlayerId === playerId || !room.players.some((candidate) => candidate.playerId === targetPlayerId)) {
        throw new MultiplayerError(ERROR_CODES.BAD_REQUEST, "Choose another player in this room.");
      }
      room.players = room.players.filter((candidate) => candidate.playerId !== targetPlayerId);
      if (room.status === ROOM_STATUSES.READY && room.players.length < room.settings.minPlayers) {
        const game = getGame(room.gameKey);
        if (typeof game.onPlayerRemoved === "function") {
          game.onPlayerRemoved({ room, transition: (status) => this._transition(room, status) });
        } else this._transition(room, ROOM_STATUSES.HOST_SETUP);
      }
    });
  }

  async executeGameCommand({ roomCode, playerId, requestId, command, payload }) {
    let commandResult = null;
    const result = await this._mutate(roomCode, playerId, `game:command:${command}`, requestId, async (room) => {
      const game = getGame(room.gameKey);
      if (typeof game.executeCommand !== "function") {
        throw new MultiplayerError(ERROR_CODES.INVALID_ACTION, "This game does not support that command.", { status: 400 });
      }
      const player = this._player(room, playerId);
      commandResult = await game.executeCommand({
        command,
        payload,
        player,
        room,
        now: this.now,
        transition: (status, reason) => this._transition(room, status, reason),
      });
    });
    if (!result.duplicate) this.analytics?.track("game_command", {
      room: result.room,
      playerId,
      metadata: { command },
    });
    if (!result.duplicate) {
      for (const entry of commandResult?.analytics || []) {
        this.analytics?.track(entry.event, { room: result.room, playerId, metadata: entry.metadata || {} });
        this.metrics?.increment(entry.event, { gameKey: result.room.gameKey });
      }
    }
    if (!result.duplicate && result.room.status === ROOM_STATUSES.FINISHED) await this._persistResult(result.room);
    return result;
  }

  async switchGame({ roomCode, playerId, requestId, gameKey }) {
    const targetGame = getGame(gameKey);
    if (!targetGame) throw new MultiplayerError(ERROR_CODES.BAD_REQUEST, "That party game is not available.", { status: 422 });
    const result = await this._mutate(roomCode, playerId, "party:switch-game", requestId, (room) => {
      this._host(room, playerId);
      if (room.status !== ROOM_STATUSES.FINISHED) {
        throw new MultiplayerError(ERROR_CODES.INVALID_STATE, "The party can switch games after the current game finishes.", { status: 409 });
      }
      const instanceId = crypto.randomUUID();
      const next = targetGame.createRoomState({ roomCode: room.roomCode, locale: room.locale, seed: `${room.roomCode}:${instanceId}` });
      room.gameKey = targetGame.manifest.key;
      room.gameVersion = targetGame.manifest.version;
      room.gameInstanceId = instanceId;
      room.settings = next.settings;
      room.gameData = next.gameData;
      room.processedRequests = [];
      room.endedAt = null;
      room.cancelReason = null;
      this._transition(room, ROOM_STATUSES.LOBBY, "PARTY_SWITCHED_GAME");
      targetGame.onPlayerJoined?.({ room, transition: (status) => this._transition(room, status) });
    });
    if (!result.duplicate) this.analytics?.track("party_switched_game", {
      room: result.room,
      playerId,
      metadata: { gameKey },
    });
    return result;
  }

  async setPresence({ roomCode, playerId, connected }) {
    return this._mutate(roomCode, playerId, connected ? "presence:connect" : "presence:disconnect", null, (room) => {
      if ([ROOM_STATUSES.EXPIRED, ROOM_STATUSES.CANCELLED].includes(room.status)) return false;
      const player = this._player(room, playerId);
      const now = this.now();
      player.connected = connected;
      player.lastSeenAt = now;
      player.disconnectedAt = connected ? null : now;
      if (player.role === PLAYER_ROLES.HOST) {
        room.hostDisconnectGraceUntil = connected
          ? null
          : new Date(now.getTime() + this.hostGraceSeconds * 1000);
      }
      return true;
    }, 12);
  }

  async expireRound(room) {
    if (room.status !== ROOM_STATUSES.IN_PROGRESS) return null;
    const game = getGame(room.gameKey);
    const deadlineResult = await game.onRoundDeadline({
      room,
      now: this.now,
      reveal: (targetRoom) => this._reveal(targetRoom),
      transition: (status, reason) => this._transition(room, status, reason),
    });
    const saved = await this.repository.save(room, room.version);
    if (saved) this.analytics?.track("round_timed_out", {
      room: saved,
      metadata: { round: saved.gameData.currentRound + 1 },
    });
    if (saved) {
      for (const entry of deadlineResult?.analytics || []) {
        this.analytics?.track(entry.event, { room: saved, metadata: entry.metadata || {} });
        this.metrics?.increment(entry.event, { gameKey: saved.gameKey });
      }
    }
    return saved;
  }

  async beginNextRound(room) {
    if (![ROOM_STATUSES.ROUND_REVEAL, ROOM_STATUSES.BETWEEN_ROUNDS].includes(room.status)) return null;
    const game = getGame(room.gameKey);
    const betweenResult = await game.onBetweenRoundDeadline({
      room,
      now: this.now,
      transition: (status, reason) => this._transition(room, status, reason),
    });
    const saved = await this.repository.save(room, room.version);
    if (saved) {
      for (const entry of betweenResult?.analytics || []) {
        this.analytics?.track(entry.event, { room: saved, metadata: entry.metadata || {} });
        this.metrics?.increment(entry.event, { gameKey: saved.gameKey });
      }
    }
    if (saved?.status === ROOM_STATUSES.FINISHED) await this._persistResult(saved);
    return saved;
  }

  async handleHostGrace(room) {
    if (!room.hostDisconnectGraceUntil) return null;
    const host = room.players.find((player) => player.playerId === room.hostPlayerId);
    if (host?.connected) {
      room.hostDisconnectGraceUntil = null;
      return this.repository.save(room, room.version);
    }
    if ([ROOM_STATUSES.LOBBY, ROOM_STATUSES.HOST_SETUP, ROOM_STATUSES.READY].includes(room.status)) {
      const successor = room.players
        .filter((player) => player.role === PLAYER_ROLES.PLAYER && player.connected)
        .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt))[0];
      if (successor) {
        room.players.forEach((player) => {
          player.role = player.playerId === successor.playerId ? PLAYER_ROLES.HOST : PLAYER_ROLES.PLAYER;
        });
        room.hostPlayerId = successor.playerId;
        room.hostDisconnectGraceUntil = null;
        return this.repository.save(room, room.version);
      }
    }
    this._transition(room, ROOM_STATUSES.CANCELLED, "HOST_DISCONNECTED");
    room.cancelReason = "The host did not reconnect in time.";
    room.endedAt = this.now();
    room.hostDisconnectGraceUntil = null;
    const cancelled = await this.repository.save(room, room.version);
    if (cancelled) this.analytics?.track("game_abandoned", {
      room: cancelled,
      metadata: { reason: "HOST_DISCONNECTED" },
    });
    return cancelled;
  }

  async expireRoom(room) {
    if (TERMINAL_ROOM_STATUSES.includes(room.status)) return null;
    this._transition(room, ROOM_STATUSES.EXPIRED, "ROOM_TTL_REACHED");
    room.endedAt = this.now();
    return this.repository.save(room, room.version);
  }

  async _persistResult(room) {
    const started = room.gameData?.state?.startedAt || room.lifecycle.find((entry) => entry.status === ROOM_STATUSES.IN_PROGRESS)?.at;
    const finishedAt = room.endedAt || this.now();
    const game = getGame(room.gameKey);
    const gameRecord = game.createGameRecord({ room, standingsFor });
    await this.repository.createGameRecord({
      roomId: room._id,
      partySessionId: room.partySessionId,
      gameInstanceId: room.gameInstanceId,
      roomCode: room.roomCode,
      gameKey: room.gameKey,
      gameVersion: room.gameVersion,
      questionBankVersion: room.gameData.questionBankVersion,
      playerCount: room.players.length,
      roundCount: gameRecord.roundCount,
      standings: gameRecord.standings,
      versionMetadata: gameRecord.versionMetadata || {},
      summary: gameRecord.summary || {},
      startedAt: started || null,
      finishedAt,
      durationMs: started ? Math.max(0, new Date(finishedAt) - new Date(started)) : 0,
    });
    this.analytics?.track("game_finished", { room, metadata: { playerCount: room.players.length } });
    this.metrics?.increment("games_finished", { gameKey: room.gameKey });
  }
}

module.exports = RoomService;
