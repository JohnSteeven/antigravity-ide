/* Repeatable development-only boundary probe. It never creates fixture users and
 * requires an explicit authenticated test account/token supplied by the operator. */
if (process.env.NODE_ENV === "production" || process.env.LIFE_LOAD_ALLOW !== "1") {
  throw new Error("Set LIFE_LOAD_ALLOW=1 in a non-production environment to run the Life load probe.");
}

const baseUrl = String(process.env.LIFE_LOAD_BASE_URL || "http://localhost:1234").replace(/\/$/, "");
const token = process.env.LIFE_LOAD_TOKEN;
const habitId = process.env.LIFE_LOAD_HABIT_ID;
const iterations = Math.min(5000, Math.max(1, Number(process.env.LIFE_LOAD_ITERATIONS) || 50));
const concurrency = Math.min(50, Math.max(1, Number(process.env.LIFE_LOAD_CONCURRENCY) || 5));
if (!token) throw new Error("LIFE_LOAD_TOKEN is required for an isolated development test account.");

const paths = ["/api/life/today", "/api/life/history?limit=30", "/api/life/reports?days=30", "/api/life/money/summary", "/api/life/notifications"];
const requests = Array.from({ length: iterations }, (_, index) => {
  if (habitId && index % 4 === 1) return { path: `/api/life/events/habit/${habitId}`, method: "POST", body: { status: "completed", scheduledDate: new Date().toISOString().slice(0, 10), clientMutationId: `load-${index}` } };
  return { path: paths[index % paths.length], method: "GET" };
});

const result = { environment: process.env.NODE_ENV || "development", baseUrl, iterations, concurrency, startedAt: new Date().toISOString(), successes: 0, failures: 0, durationsMs: [] };
let cursor = 0;
const worker = async () => {
  while (cursor < requests.length) {
    const index = cursor; cursor += 1;
    const request = requests[index];
    const started = performance.now();
    try {
      const response = await fetch(`${baseUrl}${request.path}`, { method: request.method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: request.body ? JSON.stringify(request.body) : undefined });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await response.arrayBuffer(); result.successes += 1;
    } catch (error) { result.failures += 1; }
    result.durationsMs.push(performance.now() - started);
  }
};

Promise.all(Array.from({ length: concurrency }, worker)).then(() => {
  const sorted = [...result.durationsMs].sort((a, b) => a - b);
  result.finishedAt = new Date().toISOString();
  result.meanMs = Number((sorted.reduce((sum, value) => sum + value, 0) / sorted.length).toFixed(2));
  result.p95Ms = Number(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * .95))].toFixed(2));
  result.maxMs = Number(sorted.at(-1).toFixed(2));
  delete result.durationsMs;
  console.log(JSON.stringify(result, null, 2));
  if (result.failures) process.exitCode = 1;
});
