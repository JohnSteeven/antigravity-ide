import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  FiPlay,
  FiRefreshCw,
  FiExternalLink,
  FiMaximize2,
  FiMinimize2,
  FiMonitor,
  FiTablet,
  FiSmartphone,
  FiTrash2,
  FiAlertTriangle,
  FiFileText,
} from "react-icons/fi";
import WorkspaceCodeEditor from "./components/WorkspaceCodeEditor.jsx";
import WorkspaceSplitter from "./components/WorkspaceSplitter.jsx";
import { generateChannelNonce } from "../learn/sandbox/htmlSandboxHarness";
import { defaultPythonManager } from "../learn/sandbox/pythonWorkerManager";
import { classifyRuntimeError } from "./languageAdapters";
import CodingSubNav from "./CodingSubNav.jsx";
import "./coding.css";

const DEFAULT_WEB = {
  html: `<div class="card">
  <h1 id="title">Welcome to Playground</h1>
  <p>Experiment freely with HTML, CSS, and JavaScript in this live client sandbox.</p>
  <button id="btn" class="btn">Click Me</button>
  <p id="output" class="output-text"></p>
</div>`,
  css: `body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 2rem;
  background: #f8fafc;
  color: #0f172a;
}
.card {
  background: #ffffff;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  max-width: 480px;
}
h1 {
  color: #0284c7;
  margin-top: 0;
  font-size: 1.5rem;
}
p {
  color: #475569;
  line-height: 1.5;
}
.btn {
  background: #0284c7;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease;
}
.btn:hover {
  background: #0369a1;
}
.output-text {
  margin-top: 1rem;
  font-weight: 500;
  color: #059669;
}`,
  js: `const btn = document.getElementById("btn");
const output = document.getElementById("output");

btn.addEventListener("click", () => {
  console.log("Button clicked at " + new Date().toLocaleTimeString());
  output.textContent = "🚀 Interactive JavaScript is working smoothly!";
});`,
};

const DEFAULT_PYTHON = `# Safe In-Browser Python (Pyodide Web Worker)
import math

def calculate_primes(limit):
    primes = []
    for num in range(2, limit + 1):
        if all(num % i != 0 for i in range(2, int(math.isqrt(num)) + 1)):
            primes.append(num)
    return primes

primes_to_50 = calculate_primes(50)
print(f"Discovered primes up to 50: {primes_to_50}")
print(f"Total count: {len(primes_to_50)}")
`;

export default function CodingPlayground() {
  const [mode, setMode] = useState("web"); // "web" | "python"
  const [activeWebTab, setActiveWebTab] = useState("html"); // "html" | "css" | "js"

  // Code state for Web mode
  const [htmlCode, setHtmlCode] = useState(() => {
    try {
      return localStorage.getItem("coding_playground_html") ?? DEFAULT_WEB.html;
    } catch {
      return DEFAULT_WEB.html;
    }
  });

  const [cssCode, setCssCode] = useState(() => {
    try {
      return localStorage.getItem("coding_playground_css") ?? DEFAULT_WEB.css;
    } catch {
      return DEFAULT_WEB.css;
    }
  });

  const [jsCode, setJsCode] = useState(() => {
    try {
      return localStorage.getItem("coding_playground_js") ?? DEFAULT_WEB.js;
    } catch {
      return DEFAULT_WEB.js;
    }
  });

  // Code state for Python mode
  const [pythonCode, setPythonCode] = useState(() => {
    try {
      return localStorage.getItem("coding_playground_python") ?? DEFAULT_PYTHON;
    } catch {
      return DEFAULT_PYTHON;
    }
  });

  // Execution & Output state
  const [isExecuting, setIsExecuting] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [srcdoc, setSrcdoc] = useState("");
  const [previewDevice, setPreviewDevice] = useState("desktop"); // "desktop" | "tablet" | "mobile"
  const [activeOutputTab, setActiveOutputTab] = useState("preview"); // "preview" | "console"
  const [pythonStatus, setPythonStatus] = useState("READY");

  // Layout & maximize state
  const [editorHeightPercent, setEditorHeightPercent] = useState(() => {
    try {
      const saved = localStorage.getItem("coding_playground_split_h");
      if (saved) return Math.min(80, Math.max(20, parseFloat(saved)));
    } catch {}
    return 52;
  });
  const [maximizedPanel, setMaximizedPanel] = useState(null); // null | "editor" | "output"
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const iframeRef = useRef(null);
  const playgroundWorkspaceRef = useRef(null);
  const channelNonceRef = useRef(generateChannelNonce());

  // Listen to sandbox postMessages for Web Console
  useEffect(() => {
    const handleMessage = (e) => {
      const message = e.data;
      if (!message || typeof message !== "object") return;
      if (message.nonce !== channelNonceRef.current) return;

      if (message.type === "MYJOURNEY_SANDBOX_CONSOLE") {
        setConsoleLogs((prev) => [
          ...prev,
          {
            level: message.level || "log",
            text: message.text || "",
            time: new Date().toLocaleTimeString(),
          },
        ]);
      } else if (message.type === "MYJOURNEY_SANDBOX_ERROR") {
        setConsoleLogs((prev) => [
          ...prev,
          {
            level: "error",
            text: message.text || "Runtime error",
            time: new Date().toLocaleTimeString(),
          },
        ]);
      } else if (message.type === "MYJOURNEY_SANDBOX_READY") {
        setIsExecuting(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Listen to Python worker events
  useEffect(() => {
    if (mode !== "python") return;

    const unsubscribe = defaultPythonManager.subscribe((event) => {
      if (event.type === "STATUS") {
        setPythonStatus(event.status);
      } else if (event.type === "STDOUT") {
        setConsoleLogs((prev) => [
          ...prev,
          { level: "log", text: event.text, time: new Date().toLocaleTimeString() },
        ]);
      } else if (event.type === "STDERR") {
        setConsoleLogs((prev) => [
          ...prev,
          { level: "error", text: event.text, time: new Date().toLocaleTimeString() },
        ]);
      } else if (event.type === "RUN_SUCCESS") {
        setIsExecuting(false);
        if (event.result) {
          setConsoleLogs((prev) => [
            ...prev,
            { level: "info", text: `=> ${event.result}`, time: new Date().toLocaleTimeString() },
          ]);
        }
      } else if (event.type === "RUN_ERROR" || event.type === "TIMEOUT" || event.type === "ERROR") {
        setIsExecuting(false);
        const classified = classifyRuntimeError(event.error);
        setConsoleLogs((prev) => [
          ...prev,
          {
            level: "error",
            text: `[${classified.category}] ${classified.message}`,
            time: new Date().toLocaleTimeString(),
          },
        ]);
      }
    });

    return () => unsubscribe();
  }, [mode]);

  // Run Code handler
  const handleRun = useCallback(() => {
    setIsExecuting(true);
    setConsoleLogs([]);

    if (mode === "python") {
      setActiveOutputTab("console");
      defaultPythonManager.run(pythonCode);
      return;
    }

    const newNonce = generateChannelNonce();
    channelNonceRef.current = newNonce;

    const combinedHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    ${cssCode}
  </style>
</head>
<body>
  ${htmlCode}
  <script>
    (function() {
      const nonce = "${newNonce}";
      function send(type, level, text) {
        window.parent.postMessage({ type, level, text, nonce }, "*");
      }
      const origLog = console.log;
      const origWarn = console.warn;
      const origError = console.error;
      console.log = function(...args) { origLog.apply(console, args); send("MYJOURNEY_SANDBOX_CONSOLE", "log", args.map(String).join(" ")); };
      console.warn = function(...args) { origWarn.apply(console, args); send("MYJOURNEY_SANDBOX_CONSOLE", "warn", args.map(String).join(" ")); };
      console.error = function(...args) { origError.apply(console, args); send("MYJOURNEY_SANDBOX_CONSOLE", "error", args.map(String).join(" ")); };
      window.onerror = function(msg, url, line) {
        send("MYJOURNEY_SANDBOX_ERROR", "error", msg + " (line " + line + ")");
      };
      window.onload = function() {
        send("MYJOURNEY_SANDBOX_READY", "info", "ready");
      };
    })();
    try {
      ${jsCode}
    } catch(err) {
      console.error(err.message);
    }
  </script>
</body>
</html>`;

    setSrcdoc(combinedHtml);
    setTimeout(() => setIsExecuting(false), 300);
  }, [mode, pythonCode, htmlCode, cssCode, jsCode]);

  // Initial Run on Load for Web
  useEffect(() => {
    if (mode === "web") {
      handleRun();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Full Screen Preview New Tab
  const handleOpenFullPreview = () => {
    const sessionId = "pg_" + Math.random().toString(36).slice(2, 10);
    try {
      sessionStorage.setItem(
        `coding_preview_${sessionId}`,
        JSON.stringify({
          sourceType: "playground_web",
          code: htmlCode,
          styles: cssCode,
          script: jsCode,
          title: "Playground Project",
        })
      );
      window.open(`/coding/preview/${sessionId}`, "_blank");
    } catch (e) {
      console.error("Failed to store preview session:", e);
    }
  };

  // Switch Mode (Web / Python)
  const handleSwitchMode = (newMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    setConsoleLogs([]);
    if (newMode === "python") {
      setActiveOutputTab("console");
    } else {
      setActiveOutputTab("preview");
    }
  };

  // Reset confirmation
  const handleConfirmReset = () => {
    if (mode === "web") {
      setHtmlCode(DEFAULT_WEB.html);
      setCssCode(DEFAULT_WEB.css);
      setJsCode(DEFAULT_WEB.js);
      try {
        localStorage.removeItem("coding_playground_html");
        localStorage.removeItem("coding_playground_css");
        localStorage.removeItem("coding_playground_js");
      } catch {}
    } else {
      setPythonCode(DEFAULT_PYTHON);
      try {
        localStorage.removeItem("coding_playground_python");
      } catch {}
    }
    setConsoleLogs([]);
    setResetConfirmOpen(false);
  };

  // Resize handler
  const handleResizeHorizontal = (nextPercent) => {
    const next = Math.min(80, Math.max(20, Number(nextPercent.toFixed(1))));
    setEditorHeightPercent(next);
    try {
      localStorage.setItem("coding_playground_split_h", String(next));
    } catch {}
  };

  const handleHtmlChange = (val) => {
    setHtmlCode(val);
    try {
      localStorage.setItem("coding_playground_html", val);
    } catch {}
  };

  const handleCssChange = (val) => {
    setCssCode(val);
    try {
      localStorage.setItem("coding_playground_css", val);
    } catch {}
  };

  const handleJsChange = (val) => {
    setJsCode(val);
    try {
      localStorage.setItem("coding_playground_js", val);
    } catch {}
  };

  const handlePythonChange = (val) => {
    setPythonCode(val);
    try {
      localStorage.setItem("coding_playground_python", val);
    } catch {}
  };

  // Active Code and Language for Editor
  const currentEditorProps = useMemo(() => {
    if (mode === "python") {
      return {
        value: pythonCode,
        onChange: handlePythonChange,
        language: "python",
      };
    }
    if (activeWebTab === "css") {
      return {
        value: cssCode,
        onChange: handleCssChange,
        language: "css",
      };
    }
    if (activeWebTab === "js") {
      return {
        value: jsCode,
        onChange: handleJsChange,
        language: "javascript",
      };
    }
    return {
      value: htmlCode,
      onChange: handleHtmlChange,
      language: "html",
    };
  }, [mode, activeWebTab, pythonCode, htmlCode, cssCode, jsCode]);

  return (
    <div
      className="coding-page"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <CodingSubNav />

      {/* Playground Top Action Bar */}
      <header
        style={{
          background: "var(--cd-surface)",
          borderBottom: "1px solid var(--cd-border)",
          padding: "0.5rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "1.1rem" }}>⚡</span>
            <h1 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "#f8fafc" }}>
              Code Playground
            </h1>
          </div>

          {/* Mode Switcher */}
          <div
            style={{
              display: "flex",
              background: "#060911",
              borderRadius: "6px",
              padding: "2px",
              border: "1px solid #1e293b",
            }}
          >
            <button
              type="button"
              onClick={() => handleSwitchMode("web")}
              className={`cd-btn cd-btn--xs ${mode === "web" ? "cd-btn--primary" : "cd-btn--ghost"}`}
              style={{ padding: "0.25rem 0.65rem", fontSize: "0.75rem", borderRadius: "4px" }}
            >
              Web (HTML / CSS / JS)
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode("python")}
              className={`cd-btn cd-btn--xs ${mode === "python" ? "cd-btn--primary" : "cd-btn--ghost"}`}
              style={{ padding: "0.25rem 0.65rem", fontSize: "0.75rem", borderRadius: "4px" }}
            >
              Python (Pyodide)
            </button>
          </div>

          {mode === "python" && (
            <span style={{ fontSize: "0.75rem", color: "var(--cd-text-muted)" }}>
              Pyodide: <strong>{pythonStatus}</strong>
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <button
            type="button"
            className="cd-btn cd-btn--secondary"
            style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
            onClick={() => setResetConfirmOpen(true)}
            title="Reset code to defaults"
          >
            <FiRefreshCw /> Reset
          </button>

          <button
            type="button"
            className="cd-btn cd-btn--primary"
            style={{ padding: "0.35rem 1.15rem", fontSize: "0.8rem" }}
            onClick={handleRun}
            disabled={isExecuting}
            title="Run Code (Ctrl+Enter)"
          >
            <FiPlay /> {isExecuting ? "Running…" : "Run Code"}
          </button>
        </div>
      </header>

      {/* Main Split Body */}
      <main
        ref={playgroundWorkspaceRef}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* Top Half: Code Editor Pane */}
        <div
          className="cd-editor-pane"
          style={{
            display: maximizedPanel === "output" ? "none" : "flex",
            flexDirection: "column",
            height: maximizedPanel === "editor" ? "100%" : `${editorHeightPercent}%`,
            flex: maximizedPanel === "editor" ? "1 1 100%" : `0 0 ${editorHeightPercent}%`,
            minHeight: 0,
            background: "#080c14",
          }}
        >
          {/* File Tabs Bar (Web Mode) / Main.py Bar (Python Mode) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#0a0e1a",
              borderBottom: "1px solid #1e293b",
              padding: "0 0.75rem",
              height: "36px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              {mode === "web" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveWebTab("html")}
                    className={`cd-output-tab-btn ${activeWebTab === "html" ? "is-active" : ""}`}
                    style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem" }}
                  >
                    index.html
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveWebTab("css")}
                    className={`cd-output-tab-btn ${activeWebTab === "css" ? "is-active" : ""}`}
                    style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem" }}
                  >
                    styles.css
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveWebTab("js")}
                    className={`cd-output-tab-btn ${activeWebTab === "js" ? "is-active" : ""}`}
                    style={{ fontSize: "0.78rem", padding: "0.35rem 0.75rem" }}
                  >
                    script.js
                  </button>
                </>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontSize: "0.8rem",
                    color: "#38bdf8",
                    fontWeight: 600,
                  }}
                >
                  <FiFileText size={14} /> main.py
                </div>
              )}
            </div>

            {/* Maximize Editor Button */}
            <button
              type="button"
              className="cd-btn cd-btn--ghost cd-btn--xs"
              onClick={() => setMaximizedPanel((curr) => (curr === "editor" ? null : "editor"))}
              title={maximizedPanel === "editor" ? "Restore split layout" : "Maximize Code Editor"}
              aria-label={maximizedPanel === "editor" ? "Restore workspace" : "Maximize editor"}
            >
              {maximizedPanel === "editor" ? <FiMinimize2 size={13} /> : <FiMaximize2 size={13} />}
            </button>
          </div>

          {/* Code Editor Surface */}
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
            <WorkspaceCodeEditor
              value={currentEditorProps.value}
              onChange={currentEditorProps.onChange}
              language={currentEditorProps.language}
              onRun={handleRun}
              disabled={isExecuting}
            />
          </div>
        </div>

        {/* Resizable Horizontal Splitter */}
        {maximizedPanel === null && (
          <WorkspaceSplitter
            orientation="horizontal"
            currentPercent={editorHeightPercent}
            minPercent={20}
            maxPercent={80}
            onResize={handleResizeHorizontal}
            containerRef={playgroundWorkspaceRef}
            onReset={() => {
              setEditorHeightPercent(52);
              try {
                localStorage.setItem("coding_playground_split_h", "52");
              } catch {}
            }}
            title="Drag to resize editor and output panes (Double-click to reset layout)"
          />
        )}

        {/* Bottom Half: Output Pane */}
        <div
          className="cd-output-pane"
          style={{
            display: maximizedPanel === "editor" ? "none" : "flex",
            flexDirection: "column",
            height:
              maximizedPanel === "output"
                ? "100%"
                : `calc(100% - ${editorHeightPercent}% - 8px)`,
            flex: maximizedPanel === "output" ? "1 1 100%" : 1,
            minHeight: 0,
            background: "#080c14",
          }}
        >
          {/* Output Header with Tabs, Controls & Full Preview */}
          <div className="cd-output-tabs" role="tablist">
            <div className="cd-output-tabs__left">
              {mode === "web" && (
                <button
                  type="button"
                  className={`cd-output-tab-btn ${activeOutputTab === "preview" ? "is-active" : ""}`}
                  onClick={() => setActiveOutputTab("preview")}
                  role="tab"
                  aria-selected={activeOutputTab === "preview"}
                >
                  Live Preview
                </button>
              )}

              <button
                type="button"
                className={`cd-output-tab-btn ${activeOutputTab === "console" ? "is-active" : ""}`}
                onClick={() => setActiveOutputTab("console")}
                role="tab"
                aria-selected={activeOutputTab === "console"}
              >
                Console{" "}
                {consoleLogs.length > 0 && <span className="badge-count">{consoleLogs.length}</span>}
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {/* Clear Console button */}
              {activeOutputTab === "console" && (
                <button
                  type="button"
                  className="cd-btn cd-btn--ghost cd-btn--sm"
                  style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", gap: "0.3rem" }}
                  onClick={() => setConsoleLogs([])}
                  title="Clear console output"
                >
                  <FiTrash2 size={13} />
                  <span>Clear</span>
                </button>
              )}

              {/* Open Preview in New Tab (Web mode) */}
              {mode === "web" && activeOutputTab === "preview" && (
                <button
                  type="button"
                  className="cd-btn cd-btn--ghost cd-btn--sm"
                  style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", gap: "0.3rem" }}
                  onClick={handleOpenFullPreview}
                  title="Open live preview in full standalone tab"
                >
                  <FiExternalLink size={13} />
                  <span>Open Preview ↗</span>
                </button>
              )}

              {/* Device switcher (visible in Web Preview) */}
              {mode === "web" && activeOutputTab === "preview" && (
                <div className="cd-device-switcher" aria-label="Preview viewport size">
                  <button
                    type="button"
                    className={`cd-device-btn ${previewDevice === "desktop" ? "is-active" : ""}`}
                    onClick={() => setPreviewDevice("desktop")}
                    title="Desktop view"
                    aria-label="Desktop preview"
                  >
                    <FiMonitor />
                  </button>
                  <button
                    type="button"
                    className={`cd-device-btn ${previewDevice === "tablet" ? "is-active" : ""}`}
                    onClick={() => setPreviewDevice("tablet")}
                    title="Tablet view (768px)"
                    aria-label="Tablet preview"
                  >
                    <FiTablet />
                  </button>
                  <button
                    type="button"
                    className={`cd-device-btn ${previewDevice === "mobile" ? "is-active" : ""}`}
                    onClick={() => setPreviewDevice("mobile")}
                    title="Mobile view (375px)"
                    aria-label="Mobile preview"
                  >
                    <FiSmartphone />
                  </button>
                </div>
              )}

              {/* Maximize Output Button */}
              <button
                type="button"
                className="cd-btn cd-btn--secondary"
                style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                onClick={() => setMaximizedPanel((curr) => (curr === "output" ? null : "output"))}
                title={maximizedPanel === "output" ? "Restore workspace layout" : "Maximize Output Panel"}
                aria-label={maximizedPanel === "output" ? "Restore workspace" : "Maximize output"}
              >
                {maximizedPanel === "output" ? <FiMinimize2 size={13} /> : <FiMaximize2 size={13} />}
              </button>
            </div>
          </div>

          {/* Output Content Body */}
          <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex" }}>
            {mode === "web" && activeOutputTab === "preview" && (
              <div className="cd-browser-mockup">
                <div className="cd-browser-mockup__chrome">
                  <div className="cd-browser-mockup__dots">
                    <span className="cd-browser-mockup__dot cd-browser-mockup__dot--red" />
                    <span className="cd-browser-mockup__dot cd-browser-mockup__dot--yellow" />
                    <span className="cd-browser-mockup__dot cd-browser-mockup__dot--green" />
                  </div>
                  <div className="cd-browser-mockup__url">http://playground.local/app</div>
                </div>
                <div className="cd-browser-mockup__viewport">
                  <div className={`cd-browser-mockup__frame-container is-${previewDevice}`}>
                    <iframe
                      ref={iframeRef}
                      title="Playground Live Output"
                      sandbox="allow-scripts"
                      srcDoc={srcdoc}
                      className="cd-browser-mockup__iframe"
                    />
                  </div>
                </div>
              </div>
            )}

            {(mode === "python" || activeOutputTab === "console") && (
              <div className="cd-console-body">
                {consoleLogs.length === 0 ? (
                  <p style={{ color: "var(--cd-text-muted)", margin: 0, padding: "1rem" }}>
                    {mode === "python"
                      ? "Python output will appear here. Click 'Run Code' to execute."
                      : "Console is clear. Console messages and errors will appear here."}
                  </p>
                ) : (
                  consoleLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`cd-console-entry ${
                        log.level === "error"
                          ? "cd-console-entry--error"
                          : log.level === "info"
                          ? "cd-console-entry--info"
                          : log.level === "warn"
                          ? "cd-console-entry--warn"
                          : "cd-console-entry--log"
                      }`}
                    >
                      <span style={{ opacity: 0.5, fontSize: "0.75rem", marginRight: "0.5rem" }}>
                        {log.time}
                      </span>
                      <span>{log.level === "error" ? "✖" : "›"}</span>
                      <span style={{ marginLeft: "0.35rem" }}>{log.text}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Reset Confirmation Dialog */}
      {resetConfirmOpen && (
        <div className="cd-confirm-dialog-overlay" onClick={() => setResetConfirmOpen(false)}>
          <div
            className="cd-confirm-dialog"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className="cd-confirm-dialog__header">
              <FiAlertTriangle size={20} className="cd-icon-amber" />
              <h4>Reset {mode === "web" ? "Web Files" : "Python Code"}?</h4>
            </div>
            <p className="cd-confirm-dialog__message">
              This will reset your{" "}
              {mode === "web" ? "HTML, CSS, and JS files" : "Python file"} back to the starter templates.
              Any custom code in this playground will be lost.
            </p>
            <div className="cd-confirm-dialog__footer">
              <button
                type="button"
                className="cd-btn cd-btn--ghost"
                onClick={() => setResetConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cd-btn cd-btn--danger"
                onClick={handleConfirmReset}
              >
                Reset Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
