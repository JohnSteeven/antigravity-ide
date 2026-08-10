const logger = require("../observability/logger");

class TimerCoordinator {
  constructor({ platform, broadcast, intervalMs = 500 }) {
    this.platform = platform;
    this.broadcast = broadcast;
    this.intervalMs = intervalMs;
    this.timer = null;
    this.running = false;
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), this.intervalMs);
    this.timer.unref?.();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async tick() {
    if (this.running) return;
    this.running = true;
    try {
      const now = new Date();
      const [rounds, between, grace, expiry] = await Promise.all([
        this.platform.repository.findDueRoundDeadlines(now),
        this.platform.repository.findDueBetweenRounds(now),
        this.platform.repository.findDueHostGrace(now),
        this.platform.repository.findDueExpiry(now),
      ]);
      for (const room of rounds) {
        const saved = await this.platform.roomService.expireRound(room);
        if (saved) await this.broadcast(saved.roomCode);
      }
      for (const room of between) {
        const saved = await this.platform.roomService.beginNextRound(room);
        if (saved) await this.broadcast(saved.roomCode);
      }
      for (const room of grace) {
        const saved = await this.platform.roomService.handleHostGrace(room);
        if (saved) await this.broadcast(saved.roomCode);
      }
      for (const room of expiry) {
        const saved = await this.platform.roomService.expireRoom(room);
        if (saved) await this.broadcast(saved.roomCode);
      }
    } catch (error) {
      logger.error("timer_tick_failed", { message: error.message });
    } finally {
      this.running = false;
    }
  }
}

module.exports = TimerCoordinator;
