import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  FiArrowLeft,
  FiRotateCw,
  FiMonitor,
  FiTablet,
  FiSmartphone,
  FiLock,
  FiAlertCircle,
} from "react-icons/fi";

export default function CodingFullPreviewPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [viewport, setViewport] = useState("desktop"); // "desktop" | "tablet" | "mobile"
  const [refreshKey, setRefreshKey] = useState(0);
  const [previewData, setPreviewData] = useState(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(`coding_preview_${sessionId}`);
      if (stored) {
        setPreviewData(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load preview session:", e);
    } finally {
      setHasLoaded(true);
    }
  }, [sessionId]);

  const htmlContent = useMemo(() => {
    if (!previewData) return "";
    const { sourceType, code = "", styles = "", script = "", language = "html", previewFixture = "" } = previewData;

    if (sourceType === "playground_web") {
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 1rem; color: #1e293b; background: #fff; }
    ${styles}
  </style>
</head>
<body>
  ${code}
  <script>
    window.onerror = function(msg, url, line) {
      console.error("Error: " + msg + " at line " + line);
    };
    try {
      ${script}
    } catch(err) {
      console.error(err);
    }
  </script>
</body>
</html>`;
    }

    if (sourceType === "lesson" || sourceType === "lesson_html") {
      if (language === "html") {
        if (/<!DOCTYPE\s+html>/i.test(code) || /<html[\s>]/i.test(code)) {
          return code;
        }
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 1.5rem; color: #1e293b; background: #ffffff; }
  </style>
</head>
<body>
  ${code}
</body>
</html>`;
      }

      if (language === "css") {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 1.5rem; color: #1e293b; background: #ffffff; }
    ${code}
  </style>
</head>
<body>
  ${previewFixture || `
    <div class="card">
      <h2>CSS Preview Test</h2>
      <p>Your styles will style elements on this page.</p>
      <button class="btn">Button Example</button>
    </div>
  `}
</body>
</html>`;
      }

      if (language === "javascript") {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 1.5rem; color: #1e293b; background: #ffffff; }
    #output { padding: 1rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin-top: 1rem; }
  </style>
</head>
<body>
  ${previewFixture || `<div id="app"><h3>JavaScript Sandbox</h3><div id="output">Output will render here.</div></div>`}
  <script>
    try {
      ${code}
    } catch(err) {
      document.body.innerHTML += '<div style="color:red;margin-top:1rem;">Error: ' + err.message + '</div>';
      console.error(err);
    }
  </script>
</body>
</html>`;
      }
    }

    return `<!DOCTYPE html><html><body style="font-family:sans-serif;padding:2rem;"><h3>Preview Content</h3><pre>${code}</pre></body></html>`;
  }, [previewData]);

  const handleReturn = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/coding");
    }
  };

  const getFrameWidth = () => {
    if (viewport === "mobile") return "375px";
    if (viewport === "tablet") return "768px";
    return "100%";
  };

  if (!hasLoaded) return null;

  if (!previewData) {
    return (
      <div className="cd-full-preview-empty">
        <FiAlertCircle size={48} className="cd-full-preview-empty__icon" />
        <h2>Preview Session Expired</h2>
        <p>This preview session is no longer available in memory or has timed out.</p>
        <button onClick={() => navigate("/coding")} className="cd-btn cd-btn--primary">
          Return to Coding Hub
        </button>
      </div>
    );
  }

  return (
    <div className="cd-full-preview-page">
      {/* Top Browser Bar */}
      <header className="cd-full-preview-nav">
        <div className="cd-full-preview-nav__left">
          <button
            onClick={handleReturn}
            className="cd-btn cd-btn--ghost cd-btn--sm"
            title="Return to Workspace"
          >
            <FiArrowLeft size={16} />
            <span>Return</span>
          </button>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="cd-btn cd-btn--icon cd-btn--sm"
            title="Refresh Preview"
          >
            <FiRotateCw size={15} />
          </button>
        </div>

        {/* Browser Mockup URL Address Bar */}
        <div className="cd-full-preview-address-bar">
          <FiLock size={12} className="cd-full-preview-address-bar__lock" />
          <span className="cd-full-preview-address-bar__url">
            https://myjourney.local/preview/{previewData.title ? encodeURIComponent(previewData.title.toLowerCase().replace(/\s+/g, "-")) : sessionId}
          </span>
        </div>

        {/* Viewport switchers */}
        <div className="cd-full-preview-nav__right">
          <div className="cd-viewport-switchers">
            <button
              onClick={() => setViewport("desktop")}
              className={`cd-viewport-btn ${viewport === "desktop" ? "cd-viewport-btn--active" : ""}`}
              title="Desktop View (100%)"
            >
              <FiMonitor size={15} />
              <span>Desktop</span>
            </button>
            <button
              onClick={() => setViewport("tablet")}
              className={`cd-viewport-btn ${viewport === "tablet" ? "cd-viewport-btn--active" : ""}`}
              title="Tablet View (768px)"
            >
              <FiTablet size={15} />
              <span>Tablet</span>
            </button>
            <button
              onClick={() => setViewport("mobile")}
              className={`cd-viewport-btn ${viewport === "mobile" ? "cd-viewport-btn--active" : ""}`}
              title="Mobile View (375px)"
            >
              <FiSmartphone size={15} />
              <span>Mobile</span>
            </button>
          </div>
        </div>
      </header>

      {/* Frame Stage */}
      <main className="cd-full-preview-stage">
        <div
          className={`cd-full-preview-frame-container cd-full-preview-frame-container--${viewport}`}
          style={{ width: getFrameWidth() }}
        >
          <iframe
            key={refreshKey}
            ref={iframeRef}
            srcDoc={htmlContent}
            title="MyJourney Coding Full Preview"
            sandbox="allow-scripts allow-modals"
            className="cd-full-preview-iframe"
          />
        </div>
      </main>
    </div>
  );
}

