class MultiplayerMetrics {
  constructor() {
    this.counters = new Map();
    this.gauges = new Map();
    this.latencies = [];
  }

  increment(name, labels = {}) {
    const key = `${name}:${JSON.stringify(labels)}`;
    this.counters.set(key, (this.counters.get(key) || 0) + 1);
  }

  gauge(name, value) {
    this.gauges.set(name, value);
  }

  observeLatency(event, durationMs) {
    this.latencies.push({ event, durationMs, at: Date.now() });
    if (this.latencies.length > 500) this.latencies.shift();
  }

  snapshot() {
    const values = this.latencies.map((entry) => entry.durationMs).sort((a, b) => a - b);
    const percentile = (ratio) => values.length ? values[Math.min(values.length - 1, Math.floor(values.length * ratio))] : 0;
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      latencyMs: {
        samples: values.length,
        p50: percentile(0.5),
        p95: percentile(0.95),
        p99: percentile(0.99),
      },
    };
  }
}

module.exports = MultiplayerMetrics;
