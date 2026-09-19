/**
 * ─────────────────────────────────────────────────────────────────────────────
 * pythonWorkerManager.js — Client-Side Pyodide Web Worker Execution Manager
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * Strict Isolation & Security Guarantees:
 * - Pyodide runs entirely inside a browser Web Worker (ZERO server execution).
 * - Pinned version: Pyodide v0.26.4.
 * - Network isolation: Once Pyodide is initialized, network globals in the worker
 *   (fetch, XMLHttpRequest, WebSocket, EventSource, importScripts) and Python
 *   networking packages (urllib, http, socket) are strictly disabled.
 * - Authoritative 10-second learner execution timeout: If exceeded, the worker is
 *   terminated immediately and a fresh worker instance is created.
 * - Output truncation: Maximum 64 KB output limit with graceful warning.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const PINNED_PYODIDE_VERSION = "v0.26.4";
export const PYODIDE_CDN_URL = `https://cdn.jsdelivr.net/pyodide/${PINNED_PYODIDE_VERSION}/full/pyodide.js`;
export const LEARNER_EXECUTION_TIMEOUT_MS = 10000; // 10 seconds
export const MAX_OUTPUT_BYTES = 64 * 1024; // 64 KB

/**
 * Worker script content as inline blob string.
 * This ensures the worker script is self-contained and avoids cross-origin worker script restrictions.
 */
export const PYTHON_WORKER_SCRIPT = `
/* Pyodide Web Worker Runner */
let pyodideInstance = null;
let isInitializing = false;
let totalOutputBytes = 0;
const MAX_BYTES = ${MAX_OUTPUT_BYTES};
let truncationReported = false;

function postSafeMessage(msg) {
  try {
    self.postMessage(msg);
  } catch (err) {
    // Message posting error
  }
}

function handleStdout(text) {
  if (totalOutputBytes >= MAX_BYTES) {
    if (!truncationReported) {
      truncationReported = true;
      postSafeMessage({ type: "STDOUT", text: "\\n[Output truncated: maximum size limit reached]\\n" });
    }
    return;
  }
  let str = String(text);
  if (str.length > (MAX_BYTES - totalOutputBytes)) {
    str = str.slice(0, MAX_BYTES - totalOutputBytes) + "... [truncated]";
  }
  totalOutputBytes += str.length;
  postSafeMessage({ type: "STDOUT", text: str });
}

function handleStderr(text) {
  if (totalOutputBytes >= MAX_BYTES) return;
  let str = String(text);
  if (str.length > (MAX_BYTES - totalOutputBytes)) {
    str = str.slice(0, MAX_BYTES - totalOutputBytes) + "... [truncated]";
  }
  totalOutputBytes += str.length;
  postSafeMessage({ type: "STDERR", text: str });
}

async function initializeRuntime() {
  if (pyodideInstance) return pyodideInstance;
  if (isInitializing) {
    while (isInitializing) {
      await new Promise((r) => setTimeout(r, 50));
    }
    return pyodideInstance;
  }

  isInitializing = true;
  postSafeMessage({ type: "STATUS", status: "LOADING_PYODIDE" });

  try {
    importScripts("${PYODIDE_CDN_URL}");
    pyodideInstance = await self.loadPyodide({
      stdout: handleStdout,
      stderr: handleStderr,
    });

    // ── STRICT NETWORK ISOLATION ─────────────────────────────────────────────
    // Disable all browser networking APIs in the worker context
    self.fetch = undefined;
    self.XMLHttpRequest = undefined;
    self.WebSocket = undefined;
    self.EventSource = undefined;
    self.importScripts = undefined;

    // Neutralize network modules in Python
    await pyodideInstance.runPythonAsync(\`
import sys

class _DeniedNetwork:
    def __getattr__(self, name):
        raise PermissionError("Network access is strictly disabled in this coding environment.")

# Block common networking modules
sys.modules['urllib.request'] = _DeniedNetwork()
sys.modules['http.client'] = _DeniedNetwork()
sys.modules['urllib'] = _DeniedNetwork()
sys.modules['socket'] = _DeniedNetwork()
\`);

    postSafeMessage({ type: "STATUS", status: "READY" });
    isInitializing = false;
    return pyodideInstance;
  } catch (error) {
    isInitializing = false;
    postSafeMessage({ type: "INIT_ERROR", error: error.message || String(error) });
    throw error;
  }
}

self.onmessage = async (event) => {
  const { action, code, runId } = event.data || {};

  if (action === "INIT") {
    try {
      await initializeRuntime();
    } catch (err) {
      // already reported
    }
    return;
  }

  if (action === "RUN") {
    totalOutputBytes = 0;
    truncationReported = false;

    try {
      const py = await initializeRuntime();
      postSafeMessage({ type: "STATUS", status: "RUNNING", runId });

      const startTime = Date.now();
      const rawResult = await py.runPythonAsync(code);
      const durationMs = Date.now() - startTime;

      let resultString = null;
      if (rawResult !== undefined && rawResult !== null) {
        try {
          resultString = String(rawResult);
        } catch(e) {
          resultString = "[Unserializable result]";
        }
      }

      postSafeMessage({
        type: "RUN_SUCCESS",
        runId,
        result: resultString,
        durationMs,
      });
    } catch (error) {
      let friendlyError = error.message || String(error);
      // Remove deep internal Pyodide tracebacks
      if (friendlyError.includes("PythonError:")) {
        const parts = friendlyError.split("PythonError:");
        friendlyError = parts[parts.length - 1].trim();
      }
      postSafeMessage({
        type: "RUN_ERROR",
        runId,
        error: friendlyError,
      });
    }
  }
};
`;

/**
 * Manager class managing the lifecycle of the Python Web Worker.
 */
export class PythonWorkerManager {
  constructor() {
    this.worker = null;
    this.status = "UNINITIALIZED"; // UNINITIALIZED | LOADING | READY | RUNNING | TERMINATED
    this.currentRunId = null;
    this.timeoutTimer = null;
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event) {
    this.listeners.forEach((fn) => {
      try { fn(event); } catch (e) { /* ignore listener error */ }
    });
  }

  /**
   * Spawn a new fresh Worker instance.
   */
  ensureWorker() {
    if (this.worker) return this.worker;
    if (typeof window === "undefined" || typeof Worker === "undefined") {
      // Fallback for SSR or non-browser test environment
      return null;
    }

    const blob = new Blob([PYTHON_WORKER_SCRIPT], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    this.worker = new Worker(url);
    URL.revokeObjectURL(url);

    this.worker.onmessage = (e) => this.handleWorkerMessage(e.data);
    this.worker.onerror = (e) => {
      this.notify({ type: "ERROR", error: "Python Web Worker encountered an error: " + (e.message || "Unknown error") });
    };

    return this.worker;
  }

  handleWorkerMessage(data) {
    if (!data || typeof data !== "object") return;

    switch (data.type) {
      case "STATUS":
        this.status = data.status;
        this.notify({ type: "STATUS", status: data.status, runId: data.runId });
        break;

      case "STDOUT":
        this.notify({ type: "STDOUT", text: data.text });
        break;

      case "STDERR":
        this.notify({ type: "STDERR", text: data.text });
        break;

      case "RUN_SUCCESS":
        this.clearExecutionTimer();
        this.status = "READY";
        this.notify({
          type: "RUN_SUCCESS",
          runId: data.runId,
          result: data.result,
          durationMs: data.durationMs,
        });
        break;

      case "RUN_ERROR":
        this.clearExecutionTimer();
        this.status = "READY";
        this.notify({
          type: "RUN_ERROR",
          runId: data.runId,
          error: data.error,
        });
        break;

      case "INIT_ERROR":
        this.status = "ERROR";
        this.notify({
          type: "ERROR",
          error: "Failed to initialize Python (Pyodide): " + (data.error || "Network error"),
        });
        break;

      default:
        break;
    }
  }

  clearExecutionTimer() {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }

  /**
   * Pre-warm / lazy-load Pyodide without running code.
   */
  init() {
    const worker = this.ensureWorker();
    if (worker) {
      worker.postMessage({ action: "INIT" });
    }
  }

  /**
   * Execute learner Python code with strict 10s execution timeout.
   */
  run(code, options = {}) {
    const timeoutMs = Number(options.timeoutMs) || LEARNER_EXECUTION_TIMEOUT_MS;
    const runId = `py-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.currentRunId = runId;

    const worker = this.ensureWorker();
    if (!worker) {
      this.notify({ type: "ERROR", error: "Web Worker is unavailable in this environment." });
      return;
    }

    this.clearExecutionTimer();

    // Set 10-second learner execution timeout
    this.timeoutTimer = setTimeout(() => {
      this.terminateAndReset("Your code took too long to finish.");
    }, timeoutMs);

    worker.postMessage({ action: "RUN", code, runId });
  }

  /**
   * Terminate the worker (e.g. if code enters an infinite while loop) and spawn a clean replacement.
   */
  terminateAndReset(userMessage = "Execution terminated. Runtime has been reset.") {
    this.clearExecutionTimer();

    if (this.worker) {
      try {
        this.worker.terminate();
      } catch (e) { /* ignore termination errors */ }
      this.worker = null;
    }

    this.status = "TERMINATED";
    this.notify({
      type: "TIMEOUT",
      error: userMessage,
      runId: this.currentRunId,
    });

    // Re-create a fresh, uncontaminated worker for subsequent runs
    this.ensureWorker();
    this.status = "READY";
  }

  dispose() {
    this.clearExecutionTimer();
    if (this.worker) {
      try { this.worker.terminate(); } catch (e) {}
      this.worker = null;
    }
    this.listeners.clear();
  }
}

export const defaultPythonManager = new PythonWorkerManager();
