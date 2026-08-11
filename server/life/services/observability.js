const counters = new Map();
const timings = new Map();

const increment = (name, amount = 1) => counters.set(name, (counters.get(name) || 0) + amount);
const observe = (name, valueMs) => {
  const current = timings.get(name) || { count: 0, totalMs: 0, maxMs: 0 };
  current.count += 1;
  current.totalMs += valueMs;
  current.maxMs = Math.max(current.maxMs, valueMs);
  timings.set(name, current);
};
const snapshot = () => ({
  counters: Object.fromEntries(counters),
  timings: Object.fromEntries([...timings].map(([name, value]) => [name, { ...value, averageMs: value.count ? Math.round(value.totalMs / value.count) : 0 }])),
});
const reset = () => { counters.clear(); timings.clear(); };

module.exports = { increment, observe, reset, snapshot };
