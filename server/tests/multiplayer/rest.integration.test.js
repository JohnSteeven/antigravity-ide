const express = require("express");
const request = require("supertest");
const InMemoryRoomRepository = require("../../multiplayer/persistence/InMemoryRoomRepository");
const { createMultiplayerPlatform } = require("../../multiplayer/platform");
const { createMultiplayerRouter } = require("../../routes/multiplayerRoutes");
const { errorHandler } = require("../../middleware/errorHandler");

const createApp = () => {
  const repository = new InMemoryRoomRepository();
  const platform = createMultiplayerPlatform({ repository, analytics: null });
  const app = express();
  app.use(express.json());
  app.use("/api/multiplayer", createMultiplayerRouter(platform));
  app.use(errorHandler);
  return { app, platform };
};

describe("multiplayer REST API", () => {
  test("creates, joins, and resumes a room with signed guest identity", async () => {
    const { app } = createApp();
    const created = await request(app)
      .post("/api/multiplayer/rooms")
      .send({ gameKey: "who-knows-me-better", nickname: "Host", locale: "en" })
      .expect(201);
    expect(created.body.room.code).toMatch(/^MJ-[A-HJ-NP-Z2-9]{4}$/);
    expect(created.body.token).toEqual(expect.any(String));
    expect(created.body.room.hostSetup.questions).toHaveLength(5);

    const joined = await request(app)
      .post(`/api/multiplayer/rooms/${created.body.room.code}/join`)
      .send({ nickname: "Friend" })
      .expect(201);
    expect(joined.body.room.self.role).toBe("PLAYER");
    expect(joined.body.room.hostSetup).toBeUndefined();

    const resumed = await request(app)
      .post(`/api/multiplayer/rooms/${created.body.room.code}/resume`)
      .send({ token: joined.body.token })
      .expect(200);
    expect(resumed.body.room.self.nickname).toBe("Friend");
  });

  test("returns stable error codes for collisions and malformed input", async () => {
    const { app } = createApp();
    const created = await request(app)
      .post("/api/multiplayer/rooms")
      .send({ gameKey: "who-knows-me-better", nickname: "Host", locale: "en" })
      .expect(201);

    await request(app)
      .post(`/api/multiplayer/rooms/${created.body.room.code}/join`)
      .send({ nickname: "HOST" })
      .expect(409)
      .expect((response) => {
        expect(response.body.error.code).toBe("MULTIPLAYER_NICKNAME_TAKEN");
      });

    await request(app)
      .post("/api/multiplayer/rooms")
      .send({ gameKey: "who-knows-me-better", nickname: "x", extra: true })
      .expect(422)
      .expect((response) => {
        expect(response.body.error.code).toBe("MULTIPLAYER_BAD_REQUEST");
      });
  });
});
