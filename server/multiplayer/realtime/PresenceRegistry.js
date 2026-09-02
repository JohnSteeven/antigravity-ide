class PresenceRegistry {
  constructor({ redisClient = null, ttlSeconds = 21600 } = {}) {
    this.redisClient = redisClient;
    this.ttlSeconds = ttlSeconds;
    this.local = new Map();
  }

  _key(roomId, playerId) {
    return `myjourney:multiplayer:presence:${roomId}:${playerId}`;
  }

  async claim({ roomId, playerId, socketId, nodeId }) {
    const key = this._key(roomId, playerId);
    const value = JSON.stringify({ socketId, nodeId });
    if (this.redisClient) {
      const previous = await this.redisClient.set(key, value, { EX: this.ttlSeconds, GET: true });
      return previous ? JSON.parse(previous) : null;
    }
    const previous = this.local.get(key) || null;
    this.local.set(key, { socketId, nodeId });
    return previous;
  }

  async release({ roomId, playerId, socketId, nodeId }) {
    const key = this._key(roomId, playerId);
    if (this.redisClient) {
      const result = await this.redisClient.eval(
        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
        { keys: [key], arguments: [JSON.stringify({ socketId, nodeId })] }
      );
      return Number(result) === 1;
    }
    const current = this.local.get(key);
    if (!current || current.socketId !== socketId) return false;
    this.local.delete(key);
    return true;
  }
}

module.exports = PresenceRegistry;
