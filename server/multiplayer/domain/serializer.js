const { PLAYER_ROLES } = require("./constants");
const { getGame } = require("../games/registry");

const mapValue = (value, key) => value instanceof Map ? value.get(key) : value?.[key];
const publicPlayer = (player, scores) => ({
  id: player.playerId,
  nickname: player.nickname,
  role: player.role,
  connected: player.connected,
  score: Number(mapValue(scores, player.playerId) || 0),
});

const standingsFor = (room) => room.players
  .filter((player) => player.role === PLAYER_ROLES.PLAYER)
  .map((player) => publicPlayer(player, room.gameData.scores))
  .sort((a, b) => b.score - a.score || a.nickname.localeCompare(b.nickname))
  .map((player, index, all) => ({
    ...player,
    rank: index > 0 && player.score === all[index - 1].score ? all[index - 1].rank : index + 1,
  }));

const serializeRoom = (room, viewerPlayerId) => {
  const viewer = room.players.find((player) => player.playerId === viewerPlayerId);
  if (!viewer) return null;
  const game = getGame(room.gameKey);

  const payload = {
    id: String(room._id),
    code: room.roomCode,
    game: game?.manifest,
    locale: room.locale,
    status: room.status,
    version: room.version,
    self: publicPlayer(viewer, room.gameData.scores),
    hostPlayerId: room.hostPlayerId,
    players: room.players.map((player) => publicPlayer(player, room.gameData.scores)),
    settings: room.settings,
    endedAt: room.endedAt,
    cancelReason: room.cancelReason,
  };
  return {
    ...payload,
    ...game.projectState({ room, viewer, publicPlayer, standingsFor }),
  };
};

module.exports = { serializeRoom, standingsFor };
