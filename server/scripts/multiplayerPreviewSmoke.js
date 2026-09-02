const crypto = require("crypto");
const { io } = require("socket.io-client");

const baseUrl = (process.env.PREVIEW_URL || "http://127.0.0.1:1235").replace(/\/$/, "");
const gameKey = process.env.PREVIEW_GAME || "who-knows-me-better";

const jsonRequest = async (path, body) => {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${data.error?.message || data.message}`);
  return data;
};

const connect = (token) => new Promise((resolve, reject) => {
  const socket = io(`${baseUrl}/multiplayer`, {
    auth: { token },
    transports: ["websocket"],
    reconnection: false,
  });
  socket.once("connect", () => resolve(socket));
  socket.once("connect_error", reject);
});

const emit = (socket, event, payload = {}) => new Promise((resolve, reject) => {
  socket.timeout(20000).emit(event, { requestId: crypto.randomUUID(), ...payload }, (timeoutError, response) => {
    if (timeoutError) return reject(new Error(`${event}: ${timeoutError.message}`));
    if (!response?.ok) return reject(new Error(`${event}: ${response?.error?.message}`));
    resolve(response);
  });
});

const run = async () => {
  const host = await jsonRequest("/api/multiplayer/rooms", {
    gameKey,
    nickname: "Preview Host",
    locale: "en",
  });
  const friend = await jsonRequest(`/api/multiplayer/rooms/${host.room.code}/join`, {
    nickname: "Preview Friend",
  });
  const [hostSocket, friendSocket] = await Promise.all([connect(host.token), connect(friend.token)]);
  if (gameKey === "life-auction") {
    const gameCommand = (socket, command, payload = {}) => emit(socket, "game:command", { command, payload });
    await gameCommand(hostSocket, "setup:update", { modeKey: "classic-life", lengthKey: "quick", startingCoins: 100 });
    const started = await gameCommand(hostSocket, "session:start");
    const playerState = (await emit(friendSocket, "room:sync")).room;
    const serialized = JSON.stringify(playerState);
    if (serialized.includes("economyAudit") || serialized.includes("sealedBids") || serialized.includes("privateChoices")) {
      throw new Error("Authoritative Life Auction internals leaked through the preview endpoint.");
    }
    const bid = await gameCommand(friendSocket, "auction:bid", { amount: playerState.lifeAuction.auction.minimumNextBid });
    if (bid.room.lifeAuction.auction.highestBid.playerId !== playerState.self.id) throw new Error("Authoritative preview bid was not synchronized.");
    console.log(JSON.stringify({
      previewUrl: baseUrl,
      gameKey,
      roomCode: host.room.code,
      restProxy: "ok",
      websocketProxy: "ok",
      privateProjection: "ok",
      synchronizedStatus: bid.room.status,
      auctionType: started.room.lifeAuction.auction.type,
    }, null, 2));
    hostSocket.disconnect();
    friendSocket.disconnect();
    return;
  }
  const prepared = await emit(hostSocket, "host:prepare", {
    questionCount: 3,
    roundDurationSec: 10,
    categories: ["friendship"],
  });
  const answers = Object.fromEntries(prepared.room.hostSetup.questions.map((question) => [question.id, question.choices[0].id]));
  await emit(hostSocket, "host:setup", { answers });
  await emit(hostSocket, "game:start");
  const playerState = (await emit(friendSocket, "room:sync")).room;
  if (playerState.hostSetup || JSON.stringify(playerState).includes("hostAnswers")) {
    throw new Error("Private host setup leaked through the preview endpoint.");
  }
  const revealed = await emit(friendSocket, "round:answer", {
    questionId: playerState.round.question.id,
    choiceId: playerState.round.question.choices[0].id,
  });
  if (revealed.room.status !== "ROUND_REVEAL") throw new Error(`Unexpected status: ${revealed.room.status}`);

  console.log(JSON.stringify({
    previewUrl: baseUrl,
    roomCode: host.room.code,
    restProxy: "ok",
    websocketProxy: "ok",
    preRevealPrivacy: "ok",
    synchronizedStatus: revealed.room.status,
  }, null, 2));
  hostSocket.disconnect();
  friendSocket.disconnect();
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
