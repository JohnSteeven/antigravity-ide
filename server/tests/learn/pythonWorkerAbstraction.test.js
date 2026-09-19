const fs = require("fs");
const path = require("path");

describe("Phase 6: Python Worker Abstraction & Browser Sandbox Protocol", () => {
  const workerManagerSource = fs.readFileSync(
    path.resolve(__dirname, "../../../src/features/learn/sandbox/pythonWorkerManager.js"),
    "utf-8"
  );

  test("declares pinned Pyodide version v0.26.4", () => {
    expect(workerManagerSource).toMatch(/PINNED_PYODIDE_VERSION\s*=\s*["']v?0\.26\.4["']/);
  });

  test("enforces authoritative 10-second learner timeout constant", () => {
    expect(workerManagerSource).toMatch(/LEARNER_EXECUTION_TIMEOUT_MS\s*=\s*10000/);
  });

  test("enforces 64 KB output buffer truncation threshold", () => {
    expect(workerManagerSource).toMatch(/MAX_OUTPUT_BYTES\s*=\s*64\s*\*\s*1024/);
  });

  test("worker initialization nullifies browser network globals before execution", () => {
    // Assert worker script disables fetch, XMLHttpRequest, WebSocket, and EventSource
    expect(workerManagerSource).toContain("self.fetch = undefined;");
    expect(workerManagerSource).toContain("self.XMLHttpRequest = undefined;");
    expect(workerManagerSource).toContain("self.WebSocket = undefined;");
    expect(workerManagerSource).toContain("self.EventSource = undefined;");
    expect(workerManagerSource).toContain("self.importScripts = undefined;");
  });

  test("worker script disables Python standard library networking modules", () => {
    expect(workerManagerSource).toContain("sys.modules['urllib'] = _DeniedNetwork()");
    expect(workerManagerSource).toContain("sys.modules['http.client'] = _DeniedNetwork()");
    expect(workerManagerSource).toContain("sys.modules['socket'] = _DeniedNetwork()");
  });

  test("worker manager implements timeout termination and reset", () => {
    expect(workerManagerSource).toContain("terminateAndReset");
    expect(workerManagerSource).toContain("this.worker.terminate()");
    expect(workerManagerSource).toContain("this.ensureWorker()");
  });

  test("worker manager handles stdout, stderr, and truncation messages", () => {
    expect(workerManagerSource).toContain("Output truncated: maximum size limit reached");
    expect(workerManagerSource).toContain("case \"STDOUT\":");
    expect(workerManagerSource).toContain("case \"STDERR\":");
    expect(workerManagerSource).toContain("case \"RUN_SUCCESS\":");
  });
});

