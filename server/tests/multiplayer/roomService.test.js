const InMemoryRoomRepository = require("../../multiplayer/persistence/InMemoryRoomRepository");
const MultiplayerMetrics = require("../../multiplayer/observability/metrics");
const RoomService = require("../../multiplayer/services/roomService");
const { serializeRoom } = require("../../multiplayer/domain/serializer");

const requestId = () => crypto.randomUUID();
const crypto = require("crypto");

const createHarness = () => {
  let clock = new Date("2026-08-09T12:00:00.000Z");
  const repository = new InMemoryRoomRepository();
  const service = new RoomService({
    repository,
    analytics: null,
    metrics: new MultiplayerMetrics(),
    now: () => new Date(clock),
    roomTtlHours: 6,
    hostGraceSeconds: 10,
  });
  return {
    repository,
    service,
    advance(ms) { clock = new Date(clock.getTime() + ms); },
  };
};

const createReadyRoom = async (harness) => {
  const created = await harness.service.createRoom({
    gameKey: "who-knows-me-better",
    nickname: "Host",
  });
  const joined = await harness.service.joinRoom({ roomCode: created.room.roomCode, nickname: "Friend" });
  const prepared = await harness.service.prepareHost({
    roomCode: created.room.roomCode,
    playerId: created.playerId,
    requestId: requestId(),
    questionCount: 3,
    roundDurationSec: 10,
    categories: ["friendship", "playful"],
  });
  const answers = Object.fromEntries(prepared.room.gameData.questions.map((question) => [question.id, question.choices[0].id]));
  const setup = await harness.service.saveHostAnswers({
    roomCode: created.room.roomCode,
    playerId: created.playerId,
    requestId: requestId(),
    answers,
  });
  return { created, joined, setup };
};

describe("multiplayer room service", () => {
  test("keeps host setup private and exposes only the active question", async () => {
    const harness = createHarness();
    const { created, joined, setup } = await createReadyRoom(harness);

    const hostView = serializeRoom(setup.room, created.playerId);
    const playerView = serializeRoom(setup.room, joined.playerId);
    expect(hostView.hostSetup.questions).toHaveLength(3);
    expect(Object.keys(hostView.hostSetup.answers)).toHaveLength(3);
    expect(playerView.hostSetup).toBeUndefined();
    expect(JSON.stringify(playerView)).not.toContain("hostAnswers");

    const started = await harness.service.startGame({
      roomCode: setup.room.roomCode,
      playerId: created.playerId,
      requestId: requestId(),
    });
    const activeView = serializeRoom(started.room, joined.playerId);
    expect(activeView.round.question).toBeTruthy();
    expect(activeView.round.reveal).toBeNull();
    expect(activeView.hostSetup).toBeUndefined();
    expect(JSON.stringify(activeView)).not.toContain("correctChoiceId");
  });

  test("scores on the server and preserves ties in final rankings", async () => {
    const harness = createHarness();
    const { created, joined, setup } = await createReadyRoom(harness);
    await harness.service.setPresence({ roomCode: setup.room.roomCode, playerId: joined.playerId, connected: true });
    const started = await harness.service.startGame({ roomCode: setup.room.roomCode, playerId: created.playerId, requestId: requestId() });
    const question = started.room.gameData.questions[0];
    harness.advance(1000);
    const answered = await harness.service.answerRound({
      roomCode: setup.room.roomCode,
      playerId: joined.playerId,
      requestId: requestId(),
      questionId: question.id,
      choiceId: question.choices[0].id,
    });

    expect(answered.room.status).toBe("ROUND_REVEAL");
    expect(Number(answered.room.gameData.scores[joined.playerId])).toBeGreaterThanOrEqual(500);
    const view = serializeRoom(answered.room, joined.playerId);
    expect(view.round.reveal.correctChoiceId).toBe(question.choices[0].id);
    expect(view.standings[0].rank).toBe(1);
  });

  test("makes repeated request ids idempotent and rejects a second distinct answer", async () => {
    const harness = createHarness();
    const { created, joined, setup } = await createReadyRoom(harness);
    await harness.service.setPresence({ roomCode: setup.room.roomCode, playerId: joined.playerId, connected: true });
    const started = await harness.service.startGame({ roomCode: setup.room.roomCode, playerId: created.playerId, requestId: requestId() });
    const question = started.room.gameData.questions[0];
    const id = requestId();
    const first = await harness.service.answerRound({
      roomCode: setup.room.roomCode,
      playerId: joined.playerId,
      requestId: id,
      questionId: question.id,
      choiceId: question.choices[0].id,
    });
    const repeated = await harness.service.answerRound({
      roomCode: setup.room.roomCode,
      playerId: joined.playerId,
      requestId: id,
      questionId: question.id,
      choiceId: question.choices[0].id,
    });
    expect(first.duplicate).toBe(false);
    expect(repeated.duplicate).toBe(true);
  });

  test("transfers a disconnected pregame host after the grace period", async () => {
    const harness = createHarness();
    const { created, joined, setup } = await createReadyRoom(harness);
    await harness.service.setPresence({ roomCode: setup.room.roomCode, playerId: joined.playerId, connected: true });
    const disconnected = await harness.service.setPresence({ roomCode: setup.room.roomCode, playerId: created.playerId, connected: false });
    harness.advance(11000);
    const transferred = await harness.service.handleHostGrace(disconnected.room);
    expect(transferred.hostPlayerId).toBe(joined.playerId);
    expect(transferred.status).toBe("READY");
  });

  test("cancels an active game when the host misses the reconnect grace period", async () => {
    const harness = createHarness();
    const { created, setup } = await createReadyRoom(harness);
    await harness.service.startGame({ roomCode: setup.room.roomCode, playerId: created.playerId, requestId: requestId() });
    const disconnected = await harness.service.setPresence({ roomCode: setup.room.roomCode, playerId: created.playerId, connected: false });
    harness.advance(11000);
    const cancelled = await harness.service.handleHostGrace(disconnected.room);
    expect(cancelled.status).toBe("CANCELLED");
    expect(cancelled.cancelReason).toMatch(/host/i);
  });

  test("resets private answers, guesses, and scores for a rematch", async () => {
    const harness = createHarness();
    const { created, joined, setup } = await createReadyRoom(harness);
    await harness.service.setPresence({ roomCode: setup.room.roomCode, playerId: joined.playerId, connected: true });
    let state = (await harness.service.startGame({ roomCode: setup.room.roomCode, playerId: created.playerId, requestId: requestId() })).room;

    for (let index = 0; index < state.gameData.questions.length; index += 1) {
      const question = state.gameData.questions[state.gameData.currentRound];
      state = (await harness.service.answerRound({
        roomCode: state.roomCode,
        playerId: joined.playerId,
        requestId: requestId(),
        questionId: question.id,
        choiceId: question.choices[0].id,
      })).room;
      state = (await harness.service.advanceRound({ roomCode: state.roomCode, playerId: created.playerId, requestId: requestId() })).room;
      if (state.status === "BETWEEN_ROUNDS") {
        harness.advance(4000);
        state = await harness.service.beginNextRound(await harness.repository.findByCode(state.roomCode));
      }
    }

    expect(state.status).toBe("FINISHED");
    const rematch = await harness.service.rematch({ roomCode: state.roomCode, playerId: created.playerId, requestId: requestId() });
    expect(rematch.room.status).toBe("LOBBY");
    expect(rematch.room.gameData.currentRound).toBe(-1);
    expect(Object.keys(rematch.room.gameData.hostAnswers)).toHaveLength(0);
    expect(Object.keys(rematch.room.gameData.guesses)).toHaveLength(0);
    expect(Object.keys(rematch.room.gameData.scores)).toHaveLength(0);
  });

  test("marks abandoned rooms expired before TTL deletion", async () => {
    const harness = createHarness();
    const created = await harness.service.createRoom({ gameKey: "who-knows-me-better", nickname: "Host" });
    harness.advance(6 * 60 * 60 * 1000 + 1);
    const due = await harness.repository.findDueExpiry(new Date("2026-08-09T18:00:00.001Z"));
    expect(due).toHaveLength(1);
    const expired = await harness.service.expireRoom(due[0]);
    expect(expired.status).toBe("EXPIRED");
  });
});
