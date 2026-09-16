const crypto = require("crypto");
const { standingsFor, serializeRoom } = require("../../multiplayer/domain/serializer");
const InMemoryRoomRepository = require("../../multiplayer/persistence/InMemoryRoomRepository");
const RoomService = require("../../multiplayer/services/roomService");

describe("multiplayer competition ranks", () => {
  test.each([false, true])("assigns ranks to every tied player with score Map=%s", (asMap) => {
    const scores = { a: 1000, b: 1000, c: 1000, d: 500, e: 500, f: 0, host: 9999 };
    const room = {
      players: ["f", "e", "d", "c", "b", "a", "host"].map((playerId) => ({
        playerId, nickname: playerId, role: playerId === "host" ? "HOST" : "PLAYER",
      })),
      gameData: { scores: asMap ? new Map(Object.entries(scores)) : scores },
    };
    const standings = standingsFor(room);
    expect(standings.map(({ id, rank }) => [id, rank])).toEqual([
      ["a", 1], ["b", 1], ["c", 1], ["d", 4], ["e", 4], ["f", 6],
    ]);
    expect(JSON.parse(JSON.stringify(standings)).every((row) => Number.isInteger(row.rank))).toBe(true);
  });

  test("preserves tied ranks through authoritative play, role projections, and the final game record", async () => {
    let time = Date.parse("2026-09-09T12:00:00Z");
    const repository = new InMemoryRoomRepository();
    const service = new RoomService({ repository, analytics: null, now: () => new Date(time) });
    const created = await service.createRoom({ gameKey: "who-knows-me-better", nickname: "Host" });
    const roomCode = created.room.roomCode;
    const anna = await service.joinRoom({ roomCode, nickname: "Anna" });
    const bea = await service.joinRoom({ roomCode, nickname: "Bea" });
    for (const player of [anna, bea]) await service.setPresence({ roomCode, playerId: player.playerId, connected: true });
    const hostCommand = () => ({ roomCode, playerId: created.playerId, requestId: crypto.randomUUID() });
    const prepared = await service.prepareHost({ ...hostCommand(), questionCount: 3, roundDurationSec: 10, categories: ["friendship", "playful"] });
    await service.saveHostAnswers({ ...hostCommand(), answers: Object.fromEntries(prepared.room.gameData.questions.map((question) => [question.id, question.choices[0].id])) });
    let room = (await service.startGame(hostCommand())).room;

    for (let round = 0; round < 3; round += 1) {
      const question = room.gameData.questions[room.gameData.currentRound];
      time += 1000;
      for (const player of [anna, bea]) {
        room = (await service.answerRound({ roomCode, playerId: player.playerId, requestId: crypto.randomUUID(), questionId: question.id, choiceId: question.choices[0].id })).room;
      }
      room = (await service.advanceRound(hostCommand())).room;
      if (room.status === "BETWEEN_ROUNDS") {
        time += 4000;
        room = await service.beginNextRound(await repository.findByCode(roomCode));
      }
    }

    expect(room.status).toBe("FINISHED");
    for (const playerId of [created.playerId, anna.playerId, bea.playerId]) {
      expect(serializeRoom(room, playerId).standings.map(({ rank }) => rank)).toEqual([1, 1]);
    }
    expect(repository.records).toHaveLength(1);
    expect(repository.records[0].standings.map(({ rank }) => rank)).toEqual([1, 1]);
  });
});
