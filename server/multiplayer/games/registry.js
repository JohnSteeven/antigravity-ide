const whoKnowsMeBetter = require("./whoKnowsMeBetter");
const lifeAuction = require("./lifeAuction");

const games = [whoKnowsMeBetter];
if (process.env.LIFE_AUCTION_ENABLED !== "false") games.push(lifeAuction);
const registry = new Map(games.map((game) => [game.manifest.key, game]));

for (const [key, game] of registry) {
  if (
    game.manifest.key !== key ||
    typeof game.createRoomState !== "function" ||
    typeof game.projectState !== "function" ||
    typeof game.onRoundDeadline !== "function" ||
    typeof game.onBetweenRoundDeadline !== "function" ||
    typeof game.createGameRecord !== "function"
  ) {
    throw new Error(`Multiplayer game ${key} does not satisfy the registry contract.`);
  }
}

const getGame = (gameKey) => registry.get(gameKey) || null;
const listGames = () => [...registry.values()].map((game) => game.manifest);

module.exports = { getGame, listGames };
